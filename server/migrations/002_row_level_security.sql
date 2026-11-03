-- Migration 002: Row Level Security (RLS) for Supabase / PostgreSQL
-- Enforces strict separation: Employees access only their records, Admins manage all

-- Enable Row Level Security
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. admin_users policies
CREATE POLICY "Admins can view and manage admin accounts"
    ON admin_users
    FOR ALL
    USING (
        auth.jwt() ->> 'role' IN ('ADMIN', 'SUPER_ADMIN')
    );

-- 2. employees policies
CREATE POLICY "Admins can view and manage all employees"
    ON employees
    FOR ALL
    USING (
        auth.jwt() ->> 'role' IN ('ADMIN', 'SUPER_ADMIN')
    );

CREATE POLICY "Employees can view only their own profile"
    ON employees
    FOR SELECT
    USING (
        auth.jwt() ->> 'employee_id' = id
    );

-- 3. call_records policies
CREATE POLICY "Admins have full visibility into organization call records"
    ON call_records
    FOR SELECT
    USING (
        auth.jwt() ->> 'role' IN ('ADMIN', 'SUPER_ADMIN')
    );

CREATE POLICY "Employees can insert only their own call records"
    ON call_records
    FOR INSERT
    WITH CHECK (
        auth.jwt() ->> 'employee_id' = employee_id
    );

CREATE POLICY "Employees can view only their own call records"
    ON call_records
    FOR SELECT
    USING (
        auth.jwt() ->> 'employee_id' = employee_id
    );

-- 4. audit_logs policies
CREATE POLICY "Only admins can view audit logs"
    ON audit_logs
    FOR SELECT
    USING (
        auth.jwt() ->> 'role' IN ('ADMIN', 'SUPER_ADMIN')
    );

CREATE POLICY "System and authorized services can insert audit events"
    ON audit_logs
    FOR INSERT
    WITH CHECK (true);
