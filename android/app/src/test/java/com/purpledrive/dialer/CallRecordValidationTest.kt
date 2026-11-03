package com.purpledrive.dialer

import com.purpledrive.dialer.domain.CallRecordValidator
import com.purpledrive.dialer.domain.model.CallDirection
import com.purpledrive.dialer.domain.model.CallOutcome
import com.purpledrive.dialer.domain.model.CallRecord
import com.purpledrive.dialer.domain.model.SyncStatus
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class CallRecordValidationTest {

    private val validRecord = CallRecord(
        callId = "a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d",
        employeeId = "EMP-TEST",
        employeeName = "Test User",
        employeeDepartment = "Quality Assurance",
        phoneNumber = "+14155552671",
        contactName = "David Miller",
        direction = CallDirection.OUTGOING,
        startedAt = 1700000000000L,
        connectedAt = 1700000005000L,
        endedAt = 1700000065000L,
        connectedDurationSeconds = 60L,
        outcome = CallOutcome.COMPLETED,
        simSlotIndex = 0,
        simDisplayName = "SIM 1 (Work)",
        syncStatus = SyncStatus.PENDING,
        syncAttempts = 0,
        isSimulated = false
    )

    @Test
    fun testValidRecordPasses() {
        val result = CallRecordValidator.validate(validRecord)
        assertTrue(result.isValid)
        assertTrue(result.errors.isEmpty())
    }

    @Test
    fun testInvalidUuidRejected() {
        val invalid = validRecord.copy(callId = "not-a-valid-uuid")
        val result = CallRecordValidator.validate(invalid)
        assertFalse(result.isValid)
        assertTrue(result.errors.any { it.contains("Invalid callId UUID") })
    }

    @Test
    fun testDurationMismatchRejected() {
        val invalid = validRecord.copy(connectedDurationSeconds = 120L)
        val result = CallRecordValidator.validate(invalid)
        assertFalse(result.isValid)
        assertTrue(result.errors.any { it.contains("connectedDurationSeconds mismatch") })
    }

    @Test
    fun testUnconnectedCallDurationMustBeZero() {
        val missedRecord = validRecord.copy(
            outcome = CallOutcome.MISSED,
            direction = CallDirection.INCOMING,
            connectedAt = null,
            endedAt = 1700000025000L,
            connectedDurationSeconds = 0L
        )
        val result = CallRecordValidator.validate(missedRecord)
        assertTrue(result.isValid)

        val invalidMissed = missedRecord.copy(connectedDurationSeconds = 10L)
        val invalidResult = CallRecordValidator.validate(invalidMissed)
        assertFalse(invalidResult.isValid)
    }

    @Test
    fun testCompletedCallWithoutConnectedTimestampRejected() {
        val invalid = validRecord.copy(
            outcome = CallOutcome.COMPLETED,
            connectedAt = null,
            connectedDurationSeconds = 0L
        )
        val result = CallRecordValidator.validate(invalid)
        assertFalse(result.isValid)
        assertTrue(result.errors.any { it.contains("COMPLETED calls must have a connectedAt") })
    }
}
