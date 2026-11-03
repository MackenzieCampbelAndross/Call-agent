package com.purpledrive.dialer

import com.purpledrive.dialer.data.local.CallRecordEntity
import com.purpledrive.dialer.domain.model.CallDirection
import com.purpledrive.dialer.domain.model.CallOutcome
import com.purpledrive.dialer.domain.model.CallRecord
import com.purpledrive.dialer.domain.model.SyncStatus
import org.junit.Assert.assertEquals
import org.junit.Test

class DuplicatePreventionTest {

    @Test
    fun testRecordEntityIdempotency() {
        val record1 = CallRecord(
            callId = "uuid-1111-2222-3333",
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

        val entity1 = CallRecordEntity.fromDomainModel(record1)
        val record2Updated = record1.copy(syncAttempts = 1, syncStatus = SyncStatus.SYNCED)
        val entity2 = CallRecordEntity.fromDomainModel(record2Updated)

        // In a Map simulating the primary key constraint of Room SQLite (@PrimaryKey callId)
        val databaseTable = mutableMapOf<String, CallRecordEntity>()

        databaseTable[entity1.callId] = entity1
        assertEquals(1, databaseTable.size)

        // Second insert with same callId should update without increasing count
        databaseTable[entity2.callId] = entity2
        assertEquals(1, databaseTable.size)
        assertEquals(SyncStatus.SYNCED.name, databaseTable[entity1.callId]?.syncStatus)
        assertEquals(1, databaseTable[entity1.callId]?.syncAttempts)
    }
}
