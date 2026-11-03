package com.purpledrive.dialer.domain

import com.purpledrive.dialer.domain.model.CallOutcome
import com.purpledrive.dialer.domain.model.CallRecord
import java.util.regex.Pattern

data class ValidationResult(
    val isValid: Boolean,
    val errors: List<String>
)

object CallRecordValidator {

    private val UUID_REGEX = Pattern.compile(
        "^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
        Pattern.CASE_INSENSITIVE
    )

    fun validate(record: CallRecord): ValidationResult {
        val errors = mutableListOf<String>()

        // 1. UUID format
        if (record.callId.isBlank() || !UUID_REGEX.matcher(record.callId).matches()) {
            errors.add("Invalid callId UUID format: '${record.callId}'")
        }

        // 2. Employee Identity
        if (record.employeeId.isBlank()) errors.add("Missing employeeId")
        if (record.employeeName.isBlank()) errors.add("Missing employeeName")
        if (record.employeeDepartment.isBlank()) errors.add("Missing employeeDepartment")

        // 3. Phone Number
        if (record.phoneNumber.isBlank() || record.phoneNumber.length < 3) {
            errors.add("Invalid phoneNumber: '${record.phoneNumber}'")
        }

        // 4. Timestamps
        if (record.startedAt <= 0) errors.add("Invalid startedAt timestamp")
        if (record.endedAt <= 0) errors.add("Invalid endedAt timestamp")
        if (record.endedAt < record.startedAt) {
            errors.add("endedAt (${record.endedAt}) cannot be before startedAt (${record.startedAt})")
        }

        // 5. Connected Duration Consistency
        val expectedDuration = DurationCalculator.calculateConnectedDurationSeconds(
            record.connectedAt,
            record.endedAt
        )

        if (record.connectedDurationSeconds != expectedDuration) {
            errors.add("connectedDurationSeconds mismatch: reported ${record.connectedDurationSeconds}, calculated $expectedDuration")
        }

        if (record.connectedAt == null && record.connectedDurationSeconds != 0L) {
            errors.add("connectedDurationSeconds must be 0 if call was never connected")
        }

        if (record.connectedAt != null && record.connectedAt < record.startedAt) {
            errors.add("connectedAt cannot be before startedAt")
        }

        // 6. Outcome Rules
        if (record.outcome == CallOutcome.COMPLETED && record.connectedAt == null) {
            errors.add("COMPLETED calls must have a connectedAt timestamp")
        }

        if ((record.outcome == CallOutcome.MISSED || record.outcome == CallOutcome.UNANSWERED) && record.connectedAt != null) {
            errors.add("${record.outcome} calls cannot have a connectedAt timestamp")
        }

        // 7. SIM slot
        if (record.simSlotIndex < 0) {
            errors.add("Invalid simSlotIndex: ${record.simSlotIndex}")
        }

        return ValidationResult(
            isValid = errors.isEmpty(),
            errors = errors
        )
    }
}
