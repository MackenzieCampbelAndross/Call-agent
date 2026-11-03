package com.purpledrive.dialer.data.repository

import android.content.Context
import android.database.Cursor
import android.provider.ContactsContract
import com.purpledrive.dialer.domain.model.DeviceContact
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class ContactsRepository(private val context: Context) {

    suspend fun getDeviceContacts(query: String? = null): List<DeviceContact> = withContext(Dispatchers.IO) {
        val contactsMap = mutableMapOf<String, MutableContact>()

        val projection = arrayOf(
            ContactsContract.CommonDataKinds.Phone.CONTACT_ID,
            ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME_PRIMARY,
            ContactsContract.CommonDataKinds.Phone.NUMBER
        )

        var selection: String? = null
        var selectionArgs: Array<String>? = null

        if (!query.isNullOrBlank()) {
            val cleanQuery = "%${query.trim()}%"
            selection = "${ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME_PRIMARY} LIKE ? OR ${ContactsContract.CommonDataKinds.Phone.NUMBER} LIKE ?"
            selectionArgs = arrayOf(cleanQuery, cleanQuery)
        }

        val sortOrder = "${ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME_PRIMARY} ASC"

        try {
            val cursor: Cursor? = context.contentResolver.query(
                ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
                projection,
                selection,
                selectionArgs,
                sortOrder
            )

            cursor?.use { c ->
                val idIdx = c.getColumnIndex(ContactsContract.CommonDataKinds.Phone.CONTACT_ID)
                val nameIdx = c.getColumnIndex(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME_PRIMARY)
                val numberIdx = c.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NUMBER)

                while (c.moveToNext()) {
                    val id = if (idIdx != -1) c.getString(idIdx) else ""
                    val name = if (nameIdx != -1) c.getString(nameIdx) ?: "Unknown" else "Unknown"
                    val number = if (numberIdx != -1) c.getString(numberIdx) ?: "" else ""

                    if (id.isNotBlank() && number.isNotBlank()) {
                        val cleanNumber = number.replace("\\s+".toRegex(), "").replace("-", "")
                        val existing = contactsMap.getOrPut(id) {
                            MutableContact(id = id, name = name)
                        }
                        if (!existing.phoneNumbers.contains(cleanNumber)) {
                            existing.phoneNumbers.add(cleanNumber)
                        }
                    }
                }
            }
        } catch (e: SecurityException) {
            // Permission denied handled by UI
            return@withContext emptyList()
        } catch (e: Exception) {
            return@withContext emptyList()
        }

        return@withContext contactsMap.values.map { it.toDeviceContact() }
            .sortedBy { it.name.lowercase() }
    }

    private data class MutableContact(
        val id: String,
        val name: String,
        val phoneNumbers: MutableList<String> = mutableListOf()
    ) {
        fun toDeviceContact(): DeviceContact {
            val initials = if (name.isNotBlank()) {
                val parts = name.trim().split(" ")
                if (parts.size >= 2) {
                    "${parts[0].take(1)}${parts[1].take(1)}".uppercase()
                } else {
                    name.take(2).uppercase()
                }
            } else "#"

            return DeviceContact(
                id = id,
                name = name,
                primaryPhoneNumber = phoneNumbers.firstOrNull() ?: "",
                allPhoneNumbers = phoneNumbers,
                initials = initials
            )
        }
    }
}
