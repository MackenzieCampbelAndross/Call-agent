import { CallDirection, CallOutcome, SyncStatus } from '@call-agent/shared';
export interface DbAdmin {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'SUPER_ADMIN';
    passwordHash: string;
    createdAt: string;
    updatedAt: string;
}
export interface DbEmployee {
    id: string;
    name: string;
    email: string;
    department: string;
    employeeCode: string;
    registeredPhoneNumber: string;
    status: 'ACTIVE' | 'INACTIVE';
    passwordHash: string;
    createdAt: string;
    updatedAt: string;
}
export interface DbCallRecord {
    callId: string;
    employeeId: string;
    employeeName: string;
    employeeDepartment: string;
    registeredPhoneNumber: string;
    phoneNumber: string;
    contactName?: string | null;
    direction: CallDirection;
    startedAt: number;
    connectedAt?: number | null;
    endedAt: number;
    connectedDurationSeconds: number;
    outcome: CallOutcome;
    simSlotIndex: number;
    simDisplayName: string;
    syncStatus: SyncStatus;
    syncAttempts: number;
    lastSyncAttemptAt?: number | null;
    syncErrorMessage?: string | null;
    isSimulated: boolean;
    notes?: string | null;
    deviceInfo?: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
}
export interface DbAuditLog {
    id: string;
    timestamp: number;
    actorId: string;
    actorEmail?: string;
    actorType: 'ADMIN' | 'EMPLOYEE' | 'SYSTEM';
    action: string;
    details?: Record<string, unknown>;
    ipAddress?: string;
    createdAt: string;
}
export interface CallFilter {
    employeeId?: string;
    direction?: CallDirection;
    outcome?: CallOutcome;
    phoneNumber?: string;
    startDate?: number;
    endDate?: number;
    isSimulated?: boolean;
    limit?: number;
    offset?: number;
    sortBy?: 'startedAt' | 'connectedDurationSeconds';
    sortOrder?: 'ASC' | 'DESC';
}
