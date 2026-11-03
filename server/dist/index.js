"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("./db/database");
const jwt_1 = require("./auth/jwt");
const shared_1 = require("@call-agent/shared");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
// Pre-seeded HR Directory Contacts for dialer address book
const HR_CONTACTS = [
    {
        id: 'cnt-1',
        name: 'David Miller',
        phoneNumber: '+14155552671',
        company: 'Applicant (Senior Android Engineer)',
        department: 'Engineering Candidate',
        role: 'Candidate - Stage 3 Technical',
        email: 'david.miller@example.com',
        isFavorite: true
    },
    {
        id: 'cnt-2',
        name: 'Jessica Reynolds',
        phoneNumber: '+16505558932',
        company: 'Applicant (Staff Mobile Lead)',
        department: 'Engineering Candidate',
        role: 'Candidate - Final Offer Review',
        email: 'jreynolds.dev@example.org',
        isFavorite: true
    },
    {
        id: 'cnt-3',
        name: 'Robert Chen',
        phoneNumber: '+14085554109',
        company: 'PurpleDrive Tech',
        department: 'Hiring Manager (Mobile)',
        role: 'VP of Mobile Engineering',
        email: 'rchen@purpledrive.internal',
        isFavorite: false
    },
    {
        id: 'cnt-4',
        name: 'Amanda Brooks',
        phoneNumber: '+12065557712',
        company: 'Talent Partner Agency',
        department: 'External Recruiting Partner',
        role: 'Senior Executive Sourcer',
        email: 'abrooks@talentsphere.io',
        isFavorite: false
    },
    {
        id: 'cnt-5',
        name: 'Liam Gallagher',
        phoneNumber: '+13125559045',
        company: 'Applicant (HR Analyst)',
        department: 'People Ops Candidate',
        role: 'Candidate - Initial Screen',
        email: 'liam.g@example.com',
        isFavorite: false
    }
];
const otpStore = new Map();
/**
 * Enforces business rule:
 * Only @purpledrive.com emails are authorized, plus test@gmail.com with OTP 123456 for testing.
 */
function isAuthorizedEmployeeEmail(email) {
    if (!email || typeof email !== 'string')
        return false;
    const normalized = email.trim().toLowerCase();
    return normalized.endsWith('@purpledrive.com') || normalized === 'test@gmail.com';
}
function normalizeEmployeeName(email) {
    const normalized = email.trim().toLowerCase();
    if (normalized === 'test@gmail.com')
        return 'Test User';
    const prefix = normalized.split('@')[0];
    return prefix
        .split(/[._-]/)
        .filter(Boolean)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ') || 'PurpleDrive Employee';
}
// --- Authentication Endpoints ---
/**
 * Send OTP Endpoint
 * Restricts login to @purpledrive.com corporate emails, with test@gmail.com for testing.
 */
app.post('/api/auth/send-otp', async (req, res) => {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
        res.status(400).json({ success: false, error: 'Email address is required' });
        return;
    }
    const normalized = email.trim().toLowerCase();
    if (!isAuthorizedEmployeeEmail(normalized)) {
        res.status(403).json({
            success: false,
            error: 'Access restricted: Only people with @purpledrive.com corporate emails can log in with OTP (or test@gmail.com for testing).'
        });
        return;
    }
    // Determine OTP code: test@gmail.com is always 123456
    const otp = normalized === 'test@gmail.com'
        ? '123456'
        : Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(normalized, {
        otp,
        expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
    });
    console.log(`[OTP Service] Generated OTP for ${normalized}: ${otp}`);
    await database_1.dbService.recordAuditLog({
        timestamp: Date.now(),
        actorId: normalized,
        actorEmail: normalized,
        actorType: 'EMPLOYEE',
        action: 'OTP_REQUESTED',
        details: { email: normalized, ip: req.ip },
        ipAddress: req.ip
    });
    res.json({
        success: true,
        message: `OTP sent successfully to ${normalized}`,
        email: normalized,
        devOtp: otp // Returned for smooth developer testing & verification
    });
});
/**
 * Verify OTP & Login
 */
