-- ============================================
-- Migration 007: Create Session Participants
-- AssurManager - Le Défi IARD
-- Created: 2025-12-30
-- US-012: Rejoindre une session via code
-- ============================================

-- Description:
-- Creates session_participants table to track which users have joined which sessions.
-- Adds max_participants column to sessions table for capacity management.
-- Reference: docs/80_api_data/data_model.md (participants)

-- ============================================
-- 1. Add max_participants to sessions
-- ============================================

ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS max_participants INTEGER NOT NULL DEFAULT 50;

COMMENT ON COLUMN sessions.max_participants IS 'Maximum number of participants allowed in this session';

-- ============================================
-- 2. Create Session Participants Table
-- ============================================

CREATE TABLE IF NOT EXISTS session_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Role within the session
    role VARCHAR(20) NOT NULL DEFAULT 'player',  -- player, observer
    
    -- Timestamps
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique constraint: one user can only join a session once
    UNIQUE(session_id, user_id)
);

COMMENT ON TABLE session_participants IS 'Tracks users who have joined game sessions (US-012)';
COMMENT ON COLUMN session_participants.role IS 'Role in session: player or observer';

-- ============================================
-- 3. Indexes
-- ============================================

-- Lookup participants by session
CREATE INDEX IF NOT EXISTS idx_session_participants_session 
    ON session_participants(session_id);

-- Lookup sessions by user
CREATE INDEX IF NOT EXISTS idx_session_participants_user 
    ON session_participants(user_id);

-- Count participants per session efficiently
CREATE INDEX IF NOT EXISTS idx_session_participants_count 
    ON session_participants(session_id, id);

-- ============================================
-- 4. Row Level Security (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_participants FORCE ROW LEVEL SECURITY;

-- Users can view participants of sessions they are in or belong to their tenant
CREATE POLICY "Users can view session participants" ON session_participants
    FOR SELECT
    USING (
        -- User is a participant themselves
        user_id = auth.uid()
        OR
        -- User belongs to same tenant as session
        session_id IN (
            SELECT s.id FROM sessions s
            JOIN users u ON s.tenant_id = u.tenant_id
            WHERE u.id = auth.uid()
        )
    );

-- Users can join sessions (insert themselves as participant)
CREATE POLICY "Users can join sessions" ON session_participants
    FOR INSERT
    WITH CHECK (
        -- Can only insert own user_id
        user_id = auth.uid()
    );

-- Users can leave sessions (delete their own participation)
CREATE POLICY "Users can leave sessions" ON session_participants
    FOR DELETE
    USING (
        user_id = auth.uid()
    );

-- ============================================
-- 5. Permissions
-- ============================================

-- Service role bypasses RLS (for server-side operations)
GRANT ALL ON session_participants TO service_role;

-- Authenticated users (filtered by RLS)
GRANT SELECT, INSERT, DELETE ON session_participants TO authenticated;

-- ============================================
-- End of Migration 007
-- ============================================

-- DOWN (for rollback - run manually if needed):
-- DROP TABLE IF EXISTS session_participants;
-- ALTER TABLE sessions DROP COLUMN IF EXISTS max_participants;
