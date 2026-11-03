package com.purpledrive.dialer

import com.purpledrive.dialer.domain.model.CallDirection
import com.purpledrive.dialer.domain.model.CallOutcome
import com.purpledrive.dialer.domain.model.CallState
import com.purpledrive.dialer.domain.model.OutgoingCallRequest
import com.purpledrive.dialer.telephony.BrowserMockTelephonyAdapter
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class CallLifecycleTest {

    private lateinit var adapter: BrowserMockTelephonyAdapter

    @Before
    fun setup() {
        adapter = BrowserMockTelephonyAdapter()
    }

    @Test
    fun testOutgoingCallLifecycleTransitions() {
        val callId = adapter.initiateCall(
            OutgoingCallRequest(
                phoneNumber = "+14155552671",
                contactName = "David Miller",
                simSlotIndex = 0
            )
        )

        assertNotNull(callId)
        val dialingState = adapter.observeCallState().value
        assertNotNull(dialingState)
        assertEquals(CallState.DIALING, dialingState!!.state)
        assertEquals(CallDirection.OUTGOING, dialingState.direction)

        // Answer call
        adapter.answerCall(callId)
        val activeState = adapter.observeCallState().value
        assertNotNull(activeState)
        assertEquals(CallState.ACTIVE, activeState!!.state)
        assertNotNull(activeState.connectedAt)

        // Put call on hold
        adapter.setHold(true)
        val holdState = adapter.observeCallState().value
        assertEquals(CallState.HOLDING, holdState!!.state)
        assertTrue(holdState.isOnHold)

        // Resume call
        adapter.setHold(false)
        val resumeState = adapter.observeCallState().value
        assertEquals(CallState.ACTIVE, resumeState!!.state)

        // Terminate call
        adapter.endCall(callId)
        val endedState = adapter.observeCallState().value
        assertEquals(CallState.DISCONNECTED, endedState!!.state)
        assertEquals(CallOutcome.COMPLETED, endedState.outcome)
        assertNotNull(endedState.endedAt)
    }

    @Test
    fun testRejectedCallLifecycle() {
        val callId = adapter.initiateCall(OutgoingCallRequest(phoneNumber = "5551234"))
        adapter.rejectCall(callId)

        val rejectedState = adapter.observeCallState().value
        assertNotNull(rejectedState)
        assertEquals(CallState.DISCONNECTED, rejectedState!!.state)
        assertEquals(CallOutcome.REJECTED, rejectedState.outcome)
    }
}
