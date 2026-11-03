-- Migration 001: Initial Schema for PurpleDrive HR Cellular Dialer & Monitoring Platform
-- Compatible with PostgreSQL 13+ and Supabase

CREATE TABLE IF NOT EXISTS admin_users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'ADMIN' CHECK (role IN ('ADMIN', 'SUPER_ADMIN')),
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employees (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    department VARCHAR(255) NOT NULL,
    employee_code VARCHAR(64) NOT NULL,
    registered_phone_number VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS devices (
    id VARCHAR(64) PRIMARY KEY,
    employee_id VARCHAR(64) NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    device_model VARCHAR(255),
    os_version VARCHAR(64),
    app_version VARCHAR(64),
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS call_records (
    call_id VARCHAR(64) PRIMARY KEY,
    employee_id VARCHAR(64) NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    employee_name VARCHAR(255) NOT NULL,
    employee_department VARCHAR(255) NOT NULL,
    registered_phone_number VARCHAR(32) NOT NULL,
    phone_number VARCHAR(64) NOT NULL,
    contact_name VARCHAR(255),
    direction VARCHAR(16) NOT NULL CHECK (direction IN ('OUTGOING', 'INCOMING')),
    started_at BIGINT NOT NULL,
    connected_at BIGINT,
    ended_at BIGINT NOT NULL,
    connected_duration_seconds BIGINT NOT NULL DEFAULT 0,
    outcome VARCHAR(32) NOT NULL CHECK (outcome IN ('COMPLETED', 'MISSED', 'REJECTED', 'UNANSWERED', 'BUSY', 'FAILED', 'INTERRUPTED')),
    sim_slot_index INTEGER NOT NULL DEFAULT 0,
    sim_display_name VARCHAR(255) NOT NULL,
    sync_status VARCHAR(32) NOT NULL DEFAULT 'SYNCED' CHECK (sync_status IN ('PENDING', 'SYNCED', 'FAILED')),
    sync_attempts INTEGER NOT NULL DEFAULT 1,
    last_sync_attempt_at BIGINT,
    sync_error_message TEXT,
    is_simulated BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    device_info JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    timestamp BIGINT NOT NULL,
    actor_id VARCHAR(64) NOT NULL,
    actor_email VARCHAR(255),
    actor_type VARCHAR(32) NOT NULL CHECK (actor_type IN ('ADMIN', 'EMPLOYEE', 'SYSTEM')),
    action VARCHAR(64) NOT NULL,
    details JSONB,
    ip_address VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast querying, filtering, and reporting
CREATE INDEX IF NOT EXISTS idx_call_records_employee_started ON call_records (employee_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_records_started_at ON call_records (started_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_records_phone_number ON call_records (phone_number);
CREATE INDEX IF NOT EXISTS idx_call_records_outcome ON call_records (outcome);
CREATE INDEX IF NOT EXISTS idx_call_records_direction ON call_records (direction);
CREATE INDEX IF NOT EXISTS idx_call_records_simulated ON call_records (is_simulated);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees (status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs (timestamp DESC);
