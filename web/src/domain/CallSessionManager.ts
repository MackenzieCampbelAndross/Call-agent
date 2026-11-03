import {
  CallRecord,
  CallStateEvent,
  CallState,
  calculateConnectedDurationSeconds,
  validateCallRecord
} from '@call-agent/shared';
import { getTelephonyAdapter } from '../telephony/adapterFactory';
import { callRecordStore } from './CallRecordStore';
import { syncManager } from './SyncManager';

export class CallSessionManager {
  private activeCall: CallStateEvent | null = null;
  private currentDurationSeconds: number = 0;
  private durationTimerHandle: number | null = null;
  private listeners: Set<() => void> = new Set();
  private lastCompletedRecord: CallRecord | null = null;

  constructor() {
    const adapter = getTelephonyAdapter();
    adapter.subscribeCallState(event => this.handleCallStateChange(event));
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach(fn => fn());
  }

  public getActiveCall(): CallStateEvent | null {
    return this.activeCall;
  }

  public getCallState(): CallState {
    return this.activeCall?.state || 'IDLE';
  }

  public getDurationSeconds(): number {
    return this.currentDurationSeconds;
  }

  public getLastCompletedRecord(): CallRecord | null {
    return this.lastCompletedRecord;
  }

  public clearLastCompletedRecord(): void {
    this.lastCompletedRecord = null;
    this.notify();
  }

  private startDurationTimer(): void {
    this.stopDurationTimer();
    this.currentDurationSeconds = 0;
    this.durationTimerHandle = window.setInterval(() => {
      if (this.activeCall?.connectedAt) {
        const now = Date.now();
        this.currentDurationSeconds = calculateConnectedDurationSeconds(this.activeCall.connectedAt, now);
        this.notify();
      }
    }, 1000);
  }

  private stopDurationTimer(): void {
    if (this.durationTimerHandle) {
      clearInterval(this.durationTimerHandle);
      this.durationTimerHandle = null;
    }
  }

  private handleCallStateChange(event: CallStateEvent): void {
    const previousState = this.activeCall?.state;
    this.activeCall = { ...event };

    // State transition into ACTIVE starts real-time duration counter
    if (event.state === 'ACTIVE' && previousState !== 'ACTIVE') {
      this.startDurationTimer();
    }

    // State transition into DISCONNECTED ends duration and produces durable record
    if (event.state === 'DISCONNECTED') {
      this.stopDurationTimer();
      this.processCallRecordCreation(event);
    }

    this.notify();
  }

  /**
   * Produces, validates, and stores a durable CallRecord upon call completion
   */
  private processCallRecordCreation(event: CallStateEvent): void {
    const employee = syncManager.getEmployee();
    const adapter = getTelephonyAdapter();

    const startedAt = event.startedAt || (Date.now() - 5000);
    const connectedAt = event.connectedAt || null;
    const endedAt = event.endedAt || Date.now();

    const connectedDuration = calculateConnectedDurationSeconds(connectedAt, endedAt);
    const isSimulated = adapter.isSimulated();

    const record: CallRecord = {
      callId: event.callId,
      employeeId: employee.employeeId,
      employeeName: employee.name,
      employeeDepartment: employee.department,
      phoneNumber: event.phoneNumber,
      contactName: event.contactName || null,
      direction: event.direction,
      startedAt,
      connectedAt,
      endedAt,
      connectedDurationSeconds: connectedDuration,
      outcome: event.outcome || (connectedAt ? 'COMPLETED' : 'REJECTED'),
      simSlotIndex: event.simSlotIndex ?? 0,
      simDisplayName: event.simSlotIndex === 1 ? 'SIM 2 (Personal)' : 'SIM 1 (Work HR)',
      syncStatus: 'PENDING',
      syncAttempts: 0,
      lastSyncAttemptAt: null,
      syncErrorMessage: null,
      isSimulated,
      notes: event.disconnectReason || null,
      deviceInfo: {
        platform: isSimulated ? 'browser-mock' : 'android',
        appVersion: '1.0.0'
      }
    };

    // Strict domain validation check
    const validation = validateCallRecord(record);
    if (!validation.valid) {
      console.error('[CallSessionManager] CallRecord validation failed:', validation.errors);
      record.notes = `Validation warnings: ${validation.errors.join('; ')}`;
    }

    // Save to durable store
    callRecordStore.saveRecord(record);
    this.lastCompletedRecord = record;

    // Immediately trigger sync
    syncManager.triggerSync();
  }
}

export const callSessionManager = new CallSessionManager();
