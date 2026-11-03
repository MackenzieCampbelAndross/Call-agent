package com.purpledrive.dialer.domain

import com.purpledrive.dialer.domain.model.CallStateEvent
import com.purpledrive.dialer.domain.model.OutgoingCallRequest
import com.purpledrive.dialer.domain.model.SimSlotInfo
import kotlinx.coroutines.flow.StateFlow

/**
 * Universal Telephony Adapter Interface in Kotlin.
 * Implemented by:
 * 1. AndroidTelephonyAdapter (Production Android Telecom integration)
 * 2. BrowserMockTelephonyAdapter (Unit tests & local simulation)
 */
interface TelephonyAdapter {
    fun isSimulated(): Boolean
    fun getSimSlots(): List<SimSlotInfo>
    fun initiateCall(request: OutgoingCallRequest): String
    fun answerCall(callId: String)
    fun rejectCall(callId: String)
    fun endCall(callId: String)
    fun setMuted(muted: Boolean)
    fun setSpeaker(speaker: Boolean)
    fun sendDtmf(digit: Char)
    fun setHold(onHold: Boolean)
    fun observeCallState(): StateFlow<CallStateEvent?>
}