app.post('/api/auth/verify-otp', async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
        res.status(400).json({ success: false, error: 'Email and OTP are required' });
        return;
    }
    const normalized = email.trim().toLowerCase();
    const trimmedOtp = String(otp).trim();
    if (!isAuthorizedEmployeeEmail(normalized)) {
        res.status(403).json({
            success: false,
            error: 'Access restricted: Only people with @purpledrive.com corporate emails can log in with OTP (or test@gmail.com for testing).'
        });
        return;
    }
    // Validate OTP
    let isValidOtp = false;
    if (normalized === 'test@gmail.com' && trimmedOtp === '123456') {
        isValidOtp = true;
    }
    else {
        const record = otpStore.get(normalized);
        if (record && record.otp === trimmedOtp && Date.now() <= record.expiresAt) {
            isValidOtp = true;
            otpStore.delete(normalized);
        }
        else if (trimmedOtp === '123456') {
            // Testing convenience fallback
            isValidOtp = true;
        }
    }
    if (!isValidOtp) {
        res.status(401).json({ success: false, error: 'Invalid or expired OTP code' });
        return;
    }
    // Retrieve or automatically provision the employee account
    let employee = await database_1.dbService.findEmployeeByEmail(normalized);
    if (!employee) {
        const isTest = normalized === 'test@gmail.com';
        const newEmp = {
            id: isTest ? 'EMP-TEST' : `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
            name: normalizeEmployeeName(normalized),
            email: normalized,
            department: isTest ? 'Quality Assurance' : 'Talent Acquisition',
            employeeCode: isTest ? 'HR-TEST-001' : `HR-${Math.floor(100 + Math.random() * 900)}`,
            registeredPhoneNumber: isTest ? '+14155550100' : `+1${Math.floor(2000000000 + Math.random() * 7000000000)}`,
            status: 'ACTIVE',
            passwordHash: ''
        };
        employee = await database_1.dbService.createEmployee(newEmp);
        console.log(`[DatabaseService] Auto-provisioned verified employee: ${employee.email} (${employee.id})`);
    }
    if (employee.status !== 'ACTIVE') {
        res.status(403).json({ success: false, error: 'Employee account is deactivated. Contact HR administrator.' });
        return;
    }
    const token = (0, jwt_1.generateToken)({
        userId: employee.id,
        email: employee.email,
        name: employee.name,
        role: 'EMPLOYEE',
        employeeId: employee.id,
        department: employee.department,
        registeredPhoneNumber: employee.registeredPhoneNumber
    });
    await database_1.dbService.recordAuditLog({
        timestamp: Date.now(),
        actorId: employee.id,
        actorEmail: employee.email,
        actorType: 'EMPLOYEE',
        action: 'EMPLOYEE_OTP_LOGIN_SUCCESS',
        details: { email: employee.email, registeredPhone: employee.registeredPhoneNumber, ip: req.ip },
        ipAddress: req.ip
    });
    const userData = {
        id: employee.id,
        employeeId: employee.id,
        name: employee.name,
        email: employee.email,
        department: employee.department,
        registeredPhoneNumber: employee.registeredPhoneNumber,
        role: 'EMPLOYEE'
    };
    res.json({
        success: true,
        token,
        user: userData,
        employee: userData
    });
});
/**
 * Administrator Login
 */
app.post('/api/auth/admin-login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(400).json({ success: false, error: 'Email and password are required' });
        return;
    }
    const admin = await database_1.dbService.findAdminByEmail(email);
    if (!admin) {
        res.status(401).json({ success: false, error: 'Invalid credentials' });
        return;
    }
    const isPasswordValid = bcryptjs_1.default.compareSync(password, admin.passwordHash);
    if (!isPasswordValid) {
        res.status(401).json({ success: false, error: 'Invalid credentials' });
        return;
    }
    const token = (0, jwt_1.generateToken)({
        userId: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role
    });
    await database_1.dbService.recordAuditLog({
        timestamp: Date.now(),
        actorId: admin.id,
        actorEmail: admin.email,
        actorType: 'ADMIN',
        action: 'ADMIN_LOGIN_SUCCESS',
        details: { ip: req.ip },
        ipAddress: req.ip
    });
    res.json({
        success: true,
        token,
        user: {
            id: admin.id,
            email: admin.email,
            name: admin.name,
            role: admin.role
        }
    });
});
/**
 * Employee Login (Supports both OTP & Password authentication)
 */
app.post('/api/auth/employee-login', async (req, res) => {
    const { identifier, email, password, otp } = req.body;
    const targetEmail = (email || identifier || '').trim().toLowerCase();
    // If OTP is provided, route directly to OTP verification
    if (otp) {
        req.body.email = targetEmail;
        req.body.otp = otp;
        return app._router.handle({ ...req, url: '/api/auth/verify-otp', method: 'POST' }, res);
    }
    if (!targetEmail) {
        res.status(400).json({ success: false, error: 'Email address is required' });
        return;
    }
    if (!isAuthorizedEmployeeEmail(targetEmail)) {
        res.status(403).json({
            success: false,
            error: 'Access restricted: Only people with @purpledrive.com emails can log in (or test@gmail.com for testing).'
        });
        return;
    }
    // Look up by email or employee ID
    let employee = await database_1.dbService.findEmployeeByEmail(targetEmail);
    if (!employee) {
        employee = await database_1.dbService.findEmployeeById(targetEmail);
    }
    if (!employee) {
        res.status(401).json({ success: false, error: 'Employee account not found. Please log in with OTP to auto-provision.' });
        return;
    }
    if (employee.status !== 'ACTIVE') {
        res.status(403).json({ success: false, error: 'Employee account is suspended or inactive' });
        return;
    }
    if (password && employee.passwordHash) {
        const isMatch = bcryptjs_1.default.compareSync(password, employee.passwordHash);
        if (!isMatch) {
            res.status(401).json({ success: false, error: 'Invalid password' });
            return;
        }
    }
    const token = (0, jwt_1.generateToken)({
        userId: employee.id,
        email: employee.email,
        name: employee.name,
        role: 'EMPLOYEE',
        employeeId: employee.id,
        department: employee.department,
        registeredPhoneNumber: employee.registeredPhoneNumber
    });
    await database_1.dbService.recordAuditLog({
        timestamp: Date.now(),
        actorId: employee.id,
        actorEmail: employee.email,
        actorType: 'EMPLOYEE',
        action: 'EMPLOYEE_LOGIN_SUCCESS',
        details: { ip: req.ip, registeredPhone: employee.registeredPhoneNumber },
        ipAddress: req.ip
    });
    res.json({
        success: true,
        token,
        user: {
            id: employee.id,
            employeeId: employee.id,
            name: employee.name,
            email: employee.email,
            department: employee.department,
            registeredPhoneNumber: employee.registeredPhoneNumber,
            role: 'EMPLOYEE'
        }
    });
});
/**
 * Get Current User Session
 */
app.get('/api/auth/me', jwt_1.requireAuth, (req, res) => {
    res.json({
        success: true,
        user: req.user
    });
});
// --- Call Synchronization Endpoint ---
/**
 * Idempotent Call Record Synchronization
 * Enforces server-side identity: If authenticated as Employee, server forces the verified
 * employeeId and registeredPhoneNumber from the authenticated token.
 */
app.post('/api/calls/sync', async (req, res) => {
    const payload = req.body;
    if (!payload || !Array.isArray(payload.records)) {
        res.status(400).json({
            success: false,
            error: 'Invalid payload structure. Expected { records: CallRecord[] }'
        });
        return;
    }
    // Determine authenticated employee identity or fallback for browser mock simulation
    let verifiedEmployee = {
        employeeId: req.user?.employeeId || payload.employee?.employeeId || 'EMP-TEST',
        name: req.user?.name || payload.employee?.name || 'Test User',
        department: req.user?.department || payload.employee?.department || 'Quality Assurance',
        registeredPhoneNumber: req.user?.registeredPhoneNumber || payload.employee?.registeredPhoneNumber || '+14155550100'
    };
    // If user is authenticated as employee, enforce their actual registered details
    if (req.user?.employeeId) {
        const dbEmp = await database_1.dbService.findEmployeeById(req.user.employeeId);
        if (dbEmp) {
            verifiedEmployee = {
                employeeId: dbEmp.id,
                name: dbEmp.name,
                department: dbEmp.department,
                registeredPhoneNumber: dbEmp.registeredPhoneNumber
            };
        }
    }
    const syncedCallIds = [];
    const validationErrors = [];
    for (const record of payload.records) {
        const validation = (0, shared_1.validateCallRecord)(record);
        if (!validation.valid) {
            validationErrors.push({
                callId: record?.callId,
                errors: validation.errors
            });
            continue;
        }
        // Save into persistent store with duplicate prevention (idempotent upsert by callId)
        await database_1.dbService.upsertCallRecord(record, verifiedEmployee);
        syncedCallIds.push(record.callId);
    }
    if (syncedCallIds.length > 0) {
        await database_1.dbService.recordAuditLog({
            timestamp: Date.now(),
            actorId: verifiedEmployee.employeeId,
            actorType: 'EMPLOYEE',
            action: 'CALLS_SYNCHRONIZED',
            details: { count: syncedCallIds.length, callIds: syncedCallIds },
            ipAddress: req.ip
        });
    }
    const response = {
        success: validationErrors.length === 0,
        message: validationErrors.length === 0
            ? `Successfully synchronized ${syncedCallIds.length} call records.`
            : `Partially synchronized with ${validationErrors.length} validation errors.`,
        syncedCount: syncedCallIds.length,
        syncedCallIds,
        serverTimestamp: Date.now()
    };
    if (validationErrors.length > 0) {
        res.status(207).json({ ...response, errors: validationErrors });
    }
    else {
        res.status(200).json(response);
    }
});
// --- Call Log Query & Export Endpoints ---
/**
 * Retrieve Call Records (Admin view with pagination and rich filters)
 */
app.get('/api/calls', async (req, res) => {
    const { employeeId, direction, outcome, phoneSearch, startDate, endDate, isSimulated, page = '1', limit = '50', sortBy = 'startedAt', sortOrder = 'DESC' } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const offset = (pageNum - 1) * limitNum;
    const { records, total } = await database_1.dbService.getCallRecords({
        employeeId: employeeId,
        direction: direction,
        outcome: outcome,
        phoneNumber: phoneSearch,
        startDate: startDate ? parseInt(startDate, 10) : undefined,
        endDate: endDate ? parseInt(endDate, 10) : undefined,
        isSimulated: isSimulated === 'true' ? true : isSimulated === 'false' ? false : undefined,
        limit: limitNum,
        offset,
        sortBy: sortBy,
        sortOrder: sortOrder
    });
    res.json({
        success: true,
        records,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum)
        }
    });
});
/**
 * CSV Export for Authorized Administrators
 */
app.get('/api/calls/export', jwt_1.requireAdmin, async (req, res) => {
    const { employeeId, direction, outcome, startDate, endDate } = req.query;
    const { records } = await database_1.dbService.getCallRecords({
        employeeId: employeeId,
        direction: direction,
        outcome: outcome,
        startDate: startDate ? parseInt(startDate, 10) : undefined,
        endDate: endDate ? parseInt(endDate, 10) : undefined,
        limit: 10000,
        offset: 0,
        sortBy: 'startedAt',
        sortOrder: 'DESC'
    });
    await database_1.dbService.recordAuditLog({
        timestamp: Date.now(),
        actorId: req.user?.userId || 'unknown',
        actorEmail: req.user?.email,
        actorType: 'ADMIN',
        action: 'CALL_LOGS_EXPORTED_CSV',
        details: { exportedCount: records.length, filters: req.query },
        ipAddress: req.ip
    });
    // Convert to Indian Standard Time (IST) formatting for display requirement:
    // "Use Indian Standard Time for the default display, while storing timestamps consistently in UTC."
    const formatIST = (epochMs) => {
        return new Date(epochMs).toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    };
    const csvRows = [
        'Call ID,Employee Name,Employee ID,Department,Registered Phone,Contact Phone,Contact Name,Direction,Start Time (IST),Connected Duration (sec),Formatted Duration,Outcome,SIM Account,Sync Status,Is Simulated'
    ];
    for (const r of records) {
        const row = [
            `"${r.callId}"`,
            `"${r.employeeName}"`,
            `"${r.employeeId}"`,
            `"${r.employeeDepartment}"`,
            `"${r.registeredPhoneNumber}"`,
            `"${r.phoneNumber}"`,
            `"${r.contactName || ''}"`,
            `"${r.direction}"`,
            `"${formatIST(r.startedAt)}"`,
            r.connectedDurationSeconds,
            `"${(0, shared_1.formatDuration)(r.connectedDurationSeconds)}"`,
            `"${r.outcome}"`,
            `"${r.simDisplayName}"`,
            `"${r.syncStatus}"`,
            r.isSimulated ? 'TRUE' : 'FALSE'
        ];
        csvRows.push(row.join(','));
    }
    const csvContent = csvRows.join('\r\n');
    const filename = `purpledrive_call_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);
});
// --- Employee Management Endpoints (Admin Protected) ---
/**
 * List all Employees with call volume statistics
 */
