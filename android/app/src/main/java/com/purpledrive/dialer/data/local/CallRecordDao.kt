package com.purpledrive.dialer.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface CallRecordDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertRecord(record: CallRecordEntity)

    @Query("SELECT * FROM call_records ORDER BY startedAt DESC")
    fun getAllRecords(): Flow<List<CallRecordEntity>>

    @Query("SELECT * FROM call_records WHERE callId = :callId LIMIT 1")
    suspend fun getRecordById(callId: String): CallRecordEntity?

    @Query("SELECT * FROM call_records WHERE syncStatus = 'PENDING' OR syncStatus = 'FAILED'")
    suspend fun getPendingSyncRecords(): List<CallRecordEntity>

    @Query("""
        UPDATE call_records 
        SET syncStatus = :status, 
            lastSyncAttemptAt = :timestamp, 
            syncAttempts = syncAttempts + 1, 
            syncErrorMessage = :errorMessage 
        WHERE callId = :callId
    """)
    suspend fun updateSyncStatus(
        callId: String,
        status: String,
        timestamp: Long,
        errorMessage: String?
    )

    @Query("DELETE FROM call_records")
    suspend fun clearAll()
}
