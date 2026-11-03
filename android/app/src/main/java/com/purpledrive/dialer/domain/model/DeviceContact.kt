package com.purpledrive.dialer.domain.model

data class DeviceContact(
    val id: String,
    val name: String,
    val primaryPhoneNumber: String,
    val allPhoneNumbers: List<String> = emptyList(),
    val initials: String = ""
)
