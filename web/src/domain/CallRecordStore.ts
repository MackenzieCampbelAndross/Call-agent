import { CallRecord, SyncStatus } from '@call-agent/shared';

const STORAGE_KEY = 'purpledrive_hr_call_records_v1';

export class CallRecordStore {
  private records: Map<string, CallRecord> = new Map();
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed: CallRecord[] = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            parsed.forEach(r => this.records.set(r.callId, r));
          }
        }
      }
    } catch (e) {
      console.warn('[CallRecordStore] Failed to load records from localStorage:', e);
    }
  }

  private persist(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const array = Array.from(this.records.values());
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(array));
      }
    } catch (e) {
      console.warn('[CallRecordStore] Failed to persist records to localStorage:', e);
    }
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach(fn => fn());
  }

  public getAllRecords(): CallRecord[] {
    return Array.from(this.records.values()).sort((a, b) => b.startedAt - a.startedAt);
  }

  public getPendingRecords(): CallRecord[] {
    return this.getAllRecords().filter(r => r.syncStatus === 'PENDING' || r.syncStatus === 'FAILED');
  }

  /**
   * Upsert record by callId to guarantee duplicate prevention
   */
  public saveRecord(record: CallRecord): void {
    this.records.set(record.callId, { ...record });
    this.persist();
  }

  public updateRecordSyncStatus(
    callId: string,
    status: SyncStatus,
    errorMessage: string | null = null
  ): void {
    const existing = this.records.get(callId);
    if (existing) {
      existing.syncStatus = status;
      existing.lastSyncAttemptAt = Date.now();
      existing.syncAttempts = (existing.syncAttempts || 0) + 1;
      existing.syncErrorMessage = errorMessage;
      this.records.set(callId, existing);
      this.persist();
    }
  }

  public clearAll(): void {
    this.records.clear();
    this.persist();
  }
}

export const callRecordStore = new CallRecordStore();
