import { describe, it, expect } from 'vitest';
import { validateCallRecord, sanitizePhoneNumber, formatPhoneNumber } from '../src/validation';
import { CallRecord } from '../src/types';

describe('CallRecord Validation', () => {
  const validRecord: CallRecord = {
    callId: 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d',
    employeeId: 'EMP-1042',
    employeeName: 'Sarah Jenkins',
    employeeDepartment: 'Technical Talent Acquisition',
    phoneNumber: '+14155552671',
    contactName: 'David Miller (Candidate)',
    direction: 'OUTGOING',
    startedAt: 1700000000000,
    connectedAt: 1700000005000,
    endedAt: 1700000065000,
    connectedDurationSeconds: 60,
    outcome: 'COMPLETED',
    simSlotIndex: 0,
    simDisplayName: 'SIM 1 - Primary HR',
    syncStatus: 'PENDING',
    syncAttempts: 0,
    isSimulated: true,
  };

  it('validates a complete, consistent record successfully', () => {
    const result = validateCallRecord(validRecord);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects invalid or missing UUID callId', () => {
    const invalid = { ...validRecord, callId: 'not-a-valid-uuid' };
    const result = validateCallRecord(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Invalid callId UUID'))).toBe(true);
  });

  it('rejects mismatched duration calculation', () => {
    // 60 seconds diff in timestamps, but reporting 120
    const invalid = { ...validRecord, connectedDurationSeconds: 120 };
    const result = validateCallRecord(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('connectedDurationSeconds mismatch'))).toBe(true);
  });

  it('enforces that unconnected calls have duration 0 and no connectedAt', () => {
    const missedRecord: CallRecord = {
      ...validRecord,
      outcome: 'MISSED',
      direction: 'INCOMING',
      connectedAt: null,
      endedAt: 1700000025000,
      connectedDurationSeconds: 0,
    };
    const result = validateCallRecord(missedRecord);
    expect(result.valid).toBe(true);

    const invalidMissed = {
      ...missedRecord,
      connectedDurationSeconds: 10,
    };
    const invalidResult = validateCallRecord(invalidMissed);
    expect(invalidResult.valid).toBe(false);
  });

  it('rejects COMPLETED calls that have no connectedAt timestamp', () => {
    const invalid = {
      ...validRecord,
      outcome: 'COMPLETED' as const,
      connectedAt: null,
      connectedDurationSeconds: 0,
    };
    const result = validateCallRecord(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('COMPLETED calls must have a connectedAt'))).toBe(true);
  });
});

describe('Phone Number Utilities', () => {
  it('sanitizes phone numbers properly', () => {
    expect(sanitizePhoneNumber('+1 (415) 555-2671')).toBe('+14155552671');
    expect(sanitizePhoneNumber('415.555.2671')).toBe('4155552671');
  });

  it('formats phone numbers for UI presentation', () => {
    expect(formatPhoneNumber('+14155552671')).toBe('+1 (415) 555-2671');
    expect(formatPhoneNumber('4155552671')).toBe('(415) 555-2671');
  });
});
