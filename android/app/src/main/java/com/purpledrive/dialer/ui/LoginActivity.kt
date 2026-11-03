package com.purpledrive.dialer.ui

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.os.CountDownTimer
import android.text.Editable
import android.text.SpannableString
import android.text.Spanned
import android.text.TextWatcher
import android.text.style.ForegroundColorSpan
import android.view.KeyEvent
import android.view.View
import android.view.animation.Animation
import android.view.animation.ScaleAnimation
import android.widget.EditText
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.lifecycle.lifecycleScope
import com.purpledrive.dialer.DialerApplication
import com.purpledrive.dialer.R
import com.purpledrive.dialer.databinding.ActivityLoginBinding
import kotlinx.coroutines.launch

class LoginActivity : AppCompatActivity() {

    private lateinit var binding: ActivityLoginBinding
    private val app by lazy { application as DialerApplication }

    private var currentEmail = "test@gmail.com"
    private var resendTimer: CountDownTimer? = null
    private lateinit var otpCells: List<EditText>

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // If already logged in, proceed straight to dialer
        if (app.authPreferences.isLoggedIn) {
            startActivity(Intent(this, MainActivity::class.java))
            finish()
            return
        }

        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Edge-to-edge system insets handling: pad content container safely away from status bar & gesture navigation
        WindowCompat.setDecorFitsSystemWindows(window, false)
        ViewCompat.setOnApplyWindowInsetsListener(binding.loginContentContainer) { view, windowInsets ->
            val insets = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.ime())
            view.setPadding(0, insets.top, 0, insets.bottom)
            windowInsets
        }

        otpCells = listOf(
            binding.otpCell1,
            binding.otpCell2,
            binding.otpCell3,
            binding.otpCell4,
            binding.otpCell5,
            binding.otpCell6
        )

        setupTypographySpans()
        setupScreen1Listeners()
        setupScreen2Listeners()
        setupOtpInputInteractions()

        showScreen1()
    }

    private fun setupTypographySpans() {
        // Screen 1: "Sign in\nto continue" with "to continue" in Purple
        val titleText = "Sign in\nto continue"
        val spannableTitle = SpannableString(titleText)
        val purpleColor = ContextCompat.getColor(this, R.color.login_purple_accent)
        val startIndex1 = titleText.indexOf("to continue")
        if (startIndex1 != -1) {
            spannableTitle.setSpan(
                ForegroundColorSpan(purpleColor),
                startIndex1,
                startIndex1 + "to continue".length,
                Spanned.SPAN_EXCLUSIVE_EXCLUSIVE
            )
        }
        binding.tvSignTitle.text = spannableTitle

        // Screen 2: "Enter the\n6-digit code" with "6-digit code" in Purple
        val otpTitleText = "Enter the\n6-digit code"
        val spannableOtpTitle = SpannableString(otpTitleText)
        val startIndex2 = otpTitleText.indexOf("6-digit code")
        if (startIndex2 != -1) {
            spannableOtpTitle.setSpan(
                ForegroundColorSpan(purpleColor),
                startIndex2,
                startIndex2 + "6-digit code".length,
                Spanned.SPAN_EXCLUSIVE_EXCLUSIVE
            )
        }
        binding.tvOtpTitle.text = spannableOtpTitle
    }

    private fun setupScreen1Listeners() {
        binding.btnRequestOtp.setOnClickListener {
            handleRequestOtp()
        }

        binding.tvFastFillTest.setOnClickListener {
            binding.etCorporateEmail.setText("test@gmail.com")
            handleRequestOtp()
        }
    }

    private fun setupScreen2Listeners() {
        binding.btnBackToEmail.setOnClickListener {
            showScreen1()
        }

        binding.btnUseDifferentEmail.setOnClickListener {
            showScreen1()
        }

        binding.btnVerifyOtp.setOnClickListener {
            handleVerifyOtp()
        }
    }

    private fun setupOtpInputInteractions() {
        for (i in otpCells.indices) {
            val cell = otpCells[i]

            cell.addTextChangedListener(object : TextWatcher {
                override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
                override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                    val text = s?.toString() ?: ""
                    // Handle paste of 6 digits into any cell
                    if (text.length > 1) {
                        distributeOtpString(text)
                        return
                    }

                    // Move focus forward on digit entry
                    if (text.isNotEmpty() && i < otpCells.size - 1) {
                        otpCells[i + 1].requestFocus()
                    }
                }
                override fun afterTextChanged(s: Editable?) {}
            })

            cell.setOnKeyListener { _, keyCode, event ->
                if (event.action == KeyEvent.ACTION_DOWN && keyCode == KeyEvent.KEYCODE_DEL) {
                    if (cell.text.isNullOrEmpty() && i > 0) {
                        otpCells[i - 1].requestFocus()
                        otpCells[i - 1].setText("")
                        return@setOnKeyListener true
                    }
                }
                false
            }
        }
    }

    private fun distributeOtpString(otp: String) {
        val digits = otp.filter { it.isDigit() }
        for (i in otpCells.indices) {
            if (i < digits.length) {
                otpCells[i].setText(digits[i].toString())
            }
        }
        val targetFocus = if (digits.length < otpCells.size) digits.length else otpCells.size - 1
        otpCells[targetFocus].requestFocus()
    }

    private fun getEnteredOtp(): String {
        val sb = StringBuilder()
        for (cell in otpCells) {
            sb.append(cell.text?.toString() ?: "")
        }
        return sb.toString().trim()
    }

    private fun handleRequestOtp() {
        val email = binding.etCorporateEmail.text?.toString()?.trim() ?: ""
        if (email.isEmpty()) {
            showScreen1Error("Please enter your corporate email address.")
            return
        }

        val normalized = email.lowercase()
        if (!normalized.endsWith("@purpledrive.com") && normalized != "test@gmail.com") {
            showScreen1Error("Only @purpledrive.com accounts are allowed to access this application.")
            return
        }

        currentEmail = normalized
        binding.tvErrorScreen1.visibility = View.GONE

        lifecycleScope.launch {
            val result = app.callRepository.sendOtp(normalized)
            result.onSuccess {
                showScreen2(normalized)
                if (normalized == "test@gmail.com") {
                    distributeOtpString("123456")
                }
            }.onFailure { err ->
                showScreen1Error(err.message ?: "Failed to send verification code. Check network connection.")
            }
        }
    }

    private fun handleVerifyOtp() {
        val otp = getEnteredOtp()
        if (otp.length < 6) {
            showScreen2Error("Please enter the complete 6-digit code.")
            return
        }

        binding.tvErrorScreen2.visibility = View.GONE
        showScreen3Verifying()

        lifecycleScope.launch {
            // Give 1.2s to show the smooth verifying orb transition
            kotlinx.coroutines.delay(1200)
            val result = app.callRepository.verifyOtp(currentEmail, otp)
            result.onSuccess {
                startActivity(Intent(this@LoginActivity, MainActivity::class.java))
                finish()
            }.onFailure { err ->
                showScreen2(currentEmail)
                showScreen2Error(err.message ?: "Invalid code. Please check and try again.")
            }
        }
    }

    private fun startResendCountdown() {
        resendTimer?.cancel()
        resendTimer = object : CountDownTimer(30000, 1000) {
            override fun onTick(millisUntilFinished: Long) {
                val sec = millisUntilFinished / 1000
                val formatted = String.format("%02d", sec)
                val fullText = "Didn't receive the code? Resend in 00:$formatted"
                val spannable = SpannableString(fullText)
                val purpleColor = ContextCompat.getColor(this@LoginActivity, R.color.login_purple_accent)
                val start = fullText.indexOf("Resend in")
                if (start != -1) {
                    spannable.setSpan(ForegroundColorSpan(purpleColor), start, fullText.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                }
                binding.tvResendPrompt.text = spannable
                binding.tvResendPrompt.isClickable = false
            }

            override fun onFinish() {
                val fullText = "Didn't receive the code? Resend Code"
                val spannable = SpannableString(fullText)
                val purpleColor = ContextCompat.getColor(this@LoginActivity, R.color.login_purple_accent)
                val start = fullText.indexOf("Resend Code")
                if (start != -1) {
                    spannable.setSpan(ForegroundColorSpan(purpleColor), start, fullText.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                }
                binding.tvResendPrompt.text = spannable
                binding.tvResendPrompt.isClickable = true
                binding.tvResendPrompt.setOnClickListener {
                    handleRequestOtp()
                }
            }
        }.start()
    }

    private fun showScreen1() {
        binding.layoutScreen1.visibility = View.VISIBLE
        binding.layoutScreen2.visibility = View.GONE
        binding.layoutScreen3.visibility = View.GONE
        binding.ivTopCurve.visibility = View.VISIBLE
        binding.ivBottomCurve.visibility = View.VISIBLE
        resendTimer?.cancel()
    }

    private fun showScreen2(email: String) {
        binding.layoutScreen1.visibility = View.GONE
        binding.layoutScreen2.visibility = View.VISIBLE
        binding.layoutScreen3.visibility = View.GONE
        binding.ivTopCurve.visibility = View.VISIBLE
        binding.ivBottomCurve.visibility = View.GONE
        binding.tvRecipientEmail.text = email
        binding.otpCell1.requestFocus()
        startResendCountdown()
    }

    private fun showScreen3Verifying() {
        binding.layoutScreen1.visibility = View.GONE
        binding.layoutScreen2.visibility = View.GONE
        binding.layoutScreen3.visibility = View.VISIBLE
        binding.ivTopCurve.visibility = View.GONE
        binding.ivBottomCurve.visibility = View.VISIBLE

        // Subtle breathing animation on orb
        val scaleAnim = ScaleAnimation(
            0.96f, 1.04f, 0.96f, 1.04f,
            Animation.RELATIVE_TO_SELF, 0.5f,
            Animation.RELATIVE_TO_SELF, 0.5f
        ).apply {
            duration = 1400
            repeatMode = Animation.REVERSE
            repeatCount = Animation.INFINITE
        }
        binding.ivVerifyingOrb.startAnimation(scaleAnim)
    }

    private fun showScreen1Error(message: String) {
        binding.tvErrorScreen1.text = message
        binding.tvErrorScreen1.visibility = View.VISIBLE
    }

    private fun showScreen2Error(message: String) {
        binding.tvErrorScreen2.text = message
        binding.tvErrorScreen2.visibility = View.VISIBLE
    }

    override fun onDestroy() {
        super.onDestroy()
        resendTimer?.cancel()
    }
}
