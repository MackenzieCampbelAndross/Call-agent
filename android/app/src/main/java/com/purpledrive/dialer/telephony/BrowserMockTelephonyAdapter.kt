package com.purpledrive.dialer.telephony

import com.purpledrive.dialer.domain.TelephonyAdapter
import com.purpledrive.dialer.domain.model.CallDirection
import com.purpledrive.dialer.domain.model.CallOutcome
import com.purpledrive.dialer.domain.model.CallState
import com.purpledrive.dialer.domain.model.CallStateEvent
import com.purpledrive.dialer.domain.model.OutgoingCallRequest
import com.purpledrive.dialer.domain.model.SimSlotInfo
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.util.UUID

class BrowserMockTelephonyAdapter : TelephonyAdapter {

    private val _callStateFlow = MutableStateFlow<CallStateEvent?>(null)

    override fun isSimulated(): Boolean = true

    override fun getSimSlots(): List<SimSlotInfo> {
        return listOf(
            SimSlotInfo(0, "SIM 1 (Work HR)", "Verizon Enterprise", isDefault = true),
            SimSlotInfo(1, "SIM 2 (Personal)", "T-Mobile", isDefault = false)
        )
    }

    override fun initiateCall(request: OutgoingCallRequest): String {
        val callId = UUID.randomUUID().toString()
        val now = System.currentTimeMillis()

        _callStateFlow.value = CallStateEvent(
            callId = callId,
            state = CallState.DIALING,
            direction = CallDirection.OUTGOING,
            phoneNumber = request.phoneNumber,
            contactName = request.contactName,
            simSlotIndex = request.simSlotIndex,
            startedAt = now
        )
        return callId
    }

    override fun answerCall(callId: String) {
        val current = _callStateFlow.value ?: return
        if (current.callId == callId) {
            _callStateFlow.value = current.copy(
                state = CallState.ACTIVE,
                connectedAt = System.currentTimeMillis()
            )
        }
    }

    override fun rejectCall(callId: String) {
        val current = _callStateFlow.value ?: return
        if (current.callId == callId) {
            _callStateFlow.value = current.copy(
                state = CallState.DISCONNECTED,
                endedAt = System.currentTimeMillis(),
                outcome = CallOutcome.REJECTED
            )
        }
    }

    override fun endCall(callId: String) {
        val current = _callStateFlow.value ?: return
        if (current.callId == callId) {
            val wasConnected = current.connectedAt != null
            _callStateFlow.value = current.copy(
                state = CallState.DISCONNECTED,
                endedAt = System.currentTimeMillis(),
                outcome = if (wasConnected) CallOutcome.COMPLETED else CallOutcome.REJECTED
            )
        }
    }

    override fun setMuted(muted: Boolean) {
        val current = _callStateFlow.value ?: return
        _callStateFlow.value = current.copy(isMuted = muted)
    }

    override fun setSpeaker(speaker: Boolean) {
        val current = _callStateFlow.value ?: return
        _callStateFlow.value = current.copy(isSpeaker = speaker)
    }

    override fun sendDtmf(digit: Char) {
        // Mock tone
    }

    override fun setHold(onHold: Boolean) {
        val current = _callStateFlow.value ?: return
        _callStateFlow.value = current.copy(
            state = if (onHold) CallState.HOLDING else CallState.ACTIVE,
            isOnHold = onHold
        )
    }

    override fun observeCallState(): StateFlow<CallStateEvent?> {
        return _callStateFlow.asStateFlow()
    }

    // Test simulation helper
    fun simulateState(event: CallStateEvent) {
        _callStateFlow.value = event
    }
}
