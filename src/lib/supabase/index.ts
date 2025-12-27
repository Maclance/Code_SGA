/**
 * Supabase clients re-export
 * Single entry point for all Supabase client imports
 * 
 * Usage:
 *   import { createClient } from '@/lib/supabase'           // Browser
 *   import { createClient } from '@/lib/supabase/server'    // Server
 * 
 * @module lib/supabase
 */

// Re-export browser client as default
export { createClient } from './client';

// Named exports for explicit imports
export { createClient as createBrowserClient } from './client';
export { createClient as createServerClient } from './server';
