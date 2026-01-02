/**
 * Tenant Service
 * 
 * @module lib/services/tenant.service
 * @description Business logic for tenant management (US-001)
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import {
    type Tenant,
    type CreateTenantInput,
    type UpdateTenantInput,
    type TenantResponse,
    CreateTenantSchema,
    UpdateTenantSchema,
} from '@/types/tenant';

// ============================================
// Error Classes
// ============================================

export class TenantError extends Error {
    constructor(
        message: string,
        public code: string,
        public statusCode: number = 500
    ) {
        super(message);
        this.name = 'TenantError';
    }
}

export class TenantNotFoundError extends TenantError {
    constructor(identifier: string) {
        super(`Tenant not found: ${identifier}`, 'TENANT_NOT_FOUND', 404);
    }
}

export class TenantSlugConflictError extends TenantError {
    constructor(slug: string) {
        super(`Tenant with slug "${slug}" already exists`, 'TENANT_SLUG_CONFLICT', 409);
    }
}

export class TenantValidationError extends TenantError {
    constructor(message: string) {
        super(message, 'TENANT_VALIDATION_ERROR', 400);
    }
}

// ============================================
// Service Functions
// ============================================

/**
 * Creates a new tenant
 * 
 * @param supabase - Supabase client (service role for admin operations)
 * @param input - Validated tenant creation input
 * @returns Created tenant with UUID
 * @throws {TenantSlugConflictError} If slug already exists
 * @throws {TenantValidationError} If input validation fails
 */
export async function createTenant(
    supabase: SupabaseClient,
    input: CreateTenantInput
): Promise<Tenant> {
    // Validate input
    const validation = CreateTenantSchema.safeParse(input);
    if (!validation.success) {
        throw new TenantValidationError(
            validation.error.issues.map((e: { message: string }) => e.message).join(', ')
        );
    }

    const { name, slug, settings = {} } = validation.data;

    // Check for duplicate slug
    const { data: existing } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', slug)
        .single();

    if (existing) {
        throw new TenantSlugConflictError(slug);
    }

    // Insert new tenant
    const { data, error } = await supabase
        .from('tenants')
        .insert({
            name,
            slug,
            settings,
            status: 'active',
        })
        .select()
        .single();

    if (error) {
        // Handle unique constraint violation (race condition)
        if (error.code === '23505') {
            throw new TenantSlugConflictError(slug);
        }
        throw new TenantError(`Failed to create tenant: ${error.message}`, 'DB_ERROR');
    }

    return data as Tenant;
}

/**
 * Gets all active tenants
 * 
 * @param supabase - Supabase client
 * @returns List of active tenants (not deleted)
 */
export async function getTenants(
    supabase: SupabaseClient
): Promise<Tenant[]> {
    const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

    if (error) {
        throw new TenantError(`Failed to fetch tenants: ${error.message}`, 'DB_ERROR');
    }

    return (data ?? []) as Tenant[];
}

/**
 * Gets a tenant by ID
 * 
 * @param supabase - Supabase client
 * @param id - Tenant UUID
 * @returns Tenant if found
 * @throws {TenantNotFoundError} If tenant doesn't exist
 */
export async function getTenantById(
    supabase: SupabaseClient,
    id: string
): Promise<Tenant> {
    const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .single();

    if (error || !data) {
        throw new TenantNotFoundError(id);
    }

    return data as Tenant;
}

/**
 * Gets a tenant by slug
 * 
 * @param supabase - Supabase client
 * @param slug - Tenant slug
 * @returns Tenant if found
 * @throws {TenantNotFoundError} If tenant doesn't exist
 */
export async function getTenantBySlug(
    supabase: SupabaseClient,
    slug: string
): Promise<Tenant> {
    const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('slug', slug)
        .is('deleted_at', null)
        .single();

    if (error || !data) {
        throw new TenantNotFoundError(slug);
    }

    return data as Tenant;
}

/**
 * Updates a tenant
 * 
 * @param supabase - Supabase client
 * @param id - Tenant UUID
 * @param input - Partial update data
 * @returns Updated tenant
 * @throws {TenantNotFoundError} If tenant doesn't exist
 * @throws {TenantValidationError} If input validation fails
 */
export async function updateTenant(
    supabase: SupabaseClient,
    id: string,
    input: UpdateTenantInput
): Promise<Tenant> {
    // Validate input
    const validation = UpdateTenantSchema.safeParse(input);
    if (!validation.success) {
        throw new TenantValidationError(
            validation.error.issues.map((e: { message: string }) => e.message).join(', ')
        );
    }

    // Check tenant exists
    await getTenantById(supabase, id);

    // Update tenant
    const { data, error } = await supabase
        .from('tenants')
        .update(validation.data)
        .eq('id', id)
        .is('deleted_at', null)
        .select()
        .single();

    if (error) {
        throw new TenantError(`Failed to update tenant: ${error.message}`, 'DB_ERROR');
    }

    return data as Tenant;
}

/**
 * Soft deletes a tenant
 * Sets deleted_at timestamp instead of physical deletion.
 * 
 * @param supabase - Supabase client
 * @param id - Tenant UUID
 * @returns Response with tenant and optional warning
 * @throws {TenantNotFoundError} If tenant doesn't exist
 */
export async function deleteTenant(
    supabase: SupabaseClient,
    id: string
): Promise<TenantResponse> {
    // Check tenant exists (throws if not found)
    await getTenantById(supabase, id); let warning: string | undefined;

    // Check for active sessions (future: when game_sessions table exists)
    // For now, we'll add this check when the sessions are implemented
    // const { count } = await supabase
    //     .from('game_sessions')
    //     .select('*', { count: 'exact', head: true })
    //     .eq('tenant_id', id)
    //     .in('status', ['draft', 'ready', 'running', 'paused']);
    // 
    // if (count && count > 0) {
    //     warning = `Tenant has ${count} active session(s). They will become inaccessible.`;
    // }

    // Soft delete: set deleted_at and status
    const { data, error } = await supabase
        .from('tenants')
        .update({
            deleted_at: new Date().toISOString(),
            status: 'deleted',
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        throw new TenantError(`Failed to delete tenant: ${error.message}`, 'DB_ERROR');
    }

    return {
        tenant: data as Tenant,
        warning,
    };
}