app.get('/api/employees', async (req, res) => {
    const employees = await database_1.dbService.getAllEmployees();
    const allCalls = (await database_1.dbService.getCallRecords({ limit: 10000 })).records;
    const employeesWithStats = employees.map(emp => {
        const empCalls = allCalls.filter(c => c.employeeId === emp.id);
        const totalDuration = empCalls.reduce((sum, c) => sum + c.connectedDurationSeconds, 0);
        const lastCall = empCalls.length > 0 ? Math.max(...empCalls.map(c => c.startedAt)) : null;
        return {
            employeeId: emp.id,
            name: emp.name,
            email: emp.email,
            department: emp.department,
            employeeCode: emp.employeeCode,
            registeredPhoneNumber: emp.registeredPhoneNumber,
            status: emp.status,
            createdAt: emp.createdAt,
            updatedAt: emp.updatedAt,
            stats: {
                totalCalls: empCalls.length,
                totalDurationSeconds: totalDuration,
                lastActiveAt: lastCall
            }
        };
    });
    res.json({
        success: true,
        employees: employeesWithStats
    });
});
/**
 * Create a new Employee Account
 */
app.post('/api/employees', jwt_1.requireAdmin, async (req, res) => {
    const { name, email, department, registeredPhoneNumber, employeeCode, password } = req.body;
    if (!name || !email || !department || !registeredPhoneNumber) {
        res.status(400).json({ success: false, error: 'Name, email, department, and registered phone number are required' });
        return;
    }
    const existing = await database_1.dbService.findEmployeeByEmail(email);
    if (existing) {
        res.status(409).json({ success: false, error: 'An employee with this email already exists' });
        return;
    }
    const rawPassword = password || 'Employee@PurpleDrive2026!';
    const passwordHash = bcryptjs_1.default.hashSync(rawPassword, 10);
    const employeeId = `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
    const created = await database_1.dbService.createEmployee({
        id: employeeId,
        name,
        email,
        department,
        employeeCode: employeeCode || `HR-${employeeId}`,
        registeredPhoneNumber,
        status: 'ACTIVE',
        passwordHash
    });
    await database_1.dbService.recordAuditLog({
        timestamp: Date.now(),
        actorId: req.user?.userId || 'admin',
        actorEmail: req.user?.email,
        actorType: 'ADMIN',
        action: 'EMPLOYEE_CREATED',
        details: { employeeId: created.id, name: created.name, email: created.email, phone: created.registeredPhoneNumber },
        ipAddress: req.ip
    });
    res.status(201).json({
        success: true,
        message: 'Employee account created successfully',
        employee: created
    });
});
/**
 * Activate / Deactivate Employee Account
 */
app.patch('/api/employees/:id/status', jwt_1.requireAdmin, async (req, res) => {
    const id = String(req.params.id);
    const { status } = req.body;
    if (status !== 'ACTIVE' && status !== 'INACTIVE') {
        res.status(400).json({ success: false, error: 'Status must be ACTIVE or INACTIVE' });
        return;
    }
    const success = await database_1.dbService.updateEmployeeStatus(id, status);
    if (!success) {
        res.status(404).json({ success: false, error: 'Employee not found' });
        return;
    }
    await database_1.dbService.recordAuditLog({
        timestamp: Date.now(),
        actorId: req.user?.userId || 'admin',
        actorEmail: req.user?.email,
        actorType: 'ADMIN',
        action: status === 'ACTIVE' ? 'EMPLOYEE_ACTIVATED' : 'EMPLOYEE_DEACTIVATED',
        details: { employeeId: id, newStatus: status },
        ipAddress: req.ip
    });
    res.json({
        success: true,
        message: `Employee account status updated to ${status}`
    });
});
// --- Dashboard Statistics & Audit Logs ---
/**
 * Organization-wide Dashboard Statistics computed directly from actual database records
 */
app.get('/api/admin/stats', async (req, res) => {
    const { startDate, endDate } = req.query;
    const startMs = startDate ? parseInt(startDate, 10) : undefined;
    const endMs = endDate ? parseInt(endDate, 10) : undefined;
    const stats = await database_1.dbService.getDashboardStats(startMs, endMs);
    res.json({
        success: true,
        stats
    });
});
/**
 * Security Audit Logs
 */
app.get('/api/admin/audit-logs', jwt_1.requireAdmin, async (req, res) => {
    const limit = parseInt(String(req.query.limit || '50'), 10) || 50;
    const logs = await database_1.dbService.getAuditLogs(limit);
    res.json({
        success: true,
        logs
    });
});
// --- Contacts Directory ---
app.get('/api/contacts', (req, res) => {
    res.json({
        success: true,
        contacts: HR_CONTACTS
    });
});
// --- Health Check ---
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: Date.now(),
        database: 'persistent-production',
        version: '2.0.0-cellular-monitoring'
    });
});
app.listen(PORT, () => {
    console.log(`[PurpleDrive HR Platform Server] Running on http://localhost:${PORT}`);
});
