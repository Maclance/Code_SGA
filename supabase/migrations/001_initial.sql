-- ============================================
-- Migration 001: Initial Schema
-- AssurManager - Le Défi IARD
-- Created: 2025-12-27
-- ============================================

-- Description:
-- Creates minimal infrastructure for healthcheck validation.
-- This function allows the /api/health endpoint to verify
-- database connectivity by executing SELECT 1.

-- ============================================
-- 1. Healthcheck RPC Function
-- ============================================

-- Create a simple RPC function that returns 1
-- Used by /api/health to validate AC1: SELECT 1 returns 1
CREATE OR REPLACE FUNCTION public.select_one()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT 1;
$$;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.select_one() TO anon;
GRANT EXECUTE ON FUNCTION public.select_one() TO authenticated;

-- Add function comment for documentation
COMMENT ON FUNCTION public.select_one() IS 
    'Healthcheck function - returns 1 to validate database connectivity. Used by /api/health endpoint.';

-- ============================================
-- End of Migration 001
-- ============================================
