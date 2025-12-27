-- ============================================
-- Migration 003: Create Users, Roles, Invitations
-- AssurManager - Le Défi IARD
-- Created: 2025-12-27
-- US-002: Inviter utilisateurs et attribuer rôles
-- ============================================

-- Description:
-- Creates user management tables for multi-tenant RBAC.
-- Implements invitation system with 48h expiration.
-- RLS policies for tenant isolation per auth_rbac.md.

-- ============================================
-- 1. Create user_role Enum
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM (
            'admin_tenant',
            'formateur',
            'joueur',
            'observateur'
        );
    END IF;
END$$;

COMMENT ON TYPE user_role IS 'MVP user roles: admin_tenant, formateur, joueur, observateur';

-- ============================================
-- 2. Create Users Table
-- ============================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'joueur',
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'active', 'suspended')),
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(tenant_id, email)
);

COMMENT ON TABLE users IS 'Application users linked to auth.users. Scoped by tenant_id for isolation.';
COMMENT ON COLUMN users.role IS 'User role for RBAC. MVP: admin_tenant, formateur, joueur, observateur';
COMMENT ON COLUMN users.status IS 'pending = invited but not activated, active = can use app, suspended = blocked';

-- ============================================
-- 3. Create Invitations Table
-- ============================================

CREATE TABLE IF NOT EXISTS invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'joueur',
    token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '48 hours'),
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(tenant_id, email)
);

COMMENT ON TABLE invitations IS 'Pending invitations for new users. Expires after 48h.';
COMMENT ON COLUMN invitations.token IS 'Secret token sent via email. Used for activation link.';
COMMENT ON COLUMN invitations.expires_at IS 'Invitation expires 48h after creation (AC2).';

-- ============================================
-- 4. Indexes
-- ============================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Invitations indexes
CREATE INDEX IF NOT EXISTS idx_invitations_tenant_id ON invitations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_expires_at ON invitations(expires_at) 
    WHERE accepted_at IS NULL;

-- ============================================
-- 5. Triggers
-- ============================================

-- Users updated_at trigger
DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. Row Level Security (RLS)
-- ============================================

-- Enable RLS on users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;

-- Enable RLS on invitations
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations FORCE ROW LEVEL SECURITY;

-- ============================================
-- 6.1 Users RLS Policies
-- ============================================

-- Users can view other users in the same tenant
CREATE POLICY "Users are viewable by tenant members" ON users
    FOR SELECT
    USING (
        tenant_id = (
            SELECT tenant_id FROM users WHERE id = auth.uid()
        )
    );

-- Admin tenant can create users in their tenant
CREATE POLICY "Users are insertable by admin_tenant" ON users
    FOR INSERT
    WITH CHECK (
        tenant_id = (
            SELECT tenant_id FROM users WHERE id = auth.uid()
        )
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin_tenant'
        )
    );

-- Admin tenant can update users in their tenant
CREATE POLICY "Users are updatable by admin_tenant" ON users
    FOR UPDATE
    USING (
        tenant_id = (
            SELECT tenant_id FROM users WHERE id = auth.uid()
        )
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin_tenant'
        )
    )
    WITH CHECK (
        tenant_id = (
            SELECT tenant_id FROM users WHERE id = auth.uid()
        )
    );

-- Users can update their own profile (name, avatar)
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (
        id = auth.uid()
        -- Cannot change own role or tenant_id
        AND role = (SELECT role FROM users WHERE id = auth.uid())
        AND tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    );

-- ============================================
-- 6.2 Invitations RLS Policies
-- ============================================

-- Admin tenant can view invitations in their tenant
CREATE POLICY "Invitations are viewable by admin_tenant" ON invitations
    FOR SELECT
    USING (
        tenant_id = (
            SELECT tenant_id FROM users WHERE id = auth.uid()
        )
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin_tenant'
        )
    );

-- Admin tenant can create invitations in their tenant
CREATE POLICY "Invitations are insertable by admin_tenant" ON invitations
    FOR INSERT
    WITH CHECK (
        tenant_id = (
            SELECT tenant_id FROM users WHERE id = auth.uid()
        )
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin_tenant'
        )
    );

-- Admin tenant can delete invitations in their tenant
CREATE POLICY "Invitations are deletable by admin_tenant" ON invitations
    FOR DELETE
    USING (
        tenant_id = (
            SELECT tenant_id FROM users WHERE id = auth.uid()
        )
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin_tenant'
        )
    );

-- Invitations can be read by token (for activation page - via service_role)
-- Note: Activation endpoint uses service_role key to bypass RLS

-- ============================================
-- 7. Grant Permissions
-- ============================================

-- Service role bypasses RLS
GRANT ALL ON users TO service_role;
GRANT ALL ON invitations TO service_role;

-- Authenticated users (filtered by RLS)
GRANT SELECT, UPDATE ON users TO authenticated;
GRANT SELECT, INSERT, DELETE ON invitations TO authenticated;

-- ============================================
-- 8. Helper Functions
-- ============================================

-- Function to check if an invitation is valid (not expired, not accepted)
CREATE OR REPLACE FUNCTION is_invitation_valid(invitation_token UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM invitations
        WHERE token = invitation_token
        AND expires_at > NOW()
        AND accepted_at IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_invitation_valid IS 'Check if invitation token is valid (not expired, not used)';

-- ============================================
-- End of Migration 003
-- ============================================

-- DOWN (for rollback - run manually if needed):
-- DROP FUNCTION IF EXISTS is_invitation_valid;
-- DROP TABLE IF EXISTS invitations;
-- DROP TABLE IF EXISTS users;
-- DROP TYPE IF EXISTS user_role;
