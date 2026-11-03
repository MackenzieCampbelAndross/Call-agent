package com.purpledrive.dialer.ui

import android.Manifest
import android.app.role.RoleManager
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.telecom.TelecomManager
import android.text.Editable
import android.text.TextWatcher
import android.view.HapticFeedbackConstants
import android.view.View
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.google.android.material.bottomsheet.BottomSheetDialog
import com.purpledrive.dialer.DialerApplication
import com.purpledrive.dialer.R
import com.purpledrive.dialer.data.local.CallRecordEntity
import com.purpledrive.dialer.databinding.ActivityMainBinding
import com.purpledrive.dialer.databinding.DialogContactDetailsBinding
import com.purpledrive.dialer.databinding.ViewContactsBinding
import com.purpledrive.dialer.databinding.ViewKeypadBinding
import com.purpledrive.dialer.databinding.ViewRecentsBinding
import com.purpledrive.dialer.domain.model.DeviceContact
import com.purpledrive.dialer.domain.model.OutgoingCallRequest
import com.purpledrive.dialer.ui.adapter.ContactsAdapter
import com.purpledrive.dialer.ui.adapter.KeypadSuggestionsAdapter
import com.purpledrive.dialer.ui.adapter.RecentCallsAdapter
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private val app by lazy { application as DialerApplication }

    // Child Section Bindings
    private lateinit var recentsBinding: ViewRecentsBinding
    private lateinit var contactsBinding: ViewContactsBinding
    private lateinit var keypadBinding: ViewKeypadBinding

    // Adapters
    private lateinit var recentCallsAdapter: RecentCallsAdapter
    private lateinit var contactsAdapter: ContactsAdapter
    private lateinit var keypadSuggestionsAdapter: KeypadSuggestionsAdapter

    // State
    private var allCallRecords: List<CallRecordEntity> = emptyList()
    private var showMissedOnly = false
    private var currentDialerInput = StringBuilder()
    private var selectedSimSlot = 0

    // Permissions & Role Launchers
    private val contactsPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            loadContacts()
        } else {
            contactsBinding.layoutPermissionRequired.visibility = View.VISIBLE
            contactsBinding.rvContacts.visibility = View.GONE
        }
    }

    private val defaultDialerRoleLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { _ ->
        checkDefaultDialerRole()
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        if (!app.authPreferences.isLoggedIn) {
            startActivity(Intent(this, LoginActivity::class.java))
            finish()
            return
        }

        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Edge-to-edge system insets handling: adjust top banner/content padding for status bar & gesture navigation
        WindowCompat.setDecorFitsSystemWindows(window, false)
        ViewCompat.setOnApplyWindowInsetsListener(binding.mainRoot) { _, windowInsets ->
            val insets = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars())
            binding.bannerDefaultDialer.setPadding(
                binding.bannerDefaultDialer.paddingLeft,
                insets.top,
                binding.bannerDefaultDialer.paddingRight,
                binding.bannerDefaultDialer.paddingBottom
            )
            // If banner is hidden, pad contentContainer top with insets.top
            if (binding.bannerDefaultDialer.visibility == View.GONE) {
                binding.contentContainer.setPadding(0, insets.top, 0, 0)
            } else {
                binding.contentContainer.setPadding(0, 0, 0, 0)
            }
            // Pad bottom navigation safely above system gesture / 3-button navigation
            binding.bottomNavigation.setPadding(0, 0, 0, insets.bottom)
            windowInsets
        }

        initChildViews()
        setupBottomNavigation()
        setupRecentsSection()
        setupContactsSection()
        setupKeypadSection()

        checkDefaultDialerRole()
        handleIncomingIntent(intent)

        binding.btnSetDefaultDialer.setOnClickListener {
            requestDefaultDialerRole()
        }

        // Show Keypad by default on fresh open
        switchSection(R.id.nav_keypad)
    }

    private fun initChildViews() {
        recentsBinding = ViewRecentsBinding.inflate(layoutInflater, binding.contentContainer, false)
        contactsBinding = ViewContactsBinding.inflate(layoutInflater, binding.contentContainer, false)
        keypadBinding = ViewKeypadBinding.inflate(layoutInflater, binding.contentContainer, false)
    }

    private fun setupBottomNavigation() {
        binding.bottomNavigation.setOnItemSelectedListener { item ->
            switchSection(item.itemId)
            true
        }
    }

    private fun switchSection(itemId: Int) {
        binding.contentContainer.removeAllViews()
        when (itemId) {
            R.id.nav_recents -> {
                binding.contentContainer.addView(recentsBinding.root)
            }
            R.id.nav_contacts -> {
                binding.contentContainer.addView(contactsBinding.root)
                checkContactsPermissionAndLoad()
            }
            R.id.nav_keypad -> {
                binding.contentContainer.addView(keypadBinding.root)
            }
        }
    }

    // --- SECTION 1: RECENTS ---

    private fun setupRecentsSection() {
        recentCallsAdapter = RecentCallsAdapter(
            onCallClick = { record ->
                placeCellularCall(record.phoneNumber)
            },
            onInfoClick = { record ->
                showCallRecordDetailSheet(record)
            }
        )

        recentsBinding.rvRecentCalls.apply {
            layoutManager = LinearLayoutManager(this@MainActivity)
            adapter = recentCallsAdapter
        }

        recentsBinding.tabFilterAll.setOnClickListener {
            showMissedOnly = false
            recentsBinding.tabFilterAll.setBackgroundResource(R.drawable.bg_search_input)
            recentsBinding.tabFilterAll.setTextColor(ContextCompat.getColor(this, R.color.text_primary))
            recentsBinding.tabFilterMissed.background = null
            recentsBinding.tabFilterMissed.setTextColor(ContextCompat.getColor(this, R.color.text_muted))
            filterAndDisplayRecents()
        }

        recentsBinding.tabFilterMissed.setOnClickListener {
            showMissedOnly = true
            recentsBinding.tabFilterMissed.setBackgroundResource(R.drawable.bg_search_input)
            recentsBinding.tabFilterMissed.setTextColor(ContextCompat.getColor(this, R.color.text_primary))
            recentsBinding.tabFilterAll.background = null
            recentsBinding.tabFilterAll.setTextColor(ContextCompat.getColor(this, R.color.text_muted))
            filterAndDisplayRecents()
        }

        lifecycleScope.launch {
            app.database.callRecordDao().getAllRecords().collectLatest { entities ->
                allCallRecords = entities
                filterAndDisplayRecents()
            }
        }
    }

    private fun filterAndDisplayRecents() {
        val filtered = if (showMissedOnly) {
            allCallRecords.filter { it.outcome.equals("MISSED", ignoreCase = true) || it.outcome.equals("REJECTED", ignoreCase = true) }
        } else {
            allCallRecords
        }

        recentCallsAdapter.submitList(filtered)
        if (filtered.isEmpty()) {
            recentsBinding.layoutEmptyRecents.visibility = View.VISIBLE
            recentsBinding.rvRecentCalls.visibility = View.GONE
        } else {
            recentsBinding.layoutEmptyRecents.visibility = View.GONE
            recentsBinding.rvRecentCalls.visibility = View.VISIBLE
        }
    }

    private fun showCallRecordDetailSheet(record: CallRecordEntity) {
        val sheetDialog = BottomSheetDialog(this)
        val sheetBinding = DialogContactDetailsBinding.inflate(layoutInflater)
        sheetDialog.setContentView(sheetBinding.root)

        val name = record.contactName ?: record.phoneNumber
        sheetBinding.tvSheetName.text = name
        sheetBinding.tvSheetNumber.text = record.phoneNumber
        sheetBinding.tvSheetSub.text = "${record.direction} • ${record.outcome} (${record.connectedDurationSeconds}s)"

        val initials = if (!record.contactName.isNullOrBlank()) {
            record.contactName.take(2).uppercase()
        } else "#"
        sheetBinding.tvSheetAvatar.text = initials

        sheetBinding.btnSheetCall.setOnClickListener {
            sheetDialog.dismiss()
            placeCellularCall(record.phoneNumber)
        }

        sheetBinding.btnSheetCopy.setOnClickListener {
            copyToClipboard(record.phoneNumber)
            sheetDialog.dismiss()
        }

        sheetDialog.show()
    }

    // --- SECTION 2: CONTACTS ---

    private fun setupContactsSection() {
        contactsAdapter = ContactsAdapter(
            onContactClick = { contact ->
                showContactDetailSheet(contact)
            },
            onCallClick = { contact ->
                placeCellularCall(contact.primaryPhoneNumber)
            }
        )

        contactsBinding.rvContacts.apply {
            layoutManager = LinearLayoutManager(this@MainActivity)
            adapter = contactsAdapter
        }

        contactsBinding.etSearchContacts.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                loadContacts(s?.toString())
            }
            override fun afterTextChanged(s: Editable?) {}
        })

        contactsBinding.btnGrantContactsPermission.setOnClickListener {
            contactsPermissionLauncher.launch(Manifest.permission.READ_CONTACTS)
        }
    }

    private fun checkContactsPermissionAndLoad() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_CONTACTS) == PackageManager.PERMISSION_GRANTED) {
            contactsBinding.layoutPermissionRequired.visibility = View.GONE
            contactsBinding.rvContacts.visibility = View.VISIBLE
            loadContacts()
        } else {
            contactsBinding.layoutPermissionRequired.visibility = View.VISIBLE
            contactsBinding.rvContacts.visibility = View.GONE
            contactsPermissionLauncher.launch(Manifest.permission.READ_CONTACTS)
        }
    }

    private fun loadContacts(query: String? = null) {
        lifecycleScope.launch {
            val contacts = app.contactsRepository.getDeviceContacts(query)
            contactsAdapter.submitList(contacts)
            if (contacts.isEmpty()) {
                contactsBinding.layoutEmptyContacts.visibility = View.VISIBLE
                contactsBinding.rvContacts.visibility = View.GONE
            } else {
                contactsBinding.layoutEmptyContacts.visibility = View.GONE
                contactsBinding.rvContacts.visibility = View.VISIBLE
            }
        }
    }

    private fun showContactDetailSheet(contact: DeviceContact) {
        val sheetDialog = BottomSheetDialog(this)
        val sheetBinding = DialogContactDetailsBinding.inflate(layoutInflater)
        sheetDialog.setContentView(sheetBinding.root)

        sheetBinding.tvSheetName.text = contact.name
        sheetBinding.tvSheetNumber.text = contact.primaryPhoneNumber
        sheetBinding.tvSheetAvatar.text = contact.initials
        sheetBinding.tvSheetSub.text = "Cellular Contact"

        sheetBinding.btnSheetCall.setOnClickListener {
            sheetDialog.dismiss()
            placeCellularCall(contact.primaryPhoneNumber)
        }

        sheetBinding.btnSheetCopy.setOnClickListener {
            copyToClipboard(contact.primaryPhoneNumber)
            sheetDialog.dismiss()
        }

        sheetDialog.show()
    }

    // --- SECTION 3: KEYPAD ---

    private fun setupKeypadSection() {
        keypadSuggestionsAdapter = KeypadSuggestionsAdapter { suggestion ->
            currentDialerInput.clear().append(suggestion.primaryPhoneNumber)
            updateDialerDisplay()
        }

        keypadBinding.rvKeypadSuggestions.apply {
            layoutManager = LinearLayoutManager(this@MainActivity, LinearLayoutManager.HORIZONTAL, false)
            adapter = keypadSuggestionsAdapter
        }

        val keys = listOf(
            keypadBinding.key1 to "1",
            keypadBinding.key2 to "2",
            keypadBinding.key3 to "3",
            keypadBinding.key4 to "4",
            keypadBinding.key5 to "5",
            keypadBinding.key6 to "6",
            keypadBinding.key7 to "7",
            keypadBinding.key8 to "8",
            keypadBinding.key9 to "9",
            keypadBinding.keyStar to "*",
            keypadBinding.key0 to "0",
            keypadBinding.keyHash to "#"
        )

        for ((view, digit) in keys) {
            view.setOnClickListener {
                it.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                currentDialerInput.append(digit)
                updateDialerDisplay()
            }
        }

        keypadBinding.key0.setOnLongClickListener {
            it.performHapticFeedback(HapticFeedbackConstants.LONG_PRESS)
            currentDialerInput.append("+")
            updateDialerDisplay()
            true
        }

        keypadBinding.btnDialerBackspace.setOnClickListener {
            it.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
            if (currentDialerInput.isNotEmpty()) {
                currentDialerInput.deleteCharAt(currentDialerInput.length - 1)
                updateDialerDisplay()
            }
        }

        keypadBinding.btnDialerBackspace.setOnLongClickListener {
            it.performHapticFeedback(HapticFeedbackConstants.LONG_PRESS)
            currentDialerInput.clear()
            updateDialerDisplay()
            true
        }

        keypadBinding.btnInitiateCall.setOnClickListener {
            it.performHapticFeedback(HapticFeedbackConstants.CONFIRM)
            val number = currentDialerInput.toString().trim()
            if (number.isNotEmpty()) {
                placeCellularCall(number)
            } else {
                Toast.makeText(this, "Please enter a phone number", Toast.LENGTH_SHORT).show()
            }
        }

        keypadBinding.btnSimSelector.setOnClickListener {
            toggleSimSlot()
        }
    }

    private fun updateDialerDisplay() {
        val text = currentDialerInput.toString()
        keypadBinding.tvDialerInput.text = text
        keypadBinding.btnDialerBackspace.visibility = if (text.isNotEmpty()) View.VISIBLE else View.INVISIBLE

        if (text.length >= 2 && ContextCompat.checkSelfPermission(this, Manifest.permission.READ_CONTACTS) == PackageManager.PERMISSION_GRANTED) {
            lifecycleScope.launch {
                val matches = app.contactsRepository.getDeviceContacts(text)
                if (matches.isNotEmpty()) {
                    keypadSuggestionsAdapter.submitList(matches)
                    keypadBinding.rvKeypadSuggestions.visibility = View.VISIBLE
                } else {
                    keypadBinding.rvKeypadSuggestions.visibility = View.INVISIBLE
                }
            }
        } else {
            keypadBinding.rvKeypadSuggestions.visibility = View.INVISIBLE
        }
    }

    private fun toggleSimSlot() {
        selectedSimSlot = if (selectedSimSlot == 0) 1 else 0
        val label = if (selectedSimSlot == 0) "SIM 1 (Cellular)" else "SIM 2 (Cellular)"
        keypadBinding.tvActiveSimLabel.text = label
        Toast.makeText(this, "Active cellular SIM: $label", Toast.LENGTH_SHORT).show()
    }

    private fun placeCellularCall(phoneNumber: String) {
        val clean = phoneNumber.trim()
        if (clean.isEmpty()) return

        try {
            app.telephonyAdapter.initiateCall(
                OutgoingCallRequest(
                    phoneNumber = clean,
                    simSlotIndex = selectedSimSlot
                )
            )
        } catch (e: Exception) {
            Toast.makeText(this, "Failed to place cellular call: ${e.message}", Toast.LENGTH_LONG).show()
        }
    }

    private fun copyToClipboard(text: String) {
        val clipboard = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        val clip = ClipData.newPlainText("Phone Number", text)
        clipboard.setPrimaryClip(clip)
        Toast.makeText(this, "Phone number copied to clipboard", Toast.LENGTH_SHORT).show()
    }

    private fun checkDefaultDialerRole() {
        val telecomManager = getSystemService(Context.TELECOM_SERVICE) as TelecomManager
        val isDefault = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val roleManager = getSystemService(Context.ROLE_SERVICE) as RoleManager
            roleManager.isRoleHeld(RoleManager.ROLE_DIALER)
        } else {
            telecomManager.defaultDialerPackage == packageName
        }

        binding.bannerDefaultDialer.visibility = if (isDefault) View.GONE else View.VISIBLE
    }

    private fun requestDefaultDialerRole() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val roleManager = getSystemService(Context.ROLE_SERVICE) as RoleManager
            val intent = roleManager.createRequestRoleIntent(RoleManager.ROLE_DIALER)
            defaultDialerRoleLauncher.launch(intent)
        } else {
            val intent = Intent(TelecomManager.ACTION_CHANGE_DEFAULT_DIALER).apply {
                putExtra(TelecomManager.EXTRA_CHANGE_DEFAULT_DIALER_PACKAGE_NAME, packageName)
            }
            defaultDialerRoleLauncher.launch(intent)
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleIncomingIntent(intent)
    }

    private fun handleIncomingIntent(intent: Intent?) {
        if (intent == null) return
        val data: Uri? = intent.data
        if (data != null && data.scheme == "tel") {
            val number = data.schemeSpecificPart
            currentDialerInput.clear().append(number)
            switchSection(R.id.nav_keypad)
            binding.bottomNavigation.selectedItemId = R.id.nav_keypad
            updateDialerDisplay()
        }
    }
}
