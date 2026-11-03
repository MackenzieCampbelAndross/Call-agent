package com.purpledrive.dialer.data.local

import android.content.Context
import android.content.SharedPreferences
import com.purpledrive.dialer.domain.model.EmployeeIdentity

class AuthPreferences(context: Context) {

    private val prefs: SharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    var authToken: String?
        get() = prefs.getString(KEY_TOKEN, null)
        set(value) = prefs.edit().putString(KEY_TOKEN, value).apply()

    var employeeId: String?
        get() = prefs.getString(KEY_EMP_ID, "EMP-1042")
        set(value) = prefs.edit().putString(KEY_EMP_ID, value).apply()

    var employeeName: String?
        get() = prefs.getString(KEY_EMP_NAME, "Sarah Jenkins")
        set(value) = prefs.edit().putString(KEY_EMP_NAME, value).apply()

    var employeeDepartment: String?
        get() = prefs.getString(KEY_EMP_DEPT, "Talent Acquisition")
        set(value) = prefs.edit().putString(KEY_EMP_DEPT, value).apply()

    var registeredPhoneNumber: String?
        get() = prefs.getString(KEY_REG_PHONE, "+14155550100")
        set(value) = prefs.edit().putString(KEY_REG_PHONE, value).apply()

    val isLoggedIn: Boolean
        get() = !authToken.isNullOrBlank()

    fun saveSession(token: String, employee: EmployeeIdentity) {
        prefs.edit()
            .putString(KEY_TOKEN, token)
            .putString(KEY_EMP_ID, employee.employeeId)
            .putString(KEY_EMP_NAME, employee.name)
            .putString(KEY_EMP_DEPT, employee.department)
            .putString(KEY_REG_PHONE, employee.registeredPhoneNumber)
            .apply()
    }

    fun getEmployeeIdentity(): EmployeeIdentity {
        return EmployeeIdentity(
            employeeId = employeeId ?: "EMP-1042",
            name = employeeName ?: "Sarah Jenkins",
            department = employeeDepartment ?: "Talent Acquisition",
            email = "sarah.jenkins@purpledrive.internal",
            employeeCode = "TA-SJ-1042",
            registeredPhoneNumber = registeredPhoneNumber ?: "+14155550100"
        )
    }

    fun clearSession() {
        prefs.edit().clear().apply()
    }

    companion object {
        private const val PREFS_NAME = "purpledrive_dialer_auth"
        private const val KEY_TOKEN = "auth_token"
        private const val KEY_EMP_ID = "employee_id"
        private const val KEY_EMP_NAME = "employee_name"
        private const val KEY_EMP_DEPT = "employee_dept"
        private const val KEY_REG_PHONE = "registered_phone"
    }
}
