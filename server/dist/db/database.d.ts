import { DbAdmin, DbEmployee, DbCallRecord, DbAuditLog, CallFilter } from './types';
import { CallRecord, DashboardStats } from '@call-agent/shared';
export declare class DatabaseService {
    private pgPool;
    private isPostgres;
    private localState;
    constructor();
    private init;
    private initFileStore;
    private persistToFile;
    private seedDefaults;
    findAdminByEmail(email: string): Promise<DbAdmin | null>;
    findEmployeeByEmail(email: string): Promise<DbEmployee | null>;
    findEmployeeById(id: string): Promise<DbEmployee | null>;
    getAllEmployees(): Promise<DbEmployee[]>;
    createEmployee(emp: Omit<DbEmployee, 'createdAt' | 'updatedAt'>): Promise<DbEmployee>;
    updateEmployeeStatus(id: string, status: 'ACTIVE' | 'INACTIVE'): Promise<boolean>;
    /**
     * Idempotently saves or updates a CallRecord.
     * Prevents duplicates strictly by callId.
     * Binds the server-verified employee ID and registered phone number.
     */
    upsertCallRecord(record: CallRecord, verifiedEmployee: {
        employeeId: string;
        name: string;
        department: string;
        registeredPhoneNumber: string;
    }): Promise<{
        inserted: boolean;
        record: DbCallRecord;
    }>;
    getCallRecords(filter?: CallFilter): Promise<{
        records: DbCallRecord[];
        total: number;
    }>;
    getCallRecordById(callId: string): Promise<DbCallRecord | null>;
    getDashboardStats(startDate?: number, endDate?: number): Promise<DashboardStats>;
    recordAuditLog(entry: Omit<DbAuditLog, 'id' | 'createdAt'>): Promise<void>;
    getAuditLogs(limit?: number): Promise<DbAuditLog[]>;
    clearAllRecords(): void;
}
export declare const dbService: DatabaseService;
