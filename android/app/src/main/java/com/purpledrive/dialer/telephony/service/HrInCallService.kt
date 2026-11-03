package com.purpledrive.dialer.telephony.service

import android.content.Intent
import android.telecom.Call
import android.telecom.CallAudioState
import android.telecom.DisconnectCause
import android.telecom.InCallService
import android.telecom.VideoProfile
import android.util.Log
import com.purpledrive.dialer.DialerApplication
import com.purpledrive.dialer.domain.DurationCalculator
import com.purpledrive.dialer.domain.model.CallDirection
import com.purpledrive.dialer.domain.model.CallOutcome
import com.purpledrive.dialer.domain.model.CallRecord
import com.purpledrive.dialer.domain.model.CallState
import com.purpledrive.dialer.domain.model.CallStateEvent
import com.purpledrive.dialer.domain.model.SyncStatus
import com.purpledrive.dialer.ui.InCallActivity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.util.UUID

class HrInCallService : InCallService() {

    private val serviceScope = CoroutineScope(Dispatchers.Default)

    override fun onCallAudioStateChanged(audioState: CallAudioState?) {
        super.onCallAudioStateChanged(audioState)
        _audioStateFlow.value = audioState
    }

    override fun onCallAdded(call: Call) {
        super.onCallAdded(call)
        activeServiceInstance = this
        activeTelecomCall = call
        currentCallStartedAt = System.currentTimeMillis()
        currentCallConnectedAt = null

        val direction = if (call.state == Call.STATE_RINGING) CallDirection.INCOMING else CallDirection.OUTGOING
        val phoneNumber = call.details?.handle?.schemeSpecificPart ?: "Unknown"

        updateCallStateEvent(
            state = mapTelecomStateToDomain(call.state),
            direction = direction,
            phoneNumber = phoneNumber,
            startedAt = currentCallStartedAt
        )

        call.registerCallback(object : Call.Callback() {
            override fun onStateChanged(call: Call, state: Int) {
                super.onStateChanged(call, state)
                Log.d(TAG, "Call onStateChanged: state=$state")

                if (state == Call.STATE_ACTIVE && currentCallConnectedAt == null) {
                    currentCallConnectedAt = System.currentTimeMillis()
                }

                updateCallStateEvent(
                    state = mapTelecomStateToDomain(state),
                    direction = direction,
                    phoneNumber = phoneNumber,
                    startedAt = currentCallStartedAt,
                    connectedAt = currentCallConnectedAt
                )
            }
        })

        // Launch full-screen Apple-styled in-call UI over lock screen
        val intent = Intent(this, InCallActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or
                    Intent.FLAG_ACTIVITY_REORDER_TO_FRONT or
                    Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS
            putExtra("EXTRA_PHONE_NUMBER", phoneNumber)
            putExtra("EXTRA_DIRECTION", direction.name)
        }
        startActivity(intent)
    }

    override fun onCallRemoved(call: Call) {
        super.onCallRemoved(call)
        Log.i(TAG, "onCallRemoved: call=$call")

        val endedAt = System.currentTimeMillis()
        val phoneNumber = call.details?.handle?.schemeSpecificPart ?: "Unknown"
        val direction = if (call.state == Call.STATE_RINGING) CallDirection.INCOMING else CallDirection.OUTGOING

        val outcome = mapDisconnectCauseToOutcome(call.details?.disconnectCause, currentCallConnectedAt != null)
        val connectedDuration = DurationCalculator.calculateConnectedDurationSeconds(currentCallConnectedAt, endedAt)

        // Generate production CallRecord
        val app = application as? DialerApplication
        val employee = app?.callRepository?.getActiveEmployee()
            ?: com.purpledrive.dialer.domain.model.EmployeeIdentity(
                employeeId = "EMP-TEST",
                name = "Test User",
                department = "Quality Assurance",
                email = "test@gmail.com",
                employeeCode = "HR-TEST-001"
            )

        val record = CallRecord(
            callId = UUID.randomUUID().toString(),
            employeeId = employee.employeeId,
            employeeName = employee.name,
            employeeDepartment = employee.department,
            phoneNumber = phoneNumber,
            contactName = null,
            direction = direction,
            startedAt = currentCallStartedAt,
            connectedAt = currentCallConnectedAt,
            endedAt = endedAt,
            connectedDurationSeconds = connectedDuration,
            outcome = outcome,
            simSlotIndex = 0,
            simDisplayName = "SIM 1 (Cellular)",
            syncStatus = SyncStatus.PENDING,
            syncAttempts = 0,
            isSimulated = false,
            notes = call.details?.disconnectCause?.reason
        )

        // Update state flow to DISCONNECTED
        _callStateFlow.value = CallStateEvent(
            callId = record.callId,
            state = CallState.DISCONNECTED,
            direction = direction,
            phoneNumber = phoneNumber,
            simSlotIndex = 0,
            startedAt = currentCallStartedAt,
            connectedAt = currentCallConnectedAt,
            endedAt = endedAt,
            outcome = outcome,
            disconnectReason = call.details?.disconnectCause?.reason
        )

        // Persist to Room and enqueue sync
        app?.let {
            serviceScope.launch {
                it.callRepository.saveCallRecord(record)
            }
        }

        activeTelecomCall = null
        currentCallConnectedAt = null
        activeServiceInstance = null
    }

