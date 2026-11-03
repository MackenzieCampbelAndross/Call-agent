package com.purpledrive.dialer.sync

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.purpledrive.dialer.DialerApplication

class CallSyncWorker(
    appContext: Context,
    params: WorkerParameters
) : CoroutineWorker(appContext, params) {

    override suspend fun doWork(): Result {
        val app = applicationContext as? DialerApplication ?: return Result.failure()
        val repository = app.callRepository

        return try {
            val syncResult = repository.syncPendingRecords()
            if (syncResult.isSuccess) {
                Result.success()
            } else {
                // Retry with exponential backoff
                Result.retry()
            }
        } catch (e: Exception) {
            Result.retry()
        }
    }
}
