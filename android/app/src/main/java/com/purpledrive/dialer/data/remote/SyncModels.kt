package com.purpledrive.dialer.data.remote

import com.purpledrive.dialer.domain.model.CallRecord
import com.purpledrive.dialer.domain.model.EmployeeIdentity

data class SyncPayload(
    val employee: EmployeeIdentity,
    val records: List<CallRecord>,
    val clientTimestamp: Long
)

data class SyncResponse(
    val success: Boolean,
    val message: String?,
    val syncedCount: Int,
    val syncedCallIds: List<String>?,
    val serverTimestamp: Long
)
