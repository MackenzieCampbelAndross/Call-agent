"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizePhoneNumber = sanitizePhoneNumber;
exports.formatPhoneNumber = formatPhoneNumber;
exports.validateCallRecord = validateCallRecord;
const duration_1 = require("./duration");
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PHONE_NUMBER_SANITIZE_REGEX = /[\s\-\(\)\.]/g;
/**
 * Sanitize a phone number by stripping spaces, hyphens, and parenthesis.
 */
function sanitizePhoneNumber(phone) {
    if (!phone)
        return '';
    return phone.replace(PHONE_NUMBER_SANITIZE_REGEX, '').trim();
}
/**
 * Format a phone number for UI display.
 */
function formatPhoneNumber(phone) {
    const cleaned = sanitizePhoneNumber(phone);
    if (!cleaned)
        return '';
    // E.164 or US 10-digit
    if (cleaned.startsWith('+1') && cleaned.length === 12) {
        return `+1 (${cleaned.slice(2, 5)}) ${cleaned.slice(5, 8)}-${cleaned.slice(8)}`;
    }
    if (cleaned.length === 10 && !cleaned.startsWith('+')) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
        return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
}
/**
 * Comprehensive CallRecord validator enforcing data contract rules.
 */
function validateCallRecord(record) {
    const errors = [];
    // 1. Unique Call ID check
    if (!record.callId) {
        errors.push('Missing callId');
    }
    else if (!UUID_V4_REGEX.test(record.callId)) {
        errors.push(`Invalid callId UUID format: "${record.callId}"`);
    }
    // 2. Employee Identity
    if (!record.employeeId || record.employeeId.trim().length === 0) {
        errors.push('Missing employeeId');
    }
    if (!record.employeeName || record.employeeName.trim().length === 0) {
        errors.push('Missing employeeName');
    }
    if (!record.employeeDepartment || record.employeeDepartment.trim().length === 0) {
        errors.push('Missing employeeDepartment');
    }
    // 3. Phone Number
    if (!record.phoneNumber || record.phoneNumber.trim().length === 0) {
        errors.push('Missing phoneNumber');
    }
    else {
        const sanitized = sanitizePhoneNumber(record.phoneNumber);
        if (sanitized.length < 3) {
            errors.push(`Invalid phoneNumber length: "${record.phoneNumber}"`);
        }
    }
    // 4. Direction
    if (record.direction !== 'OUTGOING' && record.direction !== 'INCOMING') {
        errors.push(`Invalid direction: "${record.direction}"`);
    }
    // 5. Timestamps
    if (typeof record.startedAt !== 'number' || record.startedAt <= 0) {
        errors.push(`Invalid startedAt timestamp: ${record.startedAt}`);
    }
    if (typeof record.endedAt !== 'number' || record.endedAt <= 0) {
        errors.push(`Invalid endedAt timestamp: ${record.endedAt}`);
    }
    if (record.startedAt && record.endedAt && record.endedAt < record.startedAt) {
        errors.push(`endedAt (${record.endedAt}) cannot be before startedAt (${record.startedAt})`);
    }
    // 6. Connected Duration & Connection State
    const expectedDuration = (0, duration_1.calculateConnectedDurationSeconds)(record.connectedAt, record.endedAt);
    if (typeof record.connectedDurationSeconds !== 'number') {
        errors.push('connectedDurationSeconds must be a number');
    }
    else if (record.connectedDurationSeconds !== expectedDuration) {
        errors.push(`connectedDurationSeconds mismatch: reported ${record.connectedDurationSeconds}, calculated ${expectedDuration}`);
    }
    if (!record.connectedAt && record.connectedDurationSeconds !== 0) {
        errors.push('connectedDurationSeconds must be 0 if call was never connected');
    }
    if (record.connectedAt && record.startedAt && record.connectedAt < record.startedAt) {
        errors.push(`connectedAt (${record.connectedAt}) cannot be before startedAt (${record.startedAt})`);
    }
    // 7. Outcome Consistency
    const validOutcomes = [
        'COMPLETED',
        'MISSED',
        'REJECTED',
        'UNANSWERED',
        'BUSY',
        'FAILED',
        'INTERRUPTED',
    ];
    if (!record.outcome || !validOutcomes.includes(record.outcome)) {
        errors.push(`Invalid outcome: "${record.outcome}"`);
    }
    else {
        if (record.outcome === 'COMPLETED' && !record.connectedAt) {
            errors.push('COMPLETED calls must have a connectedAt timestamp');
        }
        if ((record.outcome === 'MISSED' || record.outcome === 'UNANSWERED') && record.connectedAt) {
            errors.push(`${record.outcome} calls cannot have a connectedAt timestamp`);
        }
    }
    // 8. SIM Slot
    if (typeof record.simSlotIndex !== 'number' || record.simSlotIndex < 0) {
        errors.push(`Invalid simSlotIndex: ${record.simSlotIndex}`);
    }
    // 9. Sync Status
    const validSyncStatuses = ['PENDING', 'SYNCED', 'FAILED'];
    if (!record.syncStatus || !validSyncStatuses.includes(record.syncStatus)) {
        errors.push(`Invalid syncStatus: "${record.syncStatus}"`);
    }
    // 10. Simulated Flag
    if (typeof record.isSimulated !== 'boolean') {
        errors.push('isSimulated flag must be an explicit boolean');
    }
    return {
        valid: errors.length === 0,
        errors,
    };
}
