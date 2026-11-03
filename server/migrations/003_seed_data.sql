-- Migration 003: Initial Seed Data for Administrator & Demo HR Team

-- Provision Primary Administrator
-- Credentials: admin@purpledrive.internal / Admin@PurpleDrive2026!
INSERT INTO admin_users (id, name, email, role, password_hash)
VALUES (
    'admin-root-01',
    'Executive Administrator',
    'admin@purpledrive.internal',
    'SUPER_ADMIN',
    '$2b$10$jZNBtfB/D6Fj3TkIDNsaS.4DjJK0IcV5Lq8pThz5X8EC2djtFP3GO'
) ON CONFLICT (email) DO NOTHING;

-- Provision Default HR Employees with Registered Cellular Numbers
-- Password for all demo employees: Employee@PurpleDrive2026!
INSERT INTO employees (id, name, email, department, employee_code, registered_phone_number, status, password_hash)
VALUES 
(
    'EMP-1042',
    'Sarah Jenkins',
    'sarah.jenkins@purpledrive.internal',
    'Technical Talent Acquisition',
    'TA-SJ-1042',
    '+14155550100',
    'ACTIVE',
    '$2b$10$v09duzImWI/HkBCx4gY5CeaHN6FCZyxZfF1POWY6TiPtPtCTeBf5C'
),
(
    'EMP-2089',
    'Marcus Vance',
    'marcus.vance@purpledrive.internal',
    'People Operations',
    'PO-MV-2089',
    '+14155550101',
    'ACTIVE',
    '$2b$10$v09duzImWI/HkBCx4gY5CeaHN6FCZyxZfF1POWY6TiPtPtCTeBf5C'
),
(
    'EMP-3011',
    'Elena Rostova',
    'elena.rostova@purpledrive.internal',
    'Executive Recruiting',
    'ER-ER-3011',
    '+14155550102',
    'ACTIVE',
    '$2b$10$v09duzImWI/HkBCx4gY5CeaHN6FCZyxZfF1POWY6TiPtPtCTeBf5C'
) ON CONFLICT (email) DO NOTHING;

-- Initial System Audit Log Entry
INSERT INTO audit_logs (id, timestamp, actor_id, actor_email, actor_type, action, details)
VALUES (
    'audit-init-01',
    EXTRACT(EPOCH FROM CURRENT_TIMESTAMP) * 1000,
    'admin-root-01',
    'admin@purpledrive.internal',
    'SYSTEM',
    'SYSTEM_INITIALIZED',
    '{"message": "Database schema and initial admin provisioned"}'
);
