-- ============================================
-- Migration 004: Create Login Attempts Table
-- AssurManager - Le Défi IARD
-- Created: 2025-12-28
-- US-003: Secure Authentication - Rate Limiting
-- ============================================

-- Description:
-- Creates login_attempts table for rate limiting.
-- AC3: 5 failed attempts in 15 minutes triggers rate limit (429).

-- ============================================
-- 1. Create Login Attempts Table
-- ============================================

CREATE TABLE IF NOT EXISTS login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    ip_address INET NOT NULL,
    success BOOLEAN NOT NULL DEFAULT false,
    user_agent TEXT,
    error_code VARCHAR(50),
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE login_attempts IS 'Tracks login attempts for rate limiting and audit (US-003 AC3)';
COMMENT ON COLUMN login_attempts.success IS 'True if login succeeded, false if failed';
COMMENT ON COLUMN login_attempts.error_code IS 'Error code if failed (e.g., invalid_password, rate_limited)';

-- ============================================
-- 2. Indexes
-- ============================================

-- Fast lookup for rate limiting checks
CREATE INDEX IF NOT EXISTS idx_login_attempts_email_time 
    ON login_attempts(email, attempted_at DESC);

CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_time 
    ON login_attempts(ip_address, attempted_at DESC);

-- Cleanup old records index
CREATE INDEX IF NOT EXISTS idx_login_attempts_attempted_at 
    ON login_attempts(attempted_at);

-- ============================================
-- 3. Rate Limiting Function
-- ============================================

-- Function to check if email/IP is rate limited
-- Returns number of failed attempts in window
CREATE OR REPLACE FUNCTION check_login_rate_limit(
    p_email VARCHAR(255),
    p_ip INET,
    p_window_minutes INTEGER DEFAULT 15,
    p_max_attempts INTEGER DEFAULT 5
)
RETURNS TABLE (
    is_limited BOOLEAN,
    failed_attempts INTEGER,
    remaining_attempts INTEGER,
    reset_at TIMESTAMPTZ
) AS $$
DECLARE
    v_window_start TIMESTAMPTZ;
    v_failed_count INTEGER;
BEGIN
    v_window_start := NOW() - (p_window_minutes * INTERVAL '1 minute');
    
    -- Count failed attempts for this email OR IP in the window
    SELECT COUNT(*) INTO v_failed_count
    FROM login_attempts
    WHERE (email = p_email OR ip_address = p_ip)
      AND success = false
      AND attempted_at > v_window_start;
    
    RETURN QUERY SELECT 
        v_failed_count >= p_max_attempts,
        v_failed_count,
        GREATEST(0, p_max_attempts - v_failed_count),
        v_window_start + (p_window_minutes * INTERVAL '1 minute');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_login_rate_limit IS 'Check if email/IP has exceeded rate limit (US-003 AC3)';

-- ============================================
-- 4. Cleanup Function (for maintenance)
-- ============================================

-- Function to delete old login attempts (keep 30 days for audit)
CREATE OR REPLACE FUNCTION cleanup_old_login_attempts(p_days INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    v_deleted INTEGER;
BEGIN
    DELETE FROM login_attempts
    WHERE attempted_at < NOW() - (p_days * INTERVAL '1 day');
    
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_old_login_attempts IS 'Cleanup login attempts older than N days';

-- ============================================
-- 5. Permissions
-- ============================================

-- Service role has full access
GRANT ALL ON login_attempts TO service_role;

-- Anon can insert (for tracking attempts before auth)
GRANT INSERT ON login_attempts TO anon;

-- ============================================
-- End of Migration 004
-- ============================================

-- DOWN (for rollback - run manually if needed):
-- DROP FUNCTION IF EXISTS cleanup_old_login_attempts;
-- DROP FUNCTION IF EXISTS check_login_rate_limit;
-- DROP TABLE IF EXISTS login_attempts;
