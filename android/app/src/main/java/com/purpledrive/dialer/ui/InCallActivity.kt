package com.purpledrive.dialer.ui

import android.os.Build
import android.os.Bundle
import android.os.SystemClock
import android.telecom.CallAudioState
import android.view.HapticFeedbackConstants
import android.view.View
import android.view.WindowManager
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.purpledrive.dialer.DialerApplication
import com.purpledrive.dialer.R
import com.purpledrive.dialer.databinding.ActivityIncallBinding
import com.purpledrive.dialer.domain.model.CallDirection
import com.purpledrive.dialer.domain.model.CallState
import com.purpledrive.dialer.telephony.service.HrInCallService
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

class InCallActivity : AppCompatActivity() {

    private lateinit var binding: ActivityIncallBinding
    private val app by lazy { application as DialerApplication }

    private var isMuted = false
    private var isSpeaker = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityIncallBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupLockscreenFlags()
        setupListeners()
        observeCallLifecycle()
        observeAudioState()
    }

    private fun setupLockscreenFlags() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
        } else {
            @Suppress("DEPRECATION")
            window.addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
            )
        }
    }

    private fun setupListeners() {
        binding.fabAnswer.setOnClickListener {
            it.performHapticFeedback(HapticFeedbackConstants.CONFIRM)
            HrInCallService.answerActiveCall()
        }

        binding.fabDecline.setOnClickListener {
            it.performHapticFeedback(HapticFeedbackConstants.REJECT)
            HrInCallService.rejectActiveCall()
            finish()
        }

        binding.fabHangup.setOnClickListener {
            it.performHapticFeedback(HapticFeedbackConstants.REJECT)
            HrInCallService.disconnectActiveCall()
            finish()
        }

        binding.btnMute.setOnClickListener {
            it.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
            isMuted = !isMuted
            app.telephonyAdapter.setMuted(isMuted)
            updateMuteButtonVisual(isMuted)
        }

        binding.btnSpeaker.setOnClickListener {
            it.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
            isSpeaker = !isSpeaker
            app.telephonyAdapter.setSpeaker(isSpeaker)
            updateSpeakerButtonVisual(isSpeaker)
        }
    }

    private fun updateMuteButtonVisual(muted: Boolean) {
        if (muted) {
            binding.btnMute.setBackgroundResource(R.drawable.bg_search_input)
            binding.tvMuteIcon.setTextColor(ContextCompat.getColor(this, R.color.accent_purple))
            binding.tvMuteIcon.text = "Muted"
        } else {
            binding.btnMute.setBackgroundResource(R.drawable.bg_keypad_circle)
            binding.tvMuteIcon.setTextColor(ContextCompat.getColor(this, R.color.text_primary))
            binding.tvMuteIcon.text = "Mute"
        }
    }

    private fun updateSpeakerButtonVisual(speaker: Boolean) {
        if (speaker) {
            binding.btnSpeaker.setBackgroundResource(R.drawable.bg_search_input)
            binding.tvSpeakerIcon.setTextColor(ContextCompat.getColor(this, R.color.accent_purple))
            binding.tvSpeakerIcon.text = "Speaker"
        } else {
            binding.btnSpeaker.setBackgroundResource(R.drawable.bg_keypad_circle)
            binding.tvSpeakerIcon.setTextColor(ContextCompat.getColor(this, R.color.text_primary))
            binding.tvSpeakerIcon.text = "Earpiece"
        }
    }

    private fun observeAudioState() {
        lifecycleScope.launch {
            HrInCallService.audioStateFlow.collectLatest { audioState ->
                if (audioState != null) {
                    isMuted = audioState.isMuted
                    isSpeaker = (audioState.route == CallAudioState.ROUTE_SPEAKER)
                    updateMuteButtonVisual(isMuted)
                    updateSpeakerButtonVisual(isSpeaker)
                }
            }
        }
    }

    private fun observeCallLifecycle() {
        lifecycleScope.launch {
            app.telephonyAdapter.observeCallState().collectLatest { callStateEvent ->
                if (callStateEvent == null || callStateEvent.state == CallState.DISCONNECTED) {
                    finish()
                    return@collectLatest
                }

                binding.tvInCallNumber.text = callStateEvent.phoneNumber
                binding.tvInCallName.text = callStateEvent.contactName ?: callStateEvent.phoneNumber

                when (callStateEvent.state) {
                    CallState.RINGING -> {
                        if (callStateEvent.direction == CallDirection.INCOMING) {
                            binding.tvInCallStatus.text = "Incoming Cellular Call…"
                            binding.layoutIncomingActions.visibility = View.VISIBLE
                            binding.layoutOngoingControls.visibility = View.GONE
                            binding.fabHangup.visibility = View.GONE
                            binding.chronoCallTimer.visibility = View.GONE
                        } else {
                            binding.tvInCallStatus.text = "Ringing…"
                            binding.layoutIncomingActions.visibility = View.GONE
                            binding.layoutOngoingControls.visibility = View.GONE
                            binding.fabHangup.visibility = View.VISIBLE
                            binding.chronoCallTimer.visibility = View.GONE
                        }
                    }
                    CallState.DIALING -> {
                        binding.tvInCallStatus.text = "Connecting…"
                        binding.layoutIncomingActions.visibility = View.GONE
                        binding.layoutOngoingControls.visibility = View.GONE
                        binding.fabHangup.visibility = View.VISIBLE
                        binding.chronoCallTimer.visibility = View.GONE
                    }
                    CallState.ACTIVE -> {
                        binding.tvInCallStatus.text = "Cellular Call Active"
                        binding.layoutIncomingActions.visibility = View.GONE
                        binding.layoutOngoingControls.visibility = View.VISIBLE
                        binding.fabHangup.visibility = View.VISIBLE
                        binding.chronoCallTimer.visibility = View.VISIBLE

                        if (callStateEvent.connectedAt != null) {
                            val elapsedSinceConnect = System.currentTimeMillis() - callStateEvent.connectedAt
                            binding.chronoCallTimer.base = SystemClock.elapsedRealtime() - elapsedSinceConnect
                            binding.chronoCallTimer.start()
                        }
                    }
                    CallState.HOLDING -> {
                        binding.tvInCallStatus.text = "Call on Hold"
                    }
                    else -> {}
                }
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        binding.chronoCallTimer.stop()
    }
}
