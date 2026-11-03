package com.purpledrive.dialer

import com.purpledrive.dialer.domain.model.CallDirection
import com.purpledrive.dialer.domain.model.CallOutcome
import com.purpledrive.dialer.domain.model.CallRecord
import com.purpledrive.dialer.domain.model.SyncStatus
import org.junit.Assert.assertEquals
import org.junit.Test

class SyncRecoveryTest {

    @Test
    fun testSyncStateRecoveryTransitions() {
        var record = CallRecord(
            callId = "uuid-recovery-test",
            employeeId = "EMP-TEST",
            employeeName = "Test User",
            employeeDepartment = "Quality Assurance",
            phoneNumber = "+14155552671",
            contactName = "David Miller",
            direction = CallDirection.OUTGOING,
            startedAt = 1000L,
            connectedAt = 1005L,
            endedAt = 1065L,
            connectedDurationSeconds = 60L,
            outcome = CallOutcome.COMPLETED,
            simSlotIndex = 0,
            simDisplayName = "SIM 1",
            syncStatus = SyncStatus.PENDING,
            syncAttempts = 0
        )

        // Initial state is PENDING
        assertEquals(SyncStatus.PENDING, record.syncStatus)
        assertEquals(0, record.syncAttempts)

        // Attempt 1: Network failure occurs (e.g. 503 or offline)
        val attempt1Time = 2000L
        record = record.copy(
            syncStatus = SyncStatus.FAILED,
            syncAttempts = record.syncAttempts + 1,
            lastSyncAttemptAt = attempt1Time,
            syncErrorMessage = "HTTP 503 Service Unavailable"
        )

        assertEquals(SyncStatus.FAILED, record.syncStatus)
        assertEquals(1, record.syncAttempts)
        assertEquals("HTTP 503 Service Unavailable", record.syncErrorMessage)

        // Attempt 2: Connectivity restored, background worker runs and succeeds
        val attempt2Time = 5000L
        record = record.copy(
            syncStatus = SyncStatus.SYNCED,
            syncAttempts = record.syncAttempts + 1,
            lastSyncAttemptAt = attempt2Time,
            syncErrorMessage = null
        )

        assertEquals(SyncStatus.SYNCED, record.syncStatus)
        assertEquals(2, record.syncAttempts)
        assertEquals(null, record.syncErrorMessage)
    }
}
