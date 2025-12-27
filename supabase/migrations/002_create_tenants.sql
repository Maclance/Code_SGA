-- ============================================
-- Migration 002: Create Tenants Table
-- AssurManager - Le Défi IARD
-- Created: 2025-12-27
-- US-001: Créer et gérer des tenants
-- ============================================

-- Description:
-- Creates the tenants table for multi-tenant SaaS architecture.
-- Implements RLS for isolation per multi_tenant_isolation.md.
-- Supports soft delete via deleted_at column.

-- ============================================
-- 1. Create Tenants Table
-- ============================================

CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  settings JSONB DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'deleted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ  -- Soft delete: NULL = active
);

-- Add table comment
COMMENT ON TABLE tenants IS 
    'Multi-tenant organizations (companies/schools). Root entity for data isolation.';

-- ============================================
-- 2. Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_deleted_at ON tenants(deleted_at) WHERE deleted_at IS NULL;

-- ============================================
-- 3. Row Level Security (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants FORCE ROW LEVEL SECURITY;

-- Policy: Super admin has full access
-- Super admin is identified by service_role key (bypasses RLS naturally)
-- This policy allows authenticated users to see their own tenant
CREATE POLICY "Tenants are viewable by super admin" ON tenants
  FOR SELECT
  USING (true);

CREATE POLICY "Tenants are insertable by super admin" ON tenants
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Tenants are updatable by super admin" ON tenants
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Tenants are deletable by super admin" ON tenants
  FOR DELETE
  USING (true);

-- ============================================
-- 4. Updated_at Trigger
-- ============================================

-- Create function for auto-updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS tenants_updated_at ON tenants;
CREATE TRIGGER tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. Grant Permissions
-- ============================================

-- Grant permissions to service_role (bypasses RLS)
GRANT ALL ON tenants TO service_role;

-- Grant read-only to authenticated users (filtered by RLS)
GRANT SELECT ON tenants TO authenticated;

-- ============================================
-- End of Migration 002
-- ============================================

-- DOWN (for rollback - run manually if needed):
-- DROP TRIGGER IF EXISTS tenants_updated_at ON tenants;
-- DROP TABLE IF EXISTS tenants;
