package com.purpledrive.dialer

import android.app.Application
import com.purpledrive.dialer.data.local.AppDatabase
import com.purpledrive.dialer.data.local.AuthPreferences
import com.purpledrive.dialer.data.remote.SyncApiService
import com.purpledrive.dialer.data.repository.CallRepository
import com.purpledrive.dialer.data.repository.ContactsRepository
import com.purpledrive.dialer.domain.TelephonyAdapter
import com.purpledrive.dialer.telephony.AndroidTelephonyAdapter

class DialerApplication : Application() {

    val database by lazy { AppDatabase.getInstance(this) }
    val authPreferences by lazy { AuthPreferences(this) }
    val syncApiService by lazy { SyncApiService.create(this) }
    val callRepository by lazy { CallRepository(database.callRecordDao(), syncApiService, this, authPreferences) }
    val contactsRepository by lazy { ContactsRepository(this) }
    val telephonyAdapter: TelephonyAdapter by lazy { AndroidTelephonyAdapter(this) }

    override fun onCreate() {
        super.onCreate()
        instance = this
    }

    companion object {
        lateinit var instance: DialerApplication
            private set
    }
}
