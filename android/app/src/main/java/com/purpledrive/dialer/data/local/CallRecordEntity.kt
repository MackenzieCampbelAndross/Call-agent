package com.purpledrive.dialer.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.purpledrive.dialer.domain.model.CallDirection
import com.purpledrive.dialer.domain.model.CallOutcome
import com.purpledrive.dialer.domain.model.CallRecord
import com.purpledrive.dialer.domain.model.SyncStatus

@Entity(tableName = "call_records")
data class CallRecordEntity(
    @PrimaryKey
    val callId: String,
    val employeeId: String,
    val employeeName: String,
    val employeeDepartment: String,
    val registeredPhoneNumber: String = "",
    val phoneNumber: String,
    val contactName: String?,
    val direction: String,
    val startedAt: Long,
    val connectedAt: Long?,
    val endedAt: Long,
    val connectedDurationSeconds: Long,
    val outcome: String,
    val simSlotIndex: Int,
    val simDisplayName: String,
    val syncStatus: String,
    val syncAttempts: Int = 0,
    val lastSyncAttemptAt: Long? = null,
    val syncErrorMessage: String? = null,
    val isSimulated: Boolean = false,
    val notes: String? = null
) {
    fun toDomainModel(): CallRecord {
        return CallRecord(
            callId = callId,
            employeeId = employeeId,
            employeeName = employeeName,
            employeeDepartment = employeeDepartment,
            registeredPhoneNumber = registeredPhoneNumber,
            phoneNumber = phoneNumber,
            contactName = contactName,
            direction = CallDirection.valueOf(direction),
            startedAt = startedAt,
            connectedAt = connectedAt,
            endedAt = endedAt,
            connectedDurationSeconds = connectedDurationSeconds,
            outcome = CallOutcome.valueOf(outcome),
            simSlotIndex = simSlotIndex,
            simDisplayName = simDisplayName,
            syncStatus = SyncStatus.valueOf(syncStatus),
            syncAttempts = syncAttempts,
            lastSyncAttemptAt = lastSyncAttemptAt,
            syncErrorMessage = syncErrorMessage,
            isSimulated = isSimulated,
            notes = notes
        )
    }

    companion object {
        fun fromDomainModel(record: CallRecord): CallRecordEntity {
            return CallRecordEntity(
                callId = record.callId,
                employeeId = record.employeeId,
                employeeName = record.employeeName,
                employeeDepartment = record.employeeDepartment,
                registeredPhoneNumber = record.registeredPhoneNumber,
                phoneNumber = record.phoneNumber,
                contactName = record.contactName,
                direction = record.direction.name,
                startedAt = record.startedAt,
                connectedAt = record.connectedAt,
                endedAt = record.endedAt,
                connectedDurationSeconds = record.connectedDurationSeconds,
                outcome = record.outcome.name,
                simSlotIndex = record.simSlotIndex,
                simDisplayName = record.simDisplayName,
                syncStatus = record.syncStatus.name,
                syncAttempts = record.syncAttempts,
                lastSyncAttemptAt = record.lastSyncAttemptAt,
                syncErrorMessage = record.syncErrorMessage,
                isSimulated = record.isSimulated,
                notes = record.notes
            )
        }
    }
}
