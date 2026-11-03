import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CallRecordStore } from '../src/domain/CallRecordStore';
import { CallRecord } from '@call-agent/shared';

describe('CallRecordStore and Duplicate Prevention', () => {
  let store: CallRecordStore;

  const sampleRecord1: CallRecord = {
    callId: '00000000-0000-4000-8000-000000000001',
    employeeId: 'EMP-1042',
    employeeName: 'Sarah Jenkins',
    employeeDepartment: 'Talent Acquisition',
    phoneNumber: '+14155552671',
    contactName: 'David Miller',
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

  beforeEach(() => {
    store = new CallRecordStore();
    store.clearAll();
  });

  it('saves new call records into durable store', () => {
    store.saveRecord(sampleRecord1);
    const records = store.getAllRecords();
    expect(records).toHaveLength(1);
    expect(records[0].callId).toBe(sampleRecord1.callId);
  });

  it('prevents duplicates when same callId is saved multiple times (idempotent)', () => {
    store.saveRecord(sampleRecord1);
    // Save again with same callId
    store.saveRecord({ ...sampleRecord1, syncAttempts: 1 });
    store.saveRecord(sampleRecord1);

    const records = store.getAllRecords();
    expect(records).toHaveLength(1);
  });

  it('updates sync status correctly', () => {
    store.saveRecord(sampleRecord1);
    store.updateRecordSyncStatus(sampleRecord1.callId, 'SYNCED');

    const updated = store.getAllRecords()[0];
    expect(updated.syncStatus).toBe('SYNCED');
    expect(updated.syncAttempts).toBe(1);
    expect(updated.lastSyncAttemptAt).toBeGreaterThan(0);
  });

  it('filters pending records for synchronization queue', () => {
    store.saveRecord(sampleRecord1);
    expect(store.getPendingRecords()).toHaveLength(1);

    store.updateRecordSyncStatus(sampleRecord1.callId, 'SYNCED');
    expect(store.getPendingRecords()).toHaveLength(0);

    store.updateRecordSyncStatus(sampleRecord1.callId, 'FAILED', 'Network error');
    expect(store.getPendingRecords()).toHaveLength(1);
  });
});