    private fun updateCallStateEvent(
        state: CallState,
        direction: CallDirection,
        phoneNumber: String,
        startedAt: Long,
        connectedAt: Long? = null
    ) {
        _callStateFlow.value = CallStateEvent(
            callId = UUID.randomUUID().toString(),
            state = state,
            direction = direction,
            phoneNumber = phoneNumber,
            simSlotIndex = 0,
            startedAt = startedAt,
            connectedAt = connectedAt
        )
    }

    private fun mapTelecomStateToDomain(telecomState: Int): CallState {
        return when (telecomState) {
            Call.STATE_RINGING -> CallState.RINGING
            Call.STATE_DIALING, Call.STATE_CONNECTING -> CallState.DIALING
            Call.STATE_ACTIVE -> CallState.ACTIVE
            Call.STATE_HOLDING -> CallState.HOLDING
            Call.STATE_DISCONNECTED, Call.STATE_DISCONNECTING -> CallState.DISCONNECTED
            else -> CallState.IDLE
        }
    }

    private fun mapDisconnectCauseToOutcome(cause: DisconnectCause?, wasConnected: Boolean): CallOutcome {
        if (cause == null) return if (wasConnected) CallOutcome.COMPLETED else CallOutcome.REJECTED

        return when (cause.code) {
            DisconnectCause.LOCAL -> if (wasConnected) CallOutcome.COMPLETED else CallOutcome.REJECTED
            DisconnectCause.REMOTE -> if (wasConnected) CallOutcome.COMPLETED else CallOutcome.REJECTED
            DisconnectCause.MISSED -> CallOutcome.MISSED
            DisconnectCause.REJECTED -> CallOutcome.REJECTED
            DisconnectCause.BUSY -> CallOutcome.BUSY
            DisconnectCause.ERROR, DisconnectCause.RESTRICTED -> CallOutcome.FAILED
            else -> if (wasConnected) CallOutcome.COMPLETED else CallOutcome.REJECTED
        }
    }

    companion object {
        private const val TAG = "HrInCallService"

        private var activeServiceInstance: HrInCallService? = null
        private var activeTelecomCall: Call? = null
        private var currentCallStartedAt: Long = 0L
        private var currentCallConnectedAt: Long? = null

        private val _callStateFlow = MutableStateFlow<CallStateEvent?>(null)
        val callStateFlow: StateFlow<CallStateEvent?> = _callStateFlow.asStateFlow()

        private val _audioStateFlow = MutableStateFlow<CallAudioState?>(null)
        val audioStateFlow: StateFlow<CallAudioState?> = _audioStateFlow.asStateFlow()

        fun answerActiveCall() {
            activeTelecomCall?.answer(VideoProfile.STATE_AUDIO_ONLY)
        }

        fun rejectActiveCall() {
            activeTelecomCall?.reject(false, null)
        }

        fun disconnectActiveCall() {
            activeTelecomCall?.disconnect()
        }

        fun sendDtmfDigit(digit: Char) {
            activeTelecomCall?.playDtmfTone(digit)
            activeTelecomCall?.stopDtmfTone()
        }

        fun setHold(hold: Boolean) {
            if (hold) {
                activeTelecomCall?.hold()
            } else {
                activeTelecomCall?.unhold()
            }
        }

        /**
         * Real hardware audio routing operations via Android Telecom InCallService
         */
        fun setHardwareMuted(muted: Boolean) {
            activeServiceInstance?.setMuted(muted)
        }

        fun setHardwareSpeaker(speaker: Boolean) {
            val route = if (speaker) CallAudioState.ROUTE_SPEAKER else CallAudioState.ROUTE_EARPIECE
            activeServiceInstance?.setAudioRoute(route)
        }
    }
}
