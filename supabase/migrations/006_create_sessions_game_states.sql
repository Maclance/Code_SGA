-- ============================================
-- Migration 006: Create Sessions and Game States
-- AssurManager - Le Défi IARD
-- Created: 2025-12-28
-- US-005: Stocker l'état complet par tour
-- ============================================

-- Description:
-- Creates tables for game session management and turn state storage.
-- Implements append-only game states with JSONB for flexibility.
-- Reference: docs/80_api_data/data_model.md (sessions, game_states)

-- ============================================
-- 1. Create Enums
-- ============================================

-- Session status enum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'session_status') THEN
        CREATE TYPE session_status AS ENUM (
            'draft',    -- Session created but not ready
            'ready',    -- Ready to start
            'running',  -- Game in progress
            'paused',   -- Temporarily paused
            'ended'     -- Game finished
        );
    END IF;
END $$;

-- ============================================
-- 2. Create Sessions Table
-- ============================================

CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Session identification
    code VARCHAR(6) NOT NULL UNIQUE,           -- Join code (e.g., ABC123)
    name VARCHAR(255),                          -- Optional display name
    
    -- Session configuration
    status session_status NOT NULL DEFAULT 'draft',
    config JSONB NOT NULL DEFAULT '{}',         -- speed, difficulty, products, etc.
    engine_version VARCHAR(20) NOT NULL,        -- Engine version for compatibility
    
    -- Game progress
    current_turn INTEGER NOT NULL DEFAULT 0,
    max_turns INTEGER NOT NULL DEFAULT 12,
    
    -- Ownership
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,                     -- When game started
    ended_at TIMESTAMPTZ                        -- When game ended
);

COMMENT ON TABLE sessions IS 'Game sessions for AssurManager. Each session belongs to a tenant.';
COMMENT ON COLUMN sessions.code IS 'Unique 6-character join code (uppercase alphanumeric)';
COMMENT ON COLUMN sessions.config IS 'Session configuration: {speed, difficulty, products[], ...}';
COMMENT ON COLUMN sessions.engine_version IS 'Simulation engine version used for this session';

-- ============================================
-- 3. Create Game States Table
-- ============================================

CREATE TABLE IF NOT EXISTS game_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    
    -- Turn identification
    turn_number INTEGER NOT NULL CHECK (turn_number >= 0),
    
    -- State data (JSONB for flexibility)
    state JSONB NOT NULL,
    
    -- Integrity validation
    checksum VARCHAR(64) NOT NULL,              -- SHA256 hash for corruption detection
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique constraint: one state per turn per session
    UNIQUE(session_id, turn_number)
);

COMMENT ON TABLE game_states IS 'Append-only game state storage per turn. Once created, states cannot be modified.';
COMMENT ON COLUMN game_states.state IS 'Complete TurnState: indices, pnl, decisions, events, portfolio';
COMMENT ON COLUMN game_states.checksum IS 'SHA256 checksum of normalized state JSON for integrity validation';

-- ============================================
-- 4. Indexes
-- ============================================

-- Sessions: lookup by tenant (list sessions)
CREATE INDEX IF NOT EXISTS idx_sessions_tenant 
    ON sessions(tenant_id);

-- Sessions: lookup by code (join session)
CREATE INDEX IF NOT EXISTS idx_sessions_code 
    ON sessions(code);

-- Sessions: filter by status
CREATE INDEX IF NOT EXISTS idx_sessions_status 
    ON sessions(status);

-- Sessions: lookup by creator
CREATE INDEX IF NOT EXISTS idx_sessions_created_by 
    ON sessions(created_by);

-- Game states: lookup by session (load all states)
CREATE INDEX IF NOT EXISTS idx_game_states_session 
    ON game_states(session_id);

-- Game states: lookup specific turn
CREATE INDEX IF NOT EXISTS idx_game_states_session_turn 
    ON game_states(session_id, turn_number);

-- Game states: get latest turn (ORDER BY optimization)
CREATE INDEX IF NOT EXISTS idx_game_states_session_turn_desc 
    ON game_states(session_id, turn_number DESC);

-- ============================================
-- 5. Row Level Security (RLS)
-- ============================================

-- Enable RLS on sessions
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions FORCE ROW LEVEL SECURITY;

-- Enable RLS on game_states
ALTER TABLE game_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_states FORCE ROW LEVEL SECURITY;

-- Sessions: Tenant members can view their own sessions
CREATE POLICY "Tenant members can view own sessions" ON sessions
    FOR SELECT
    USING (
        tenant_id = (
            SELECT tenant_id FROM users WHERE id = auth.uid()
        )
    );

-- Sessions: Trainers/Admins can create sessions in their tenant
CREATE POLICY "Trainers can create sessions" ON sessions
    FOR INSERT
    WITH CHECK (
        tenant_id = (
            SELECT tenant_id FROM users WHERE id = auth.uid()
        )
    );

-- Sessions: Trainers/Admins can update their own sessions
CREATE POLICY "Trainers can update own sessions" ON sessions
    FOR UPDATE
    USING (
        tenant_id = (
            SELECT tenant_id FROM users WHERE id = auth.uid()
        )
    );

-- Game states: Tenant members can view states of their sessions
CREATE POLICY "Tenant members can view game states" ON game_states
    FOR SELECT
    USING (
        session_id IN (
            SELECT s.id FROM sessions s
            JOIN users u ON s.tenant_id = u.tenant_id
            WHERE u.id = auth.uid()
        )
    );

-- Game states: Service role can insert (append-only via service)
-- Note: We restrict updates through application logic, not RLS
CREATE POLICY "Service can insert game states" ON game_states
    FOR INSERT
    WITH CHECK (
        session_id IN (
            SELECT s.id FROM sessions s
            JOIN users u ON s.tenant_id = u.tenant_id
            WHERE u.id = auth.uid()
        )
    );

-- No UPDATE/DELETE policies for game_states (append-only)

-- ============================================
-- 6. Permissions
-- ============================================

-- Service role bypasses RLS (for server-side operations)
GRANT ALL ON sessions TO service_role;
GRANT ALL ON game_states TO service_role;

-- Authenticated users (filtered by RLS)
GRANT SELECT, INSERT, UPDATE ON sessions TO authenticated;
GRANT SELECT, INSERT ON game_states TO authenticated;

-- ============================================
-- 7. Triggers
-- ============================================

-- Auto-update updated_at on sessions
CREATE OR REPLACE FUNCTION update_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sessions_updated_at ON sessions;
CREATE TRIGGER sessions_updated_at
    BEFORE UPDATE ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_sessions_updated_at();

-- ============================================
-- End of Migration 006
-- ============================================

-- DOWN (for rollback - run manually if needed):
-- DROP TRIGGER IF EXISTS sessions_updated_at ON sessions;
-- DROP FUNCTION IF EXISTS update_sessions_updated_at();
-- DROP TABLE IF EXISTS game_states;
-- DROP TABLE IF EXISTS sessions;
-- DROP TYPE IF EXISTS session_status;
