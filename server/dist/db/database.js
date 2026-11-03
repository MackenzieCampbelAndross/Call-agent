"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbService = exports.DatabaseService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const pg_1 = require("pg");
const DATA_DIR = path_1.default.resolve(__dirname, '../../data');
const PERSISTENT_FILE = path_1.default.join(DATA_DIR, 'persistent_store.json');
class DatabaseService {
    pgPool = null;
    isPostgres = false;
    localState = {
        admins: [],
        employees: [],
        callRecords: [],
        auditLogs: []
    };
    constructor() {
        this.init();
    }
    init() {
        const dbUrl = process.env.DATABASE_URL;
        if (dbUrl && (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://'))) {
            try {
                console.log('[DatabaseService] Initializing PostgreSQL pool with DATABASE_URL...');
                this.pgPool = new pg_1.Pool({ connectionString: dbUrl, ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false });
                this.isPostgres = true;
            }
            catch (err) {
                console.warn('[DatabaseService] Failed to initialize PostgreSQL pool. Falling back to persistent file store:', err);
                this.initFileStore();
            }
        }
        else {
            console.log('[DatabaseService] Running with persistent durable file storage at:', PERSISTENT_FILE);
            this.initFileStore();
        }
    }
    initFileStore() {
        if (!fs_1.default.existsSync(DATA_DIR)) {
            fs_1.default.mkdirSync(DATA_DIR, { recursive: true });
        }
        if (fs_1.default.existsSync(PERSISTENT_FILE)) {
            try {
                const raw = fs_1.default.readFileSync(PERSISTENT_FILE, 'utf-8');
                this.localState = JSON.parse(raw);
                console.log(`[DatabaseService] Loaded ${this.localState.callRecords.length} records, ${this.localState.employees.length} employees from file store.`);
            }
            catch (err) {
                console.error('[DatabaseService] Error reading persistent store. Re-initializing:', err);
                this.seedDefaults();
            }
        }
        else {
            this.seedDefaults();
        }
    }
    persistToFile() {
        if (this.isPostgres)
            return;
        try {
            const tempPath = `${PERSISTENT_FILE}.tmp`;
            fs_1.default.writeFileSync(tempPath, JSON.stringify(this.localState, null, 2), 'utf-8');
            fs_1.default.renameSync(tempPath, PERSISTENT_FILE);
        }
        catch (err) {
            console.error('[DatabaseService] Failed to persist state to file:', err);
        }
    }
    seedDefaults() {
        const now = new Date().toISOString();
        // Default Super Admin: admin@purpledrive.com / Admin@PurpleDrive2026!
        const defaultAdmin = {
            id: 'admin-root-01',
            name: 'Executive Administrator',
            email: 'admin@purpledrive.com',
            role: 'SUPER_ADMIN',
            passwordHash: '$2b$10$jZNBtfB/D6Fj3TkIDNsaS.4DjJK0IcV5Lq8pThz5X8EC2djtFP3GO',
            createdAt: now,
            updatedAt: now
        };
        const backupAdmin = {
            id: 'admin-root-02',
            name: 'Administrator',
            email: 'admin@purpledrive.internal',
            role: 'SUPER_ADMIN',
            passwordHash: '$2b$10$jZNBtfB/D6Fj3TkIDNsaS.4DjJK0IcV5Lq8pThz5X8EC2djtFP3GO',
            createdAt: now,
            updatedAt: now
        };
        // Default Test Employee: test@gmail.com with OTP 123456
        const defaultEmployees = [
            {
                id: 'EMP-TEST',
                name: 'Test User',
                email: 'test@gmail.com',
                department: 'Quality Assurance',
                employeeCode: 'HR-TEST-001',
                registeredPhoneNumber: '+14155550100',
                status: 'ACTIVE',
                passwordHash: '$2b$10$v09duzImWI/HkBCx4gY5CeaHN6FCZyxZfF1POWY6TiPtPtCTeBf5C',
                createdAt: now,
                updatedAt: now
            }
        ];
        this.localState = {
            admins: [defaultAdmin, backupAdmin],
            employees: defaultEmployees,
            callRecords: [],
            auditLogs: [
                {
                    id: 'audit-seed-01',
                    timestamp: Date.now(),
                    actorId: 'system',
                    actorEmail: 'system@purpledrive.com',
                    actorType: 'SYSTEM',
                    action: 'STORE_INITIALIZED',
                    details: { message: 'Database initialized with default administrator and test employee account' },
                    createdAt: now
                }
            ]
        };
        this.persistToFile();
    }
    // --- Administrator Methods ---
    async findAdminByEmail(email) {
        if (this.isPostgres && this.pgPool) {
            const res = await this.pgPool.query('SELECT id, name, email, role, password_hash as "passwordHash", created_at as "createdAt" FROM admin_users WHERE LOWER(email) = LOWER($1) LIMIT 1', [email]);
            return res.rows[0] || null;
        }
        return this.localState.admins.find(a => a.email.toLowerCase() === email.toLowerCase()) || null;
    }
    // --- Employee Methods ---
    async findEmployeeByEmail(email) {
        if (this.isPostgres && this.pgPool) {
            const res = await this.pgPool.query('SELECT id, name, email, department, employee_code as "employeeCode", registered_phone_number as "registeredPhoneNumber", status, password_hash as "passwordHash" FROM employees WHERE LOWER(email) = LOWER($1) LIMIT 1', [email]);
            return res.rows[0] || null;
        }
        return this.localState.employees.find(e => e.email.toLowerCase() === email.toLowerCase()) || null;
    }
    async findEmployeeById(id) {
        if (this.isPostgres && this.pgPool) {
            const res = await this.pgPool.query('SELECT id, name, email, department, employee_code as "employeeCode", registered_phone_number as "registeredPhoneNumber", status, password_hash as "passwordHash" FROM employees WHERE id = $1 LIMIT 1', [id]);
            return res.rows[0] || null;
        }
        return this.localState.employees.find(e => e.id === id) || null;
    }
    async getAllEmployees() {
        if (this.isPostgres && this.pgPool) {
            const res = await this.pgPool.query('SELECT id, name, email, department, employee_code as "employeeCode", registered_phone_number as "registeredPhoneNumber", status, created_at as "createdAt", updated_at as "updatedAt" FROM employees ORDER BY name ASC');
            return res.rows;
        }
        return [...this.localState.employees].sort((a, b) => a.name.localeCompare(b.name));
    }
    async createEmployee(emp) {
        const now = new Date().toISOString();
        const created = { ...emp, createdAt: now, updatedAt: now };
        if (this.isPostgres && this.pgPool) {
            await this.pgPool.query(`INSERT INTO employees (id, name, email, department, employee_code, registered_phone_number, status, password_hash, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`, [created.id, created.name, created.email, created.department, created.employeeCode, created.registeredPhoneNumber, created.status, created.passwordHash, now, now]);
        }
        else {
            this.localState.employees.push(created);
            this.persistToFile();
        }
        return created;
    }
    async updateEmployeeStatus(id, status) {
        const now = new Date().toISOString();
        if (this.isPostgres && this.pgPool) {
            const res = await this.pgPool.query('UPDATE employees SET status = $1, updated_at = $2 WHERE id = $3', [status, now, id]);
            return (res.rowCount || 0) > 0;
        }
        const emp = this.localState.employees.find(e => e.id === id);
        if (!emp)
            return false;
        emp.status = status;
        emp.updatedAt = now;
        this.persistToFile();
        return true;
    }
    // --- Call Records Methods ---
    /**
     * Idempotently saves or updates a CallRecord.
     * Prevents duplicates strictly by callId.
     * Binds the server-verified employee ID and registered phone number.
     */
    async upsertCallRecord(record, verifiedEmployee) {
        const now = new Date().toISOString();
        const dbRecord = {
            callId: record.callId,
            employeeId: verifiedEmployee.employeeId, // ENFORCED BY SERVER AUTH
            employeeName: verifiedEmployee.name,
            employeeDepartment: verifiedEmployee.department,
            registeredPhoneNumber: verifiedEmployee.registeredPhoneNumber,
            phoneNumber: record.phoneNumber,
            contactName: record.contactName || null,
            direction: record.direction,
            startedAt: record.startedAt,
            connectedAt: record.connectedAt || null,
            endedAt: record.endedAt,
            connectedDurationSeconds: record.connectedDurationSeconds,
            outcome: record.outcome,
            simSlotIndex: record.simSlotIndex ?? 0,
            simDisplayName: record.simDisplayName || 'SIM 1',
            syncStatus: 'SYNCED',
            syncAttempts: (record.syncAttempts || 0) + 1,
            lastSyncAttemptAt: Date.now(),
            syncErrorMessage: null,
            isSimulated: record.isSimulated ?? false,
            notes: record.notes || null,
            deviceInfo: record.deviceInfo || undefined,
            createdAt: now,
            updatedAt: now
        };
        if (this.isPostgres && this.pgPool) {
            const query = `
        INSERT INTO call_records (
          call_id, employee_id, employee_name, employee_department, registered_phone_number,
          phone_number, contact_name, direction, started_at, connected_at, ended_at,
          connected_duration_seconds, outcome, sim_slot_index, sim_display_name,
          sync_status, sync_attempts, last_sync_attempt_at, sync_error_message,
          is_simulated, notes, device_info, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24
        ) ON CONFLICT (call_id) DO UPDATE SET
          sync_status = 'SYNCED',
          sync_attempts = call_records.sync_attempts + 1,
          last_sync_attempt_at = EXCLUDED.last_sync_attempt_at,
          sync_error_message = NULL,
          updated_at = EXCLUDED.updated_at
      `;
            await this.pgPool.query(query, [
                dbRecord.callId, dbRecord.employeeId, dbRecord.employeeName, dbRecord.employeeDepartment, dbRecord.registeredPhoneNumber,
                dbRecord.phoneNumber, dbRecord.contactName, dbRecord.direction, dbRecord.startedAt, dbRecord.connectedAt, dbRecord.endedAt,
                dbRecord.connectedDurationSeconds, dbRecord.outcome, dbRecord.simSlotIndex, dbRecord.simDisplayName,
                dbRecord.syncStatus, dbRecord.syncAttempts, dbRecord.lastSyncAttemptAt, dbRecord.syncErrorMessage,
                dbRecord.isSimulated, dbRecord.notes, dbRecord.deviceInfo ? JSON.stringify(dbRecord.deviceInfo) : null,
                now, now
            ]);
            return { inserted: true, record: dbRecord };
        }
        const existingIndex = this.localState.callRecords.findIndex(r => r.callId === record.callId);
        if (existingIndex >= 0) {
            const existing = this.localState.callRecords[existingIndex];
            const updated = {
                ...existing,
                syncStatus: 'SYNCED',
                syncAttempts: (existing.syncAttempts || 0) + 1,
                lastSyncAttemptAt: Date.now(),
                syncErrorMessage: null,
                updatedAt: now
            };
            this.localState.callRecords[existingIndex] = updated;
            this.persistToFile();
            return { inserted: false, record: updated };
        }
        else {
            this.localState.callRecords.push(dbRecord);
            this.persistToFile();
            return { inserted: true, record: dbRecord };
        }
    }
    async getCallRecords(filter = {}) {
        let filtered = [...this.localState.callRecords];
        if (filter.employeeId) {
            filtered = filtered.filter(r => r.employeeId === filter.employeeId);
        }
        if (filter.direction) {
            filtered = filtered.filter(r => r.direction === filter.direction);
        }
        if (filter.outcome) {
            filtered = filtered.filter(r => r.outcome === filter.outcome);
        }
        if (filter.phoneNumber) {
            const query = filter.phoneNumber.trim().toLowerCase();
            filtered = filtered.filter(r => r.phoneNumber.includes(query) ||
                (r.contactName && r.contactName.toLowerCase().includes(query)) ||
                r.registeredPhoneNumber.includes(query));
        }
        if (filter.startDate) {
            filtered = filtered.filter(r => r.startedAt >= filter.startDate);
        }
        if (filter.endDate) {
            filtered = filtered.filter(r => r.startedAt <= filter.endDate);
        }
        if (typeof filter.isSimulated === 'boolean') {
            filtered = filtered.filter(r => r.isSimulated === filter.isSimulated);
        }
        // Sort
        const sortField = filter.sortBy || 'startedAt';
        const isAsc = filter.sortOrder === 'ASC';
        filtered.sort((a, b) => {
            const valA = a[sortField] || 0;
            const valB = b[sortField] || 0;
            return isAsc ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
        });
        const total = filtered.length;
        const offset = filter.offset || 0;
        const limit = filter.limit || 50;
        const records = filtered.slice(offset, offset + limit);
        return { records, total };
    }
    async getCallRecordById(callId) {
        const record = this.localState.callRecords.find(r => r.callId === callId);
        return record || null;
    }
    // --- Statistics & Aggregations ---
    async getDashboardStats(startDate, endDate) {
        let records = [...this.localState.callRecords];
        if (startDate)
            records = records.filter(r => r.startedAt >= startDate);
        if (endDate)
            records = records.filter(r => r.startedAt <= endDate);
        const totalCalls = records.length;
        let incomingCalls = 0;
        let outgoingCalls = 0;
        let answeredCalls = 0;
        let missedCalls = 0;
        let totalDurationSeconds = 0;
        let syncFailuresCount = 0;
        const employeeCallMap = new Map();
        for (const r of records) {
            if (r.direction === 'INCOMING')
                incomingCalls++;
            else
                outgoingCalls++;
            if (r.outcome === 'COMPLETED')
                answeredCalls++;
            else if (r.outcome === 'MISSED' || r.outcome === 'UNANSWERED')
                missedCalls++;
            if (r.syncStatus === 'FAILED')
                syncFailuresCount++;
            totalDurationSeconds += r.connectedDurationSeconds;
            const empEntry = employeeCallMap.get(r.employeeId) || {
                callCount: 0,
                durationSeconds: 0,
                name: r.employeeName,
                dept: r.employeeDepartment,
                regPhone: r.registeredPhoneNumber
            };
            empEntry.callCount += 1;
            empEntry.durationSeconds += r.connectedDurationSeconds;
            employeeCallMap.set(r.employeeId, empEntry);
        }
        const averageDurationSeconds = totalCalls > 0 ? Math.round(totalDurationSeconds / totalCalls) : 0;
        const uniqueActiveEmployees = employeeCallMap.size;
        const topEmployees = Array.from(employeeCallMap.entries())
            .map(([empId, data]) => ({
            employeeId: empId,
            employeeName: data.name,
            department: data.dept,
            registeredPhoneNumber: data.regPhone,
            callCount: data.callCount,
            durationSeconds: data.durationSeconds
        }))
            .sort((a, b) => b.callCount - a.callCount)
            .slice(0, 5);
        const recentActivity = [...records]
            .sort((a, b) => b.startedAt - a.startedAt)
            .slice(0, 10);
        return {
            totalCalls,
            incomingCalls,
            outgoingCalls,
            answeredCalls,
            missedCalls,
            totalDurationSeconds,
            averageDurationSeconds,
            uniqueActiveEmployees,
            topEmployees,
            recentActivity: recentActivity,
            syncFailuresCount,
            dateRange: {
                startDate: startDate ? new Date(startDate).toISOString() : 'all-time',
                endDate: endDate ? new Date(endDate).toISOString() : 'now'
            }
        };
    }
    // --- Audit Log Methods ---
    async recordAuditLog(entry) {
        const log = {
            ...entry,
            id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            createdAt: new Date().toISOString()
        };
        this.localState.auditLogs.unshift(log);
        // Keep last 1000 logs
        if (this.localState.auditLogs.length > 1000) {
            this.localState.auditLogs.length = 1000;
        }
        this.persistToFile();
    }
    async getAuditLogs(limit = 100) {
        return this.localState.auditLogs.slice(0, limit);
    }
    clearAllRecords() {
        this.localState.callRecords = [];
        this.persistToFile();
    }
}
exports.DatabaseService = DatabaseService;
exports.dbService = new DatabaseService();
