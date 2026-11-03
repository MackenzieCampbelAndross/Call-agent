import {
  CallRecord,
  EmployeeIdentity,
  SyncPayload,
  SyncResponse
} from '@call-agent/shared';
import { callRecordStore } from './CallRecordStore';

export type NetworkCondition = 'ONLINE' | 'OFFLINE' | 'FLAKY';

export class SyncManager {
  private networkCondition: NetworkCondition = 'ONLINE';
  private syncInProgress = false;
  private retryTimerHandle: number | null = null;
  private backoffDelayMs = 1500;
  private maxBackoffDelayMs = 30000;
  private listeners: Set<() => void> = new Set();

  private activeEmployee: EmployeeIdentity = {
    employeeId: 'EMP-TEST',
    name: 'Test User',
    department: 'Quality Assurance',
    email: 'test@gmail.com',
    employeeCode: 'HR-TEST-001'
  };

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.setNetworkCondition('ONLINE');
        this.triggerSync();
      });
      window.addEventListener('offline', () => {
        this.setNetworkCondition('OFFLINE');
      });
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach(fn => fn());
  }

  public setEmployee(emp: EmployeeIdentity): void {
    this.activeEmployee = emp;
    this.notify();
  }

  public getEmployee(): EmployeeIdentity {
    return { ...this.activeEmployee };
  }

  public setNetworkCondition(cond: NetworkCondition): void {
    this.networkCondition = cond;
    this.notify();
    if (cond === 'ONLINE') {
      this.backoffDelayMs = 1500;
      this.triggerSync();
    }
  }

  public getNetworkCondition(): NetworkCondition {
    return this.networkCondition;
  }

  public isSyncing(): boolean {
    return this.syncInProgress;
  }

  /**
   * Main synchronization routine:
   * Finds pending or failed records and posts them to /api/calls/sync
   */
  public async triggerSync(): Promise<void> {
    if (this.syncInProgress) return;
    if (this.networkCondition === 'OFFLINE') {
      console.log('[SyncManager] Network is offline. Sync deferred.');
      return;
    }

    const pendingRecords = callRecordStore.getPendingRecords();
    if (pendingRecords.length === 0) {
      return;
    }

    this.syncInProgress = true;
    this.notify();

    try {
      // Simulate artificial network drop if in FLAKY mode
      if (this.networkCondition === 'FLAKY' && Math.random() < 0.5) {
        throw new Error('Simulated Network Timeout / 503 Service Unavailable');
      }

      const payload: SyncPayload = {
        employee: this.activeEmployee,
        records: pendingRecords,
        clientTimestamp: Date.now()
      };

      const res = await fetch('/api/calls/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}: ${res.statusText}`);
      }

      const data: SyncResponse = await res.json();

      if (data.syncedCallIds && Array.isArray(data.syncedCallIds)) {
        data.syncedCallIds.forEach(id => {
          callRecordStore.updateRecordSyncStatus(id, 'SYNCED');
        });
      }

      // Reset backoff on success
      this.backoffDelayMs = 1500;
      console.log(`[SyncManager] Successfully synchronized ${data.syncedCount} records.`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.warn('[SyncManager] Sync failed:', errorMessage);

      // Mark records as FAILED with error message
      pendingRecords.forEach(r => {
        callRecordStore.updateRecordSyncStatus(r.callId, 'FAILED', errorMessage);
      });

      // Schedule exponential backoff retry
      this.scheduleRetry();
    } finally {
      this.syncInProgress = false;
      this.notify();
    }
  }

  private scheduleRetry(): void {
    if (this.retryTimerHandle) {
      clearTimeout(this.retryTimerHandle);
    }
    console.log(`[SyncManager] Scheduling retry in ${this.backoffDelayMs}ms...`);
    this.retryTimerHandle = window.setTimeout(() => {
      this.retryTimerHandle = null;
      this.backoffDelayMs = Math.min(this.backoffDelayMs * 2, this.maxBackoffDelayMs);
      this.triggerSync();
    }, this.backoffDelayMs);
  }
}

export const syncManager = new SyncManager();
