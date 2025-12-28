-- ============================================
-- Migration 005: Create Audit Logs
-- AssurManager - Le Défi IARD
-- Created: 2025-12-28
-- US-004: Journal d'audit (actions sensibles)
-- ============================================

-- Description:
-- Creates audit_logs table for tracking sensitive actions.
-- Implements immutable logs with RLS for tenant isolation.
-- Reference: docs/50_security_compliance/audit_log.md

-- ============================================
-- 1. Create Audit Logs Table
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Action details
    action TEXT NOT NULL,           -- session.create, user.invite, etc.
    resource_type TEXT,             -- session, user, export, etc.
    resource_id UUID,               -- ID of the affected resource
    
    -- Context
    payload JSONB DEFAULT '{}',     -- Additional action data (no PII!)
    ip_address INET,                -- Client IP address
    user_agent TEXT,                -- Client user agent
    
    -- Timestamp (UTC, server-side)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE audit_logs IS 'Immutable audit trail for sensitive actions. Retention: 90 days (future cron job).';
COMMENT ON COLUMN audit_logs.action IS 'Action type: session.create, session.update, session.delete, user.invite, user.role_change, export.pdf, export.data';
COMMENT ON COLUMN audit_logs.payload IS 'Additional context data. MUST NOT contain PII (personally identifiable information).';

-- ============================================
-- 2. Indexes
-- ============================================

-- Primary query: logs by tenant, ordered by date (pagination)
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_created 
    ON audit_logs(tenant_id, created_at DESC);

-- Filter by action type
CREATE INDEX IF NOT EXISTS idx_audit_logs_action 
    ON audit_logs(action);

-- Filter by user
CREATE INDEX IF NOT EXISTS idx_audit_logs_user 
    ON audit_logs(user_id);

-- Filter by resource
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource 
    ON audit_logs(resource_type, resource_id);

-- ============================================
-- 3. Row Level Security (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;

-- Tenant members can only view their own tenant's logs
-- Note: Requires JWT claim 'tenant_id' or lookup via users table
CREATE POLICY "Tenant members can view own logs" ON audit_logs
    FOR SELECT
    USING (
        tenant_id = (
            SELECT tenant_id FROM users WHERE id = auth.uid()
        )
    );

-- No UPDATE policy - logs are immutable
-- No DELETE policy - logs cannot be deleted by users

-- ============================================
-- 4. Permissions
-- ============================================

-- Service role bypasses RLS (for inserting logs)
GRANT ALL ON audit_logs TO service_role;

-- Authenticated users can only SELECT (filtered by RLS)
GRANT SELECT ON audit_logs TO authenticated;

-- ============================================
-- 5. Future: Retention Policy
-- ============================================

-- TODO: Implement 90-day retention via scheduled job
-- CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
-- RETURNS void AS $$
-- BEGIN
--     DELETE FROM audit_logs 
--     WHERE created_at < NOW() - INTERVAL '90 days';
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- End of Migration 005
-- ============================================

-- DOWN (for rollback - run manually if needed):
-- DROP TABLE IF EXISTS audit_logs;
