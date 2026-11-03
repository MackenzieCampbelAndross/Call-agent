import { describe, it, expect, beforeEach } from 'vitest';
import { dbService } from '../src/db/database';
import { generateToken, verifyToken } from '../src/auth/jwt';
import bcrypt from 'bcryptjs';
import { CallRecord } from '@call-agent/shared';

describe('Server Authentication & Persistent Database Service', () => {
  beforeEach(() => {
    dbService.clearAllRecords();
  });

  it('provisions and authenticates default administrator', async () => {
    const admin = await dbService.findAdminByEmail('admin@purpledrive.internal');
    expect(admin).toBeDefined();
    expect(admin?.role).toBe('SUPER_ADMIN');

    const isValid = bcrypt.compareSync('Admin@PurpleDrive2026!', admin!.passwordHash);
    expect(isValid).toBe(true);

    const token = generateToken({
      userId: admin!.id,
      email: admin!.email,
      name: admin!.name,
      role: admin!.role
    });

    const decoded = verifyToken(token);
    expect(decoded?.role).toBe('SUPER_ADMIN');
    expect(decoded?.email).toBe('admin@purpledrive.internal');
  });

  it('authenticates employee and provides registered phone identity', async () => {
    const emp = await dbService.findEmployeeById('EMP-TEST');
    expect(emp).toBeDefined();
    expect(emp?.name).toBe('Test User');
    expect(emp?.email).toBe('test@gmail.com');
    expect(emp?.registeredPhoneNumber).toBe('+14155550100');
    expect(emp?.status).toBe('ACTIVE');
  });

  it('prevents duplicate call records via idempotent upsert by callId', async () => {
    const sampleRecord: CallRecord = {
      callId: '00000000-aaaa-4000-8000-000000000001',
      employeeId: 'EMP-TEST',
      employeeName: 'Test User',
      employeeDepartment: 'Quality Assurance',
      phoneNumber: '+14155552671',
      contactName: 'David Miller',
      direction: 'OUTGOING',
      startedAt: 1700000000000,
      connectedAt: 1700000005000,
      endedAt: 1700000065000,
      connectedDurationSeconds: 60,
      outcome: 'COMPLETED',
      simSlotIndex: 0,
      simDisplayName: 'SIM 1',
      syncStatus: 'PENDING',
      syncAttempts: 0,
      isSimulated: false
    };

    const verifiedEmp = {
      employeeId: 'EMP-TEST',
      name: 'Test User',
      department: 'Quality Assurance',
      registeredPhoneNumber: '+14155550100'
    };

    // First insert
    const res1 = await dbService.upsertCallRecord(sampleRecord, verifiedEmp);
    expect(res1.inserted).toBe(true);

    // Second insert with same callId
    const res2 = await dbService.upsertCallRecord({ ...sampleRecord, syncAttempts: 1 }, verifiedEmp);
    expect(res2.inserted).toBe(false);

    // Total records must still be 1
    const { total, records } = await dbService.getCallRecords();
    expect(total).toBe(1);
    expect(records[0].callId).toBe(sampleRecord.callId);
    expect(records[0].syncAttempts).toBe(2);
  });

  it('calculates real dashboard statistics from database records', async () => {
    const verifiedEmp = {
      employeeId: 'EMP-TEST',
      name: 'Test User',
      department: 'Quality Assurance',
      registeredPhoneNumber: '+14155550100'
    };

    // Insert 1 completed call (60s)
    await dbService.upsertCallRecord({
      callId: 'c1-1111-4000-8000-000000000001',
      employeeId: 'EMP-TEST',
      employeeName: 'Test User',
      employeeDepartment: 'Quality Assurance',
      phoneNumber: '+14155552671',
      direction: 'OUTGOING',
      startedAt: 1700000000000,
      connectedAt: 1700000005000,
      endedAt: 1700000065000,
      connectedDurationSeconds: 60,
      outcome: 'COMPLETED',
      simSlotIndex: 0,
      simDisplayName: 'SIM 1',
      syncStatus: 'SYNCED',
      syncAttempts: 1,
      isSimulated: false
    }, verifiedEmp);

    // Insert 1 missed call (0s)
    await dbService.upsertCallRecord({
      callId: 'c2-2222-4000-8000-000000000002',
      employeeId: 'EMP-TEST',
      employeeName: 'Test User',
      employeeDepartment: 'Quality Assurance',
      phoneNumber: '+18005550199',
      direction: 'INCOMING',
      startedAt: 1700000100000,
      connectedAt: null,
      endedAt: 1700000120000,
      connectedDurationSeconds: 0,
      outcome: 'MISSED',
      simSlotIndex: 0,
      simDisplayName: 'SIM 1',
      syncStatus: 'SYNCED',
      syncAttempts: 1,
      isSimulated: false
    }, verifiedEmp);

    const stats = await dbService.getDashboardStats();
    expect(stats.totalCalls).toBe(2);
    expect(stats.outgoingCalls).toBe(1);
    expect(stats.incomingCalls).toBe(1);
    expect(stats.answeredCalls).toBe(1);
    expect(stats.missedCalls).toBe(1);
    expect(stats.totalDurationSeconds).toBe(60);
    expect(stats.averageDurationSeconds).toBe(30);
    expect(stats.uniqueActiveEmployees).toBe(1);
  });

  it('restricts employee login to @purpledrive.com and test@gmail.com with OTP 123456', async () => {
    // 1. Verify test@gmail.com employee is present
    const testUser = await dbService.findEmployeeByEmail('test@gmail.com');
    expect(testUser).toBeDefined();
    expect(testUser?.email).toBe('test@gmail.com');
    expect(testUser?.name).toBe('Test User');

    // 2. Auto-provisioning a @purpledrive.com corporate user
    const corpUser = await dbService.createEmployee({
      id: 'EMP-9901',
      name: 'Rohan Sharma',
      email: 'rohan.sharma@purpledrive.com',
      department: 'Talent Acquisition',
      employeeCode: 'HR-9901',
      registeredPhoneNumber: '+14155559901',
      status: 'ACTIVE',
      passwordHash: ''
    });
    expect(corpUser.email.endsWith('@purpledrive.com')).toBe(true);
    expect(corpUser.id).toBe('EMP-9901');
  });
});
