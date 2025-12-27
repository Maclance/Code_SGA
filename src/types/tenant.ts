/**
 * Tenant Types & Validation Schemas
 * 
 * @module types/tenant
 * @description TypeScript types and Zod schemas for tenant management (US-001)
 */

import { z } from 'zod';

// ============================================
// Zod Validation Schemas
// ============================================

/**
 * Schema for tenant settings JSONB field
 * Allows custom branding, limits, and configuration
 */
export const TenantSettingsSchema = z.record(z.string(), z.unknown()).default({});

/**
 * Schema for creating a new tenant
 * Validates input before database insertion
 */
export const CreateTenantSchema = z.object({
    name: z.string()
        .min(1, 'Name is required')
        .max(255, 'Name must be 255 characters or less'),
    slug: z.string()
        .min(1, 'Slug is required')
        .max(100, 'Slug must be 100 characters or less')
        .regex(
            /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
            'Slug must be lowercase alphanumeric with hyphens (e.g., "my-company")'
        ),
    settings: TenantSettingsSchema.optional(),
});

/**
 * Schema for updating an existing tenant
 * All fields optional - partial updates allowed
 */
export const UpdateTenantSchema = z.object({
    name: z.string()
        .min(1, 'Name cannot be empty')
        .max(255, 'Name must be 255 characters or less')
        .optional(),
    settings: TenantSettingsSchema.optional(),
    status: z.enum(['active', 'suspended']).optional(),
});

// ============================================
// TypeScript Interfaces
// ============================================

/**
 * Tenant status enum values
 */
export type TenantStatus = 'active' | 'suspended' | 'deleted';

/**
 * Tenant entity as stored in database
 * Aligned with data_model.md § 3.1 Tenants
 */
export interface Tenant {
    /** UUID v4 primary key */
    id: string;
    /** Display name of the organization */
    name: string;
    /** URL-safe unique identifier */
    slug: string;
    /** Custom settings (branding, limits) */
    settings: Record<string, unknown>;
    /** Current status */
    status: TenantStatus;
    /** Creation timestamp (UTC) */
    created_at: string;
    /** Last update timestamp (UTC) */
    updated_at: string;
    /** Soft delete timestamp (null = active) */
    deleted_at: string | null;
}

/**
 * Input type for creating a tenant
 * Inferred from Zod schema for type safety
 */
export type CreateTenantInput = z.infer<typeof CreateTenantSchema>;

/**
 * Input type for updating a tenant
 * Inferred from Zod schema for type safety
 */
export type UpdateTenantInput = z.infer<typeof UpdateTenantSchema>;

/**
 * Response type for tenant operations
 * Includes optional warning messages for edge cases
 */
export interface TenantResponse {
    tenant: Tenant;
    warning?: string;
}

/**
 * Error codes for tenant operations
 */
export type TenantErrorCode =
    | 'TENANT_NOT_FOUND'
    | 'TENANT_SLUG_CONFLICT'
    | 'TENANT_VALIDATION_ERROR'
    | 'TENANT_HAS_ACTIVE_SESSIONS';
