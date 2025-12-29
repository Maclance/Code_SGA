/**
 * Audit Types
 *
 * @module types/audit
 * @description Types for audit logging (US-004)
 */

import { z } from 'zod';

// ============================================
// Audit Actions (MVP)
// ============================================

/**
 * Actions to be logged in the audit trail
 * These are the sensitive actions defined in audit_log.md
 */
export const AuditAction = {
    // Session management
    SESSION_CREATE: 'session.create',
    SESSION_UPDATE: 'session.update',
    SESSION_DELETE: 'session.delete',
    SESSION_JOIN: 'session.join',

    // User management
    USER_INVITE: 'user.invite',
    USER_ROLE_CHANGE: 'user.role_change',

    // Exports
    EXPORT_PDF: 'export.pdf',
    EXPORT_DATA: 'export.data',

    // Auth events (for future use)
    AUTH_LOGIN_SUCCESS: 'auth.login_success',
    AUTH_LOGIN_FAILURE: 'auth.login_failure',
    AUTH_LOGOUT: 'auth.logout',
    AUTH_PASSWORD_RESET: 'auth.password_reset',

    // Security events
    SECURITY_ACCESS_DENIED: 'security.access_denied',
} as const;

export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];

// ============================================
// Audit Log Entry
// ============================================

/**
 * Audit log entry from database
 */
export interface AuditLogEntry {
    id: string;
    tenant_id: string;
    user_id: string | null;
    action: string;
    resource_type: string | null;
    resource_id: string | null;
    payload: Record<string, unknown>;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
    // Joined user info
    user?: {
        display_name: string | null;
        email: string;
    } | null;
    // Target user info (when resource_type is 'user')
    target_user?: {
        display_name: string | null;
        email: string;
    } | null;
}

/**
 * Input for creating an audit log entry
 */
export interface CreateAuditLogInput {
    tenantId: string;
    userId?: string;
    action: AuditAction;
    resourceType?: string;
    resourceId?: string;
    payload?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
}

// ============================================
// Pagination
// ============================================

/**
 * Pagination parameters for audit log queries
 */
export interface AuditLogQueryOptions {
    page?: number;
    limit?: number;
    action?: string;
}

/**
 * Paginated response for audit logs
 */
export interface AuditLogListResponse {
    logs: AuditLogEntry[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// ============================================
// Zod Schemas
// ============================================

/**
 * Schema for validating audit log query parameters
 */
export const AuditLogQuerySchema = z.object({
    page: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : 1))
        .refine((val) => val >= 1, 'Page must be at least 1'),
    limit: z
        .string()
        .optional()
        .transform((val) => (val ? Math.min(parseInt(val, 10), 50) : 50))
        .refine((val) => val >= 1 && val <= 50, 'Limit must be between 1 and 50'),
    action: z.string().optional(),
});

export type AuditLogQueryParams = z.infer<typeof AuditLogQuerySchema>;

// ============================================
// Helper type for request context
// ============================================

/**
 * Request context for extracting IP and User-Agent
 */
export interface AuditRequestContext {
    ip?: string;
    userAgent?: string;
}
