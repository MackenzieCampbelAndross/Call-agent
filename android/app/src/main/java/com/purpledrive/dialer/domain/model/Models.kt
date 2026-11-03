package com.purpledrive.dialer.domain.model

enum class CallDirection {
    OUTGOING,
    INCOMING
}

enum class CallOutcome {
    COMPLETED,
    MISSED,
    REJECTED,
    UNANSWERED,
    BUSY,
    FAILED,
    INTERRUPTED
}

enum class SyncStatus {
    PENDING,
    SYNCED,
    FAILED
}

enum class CallState {
    IDLE,
    DIALING,
    RINGING,
    ACTIVE,
    HOLDING,
    DISCONNECTED
}

data class EmployeeIdentity(
    val employeeId: String,
    val name: String,
    val department: String,
    val email: String,
    val employeeCode: String,
    val registeredPhoneNumber: String = ""
)

data class SimSlotInfo(
    val slotIndex: Int,
    val displayName: String,
    val carrierName: String,
    val phoneNumber: String? = null,
    val isDefault: Boolean = false
)

data class OutgoingCallRequest(
    val phoneNumber: String,
    val contactName: String? = null,
    val simSlotIndex: Int = 0
)

data class CallStateEvent(
    val callId: String,
    val state: CallState,
    val direction: CallDirection,
    val phoneNumber: String,
    val contactName: String? = null,
    val simSlotIndex: Int = 0,
    val startedAt: Long,
    val connectedAt: Long? = null,
    val endedAt: Long? = null,
    val outcome: CallOutcome? = null,
    val disconnectReason: String? = null,
    val isMuted: Boolean = false,
    val isSpeaker: Boolean = false,
    val isOnHold: Boolean = false
)

data class CallRecord(
    val callId: String,
    val employeeId: String,
    val employeeName: String,
    val employeeDepartment: String,
    val registeredPhoneNumber: String = "",
    val phoneNumber: String,
    val contactName: String? = null,
    val direction: CallDirection,
    val startedAt: Long,
    val connectedAt: Long? = null,
    val endedAt: Long,
    val connectedDurationSeconds: Long,
    val outcome: CallOutcome,
    val simSlotIndex: Int,
    val simDisplayName: String,
    val syncStatus: SyncStatus,
    val syncAttempts: Int = 0,
    val lastSyncAttemptAt: Long? = null,
    val syncErrorMessage: String? = null,
    val isSimulated: Boolean = false,
    val notes: String? = null
)
