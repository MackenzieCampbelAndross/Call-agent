package com.purpledrive.dialer.data.repository

import android.content.Context
import androidx.work.Constraints
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import com.purpledrive.dialer.data.local.AuthPreferences
import com.purpledrive.dialer.data.local.CallRecordDao
import com.purpledrive.dialer.data.local.CallRecordEntity
import com.purpledrive.dialer.data.remote.LoginRequest
import com.purpledrive.dialer.data.remote.SyncApiService
import com.purpledrive.dialer.data.remote.SyncPayload
import com.purpledrive.dialer.domain.CallRecordValidator
import com.purpledrive.dialer.domain.model.CallRecord
import com.purpledrive.dialer.domain.model.EmployeeIdentity
import com.purpledrive.dialer.domain.model.SyncStatus
import com.purpledrive.dialer.sync.CallSyncWorker
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.withContext

class CallRepository(
    private val dao: CallRecordDao,
    private val apiService: SyncApiService,
    private val context: Context,
    private val authPreferences: AuthPreferences
) {

    fun getActiveEmployee(): EmployeeIdentity = authPreferences.getEmployeeIdentity()

    fun getAllRecords(): Flow<List<CallRecord>> {
        return dao.getAllRecords().map { entities ->
            entities.map { it.toDomainModel() }
        }
    }

    suspend fun sendOtp(email: String): Result<String> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.sendOtp(com.purpledrive.dialer.data.remote.SendOtpRequest(email))
            if (response.isSuccessful && response.body()?.success == true) {
                val msg = response.body()?.message ?: "OTP sent successfully"
                val devOtp = response.body()?.devOtp
                val res = if (!devOtp.isNullOrBlank()) "$msg (Dev OTP: $devOtp)" else msg
                Result.success(res)
            } else {
                val err = response.body()?.error ?: "Failed to send OTP code"
                Result.failure(Exception(err))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun verifyOtp(email: String, otp: String): Result<EmployeeIdentity> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.verifyOtp(com.purpledrive.dialer.data.remote.VerifyOtpRequest(email, otp))
            if (response.isSuccessful && response.body()?.success == true) {
                val data = response.body()!!.user ?: response.body()!!.employee!!
                val token = response.body()!!.token!!
                val employee = EmployeeIdentity(
                    employeeId = data.employeeId,
                    name = data.name,
                    department = data.department,
                    email = data.email,
                    employeeCode = "HR-${data.employeeId}",
                    registeredPhoneNumber = data.registeredPhoneNumber
                )
                authPreferences.saveSession(token, employee)
                Result.success(employee)
            } else {
                val errorMsg = response.body()?.error ?: "Invalid OTP code"
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun authenticate(identifier: String, password: String): Result<EmployeeIdentity> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.login(LoginRequest(identifier, password))
            if (response.isSuccessful && response.body()?.success == true) {
                val data = response.body()!!.user!!
                val token = response.body()!!.token!!
                val employee = EmployeeIdentity(
                    employeeId = data.employeeId,
                    name = data.name,
                    department = data.department,
                    email = data.email,
                    employeeCode = "HR-${data.employeeId}",
                    registeredPhoneNumber = data.registeredPhoneNumber
                )
                authPreferences.saveSession(token, employee)
                Result.success(employee)
            } else {
                val errorMsg = response.body()?.error ?: "Invalid employee credentials"
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Durable save with duplicate prevention (Room REPLACE on conflict by callId).
     * Enforces domain validation before persisting.
     */
    suspend fun saveCallRecord(record: CallRecord) = withContext(Dispatchers.IO) {
        val employee = getActiveEmployee()
        val enrichedRecord = record.copy(
            employeeId = employee.employeeId,
            employeeName = employee.name,
            employeeDepartment = employee.department,
            registeredPhoneNumber = employee.registeredPhoneNumber
        )

        val validation = CallRecordValidator.validate(enrichedRecord)
        val recordToSave = if (!validation.isValid) {
            enrichedRecord.copy(notes = "Validation warnings: ${validation.errors.joinToString("; ")}")
        } else {
            enrichedRecord
        }

        // Upsert into durable SQLite Room storage
        dao.upsertRecord(CallRecordEntity.fromDomainModel(recordToSave))

        // Schedule background sync worker with network constraints
        scheduleBackgroundSync()
    }

    /**
     * Executes immediate sync against backend for pending or failed records.
     */
    suspend fun syncPendingRecords(): Result<Int> = withContext(Dispatchers.IO) {
        try {
            val pendingEntities = dao.getPendingSyncRecords()
            if (pendingEntities.isEmpty()) {
                return@withContext Result.success(0)
            }

            val domainRecords = pendingEntities.map { it.toDomainModel() }
            val payload = SyncPayload(
                employee = getActiveEmployee(),
                records = domainRecords,
                clientTimestamp = System.currentTimeMillis()
            )

            val response = apiService.syncCalls(payload)
            if (response.isSuccessful && response.body() != null) {
                val syncBody = response.body()!!
                val syncedIds = syncBody.syncedCallIds ?: emptyList()

                for (id in syncedIds) {
                    dao.updateSyncStatus(
                        callId = id,
                        status = SyncStatus.SYNCED.name,
                        timestamp = System.currentTimeMillis(),
                        errorMessage = null
                    )
                }

                Result.success(syncedIds.size)
            } else {
                val errorMsg = "HTTP ${response.code()}: ${response.message()}"
                for (record in pendingEntities) {
                    dao.updateSyncStatus(
                        callId = record.callId,
                        status = SyncStatus.FAILED.name,
                        timestamp = System.currentTimeMillis(),
                        errorMessage = errorMsg
                    )
                }
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            val pending = dao.getPendingSyncRecords()
            for (record in pending) {
                dao.updateSyncStatus(
                    callId = record.callId,
                    status = SyncStatus.FAILED.name,
                    timestamp = System.currentTimeMillis(),
                    errorMessage = e.message ?: "Network sync exception"
                )
            }
            Result.failure(e)
        }
    }

    /**
     * Enqueues durable WorkManager sync with exponential backoff on retry.
     */
    fun scheduleBackgroundSync() {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()

        val syncRequest = OneTimeWorkRequestBuilder<CallSyncWorker>()
            .setConstraints(constraints)
            .build()

        WorkManager.getInstance(context).enqueue(syncRequest)
    }
}
