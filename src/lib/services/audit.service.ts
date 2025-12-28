/**
 * Audit Service
 *
 * @module lib/services/audit.service
 * @description Business logic for audit logging (US-004)
 */

import { createClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';
import {
    AuditAction,
    type AuditLogEntry,
    type AuditLogListResponse,
    type AuditLogQueryOptions,
    type CreateAuditLogInput,
    type AuditRequestContext,
} from '@/types/audit';

// Re-export AuditAction for convenience
export { AuditAction } from '@/types/audit';

// ============================================
// Error Classes
// ============================================

export class AuditError extends Error {
    constructor(
        message: string,
        public code: string,
        public statusCode: number = 500
    ) {
        super(message);
        this.name = 'AuditError';
    }
}

export class AuditQueryError extends AuditError {
    constructor(message: string) {
        super(message, 'AUDIT_QUERY_ERROR', 400);
    }
}

// ============================================
// Admin Client (for bypassing RLS)
// ============================================

/**
 * Create Supabase admin client with service_role key
 * Required for inserting audit logs (bypasses RLS)
 */
function getAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        throw new AuditError(
            'Missing Supabase configuration for audit service',
            'CONFIG_ERROR',
            500
        );
    }

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}

// ============================================
// Helper Functions
// ============================================

/**
 * Extract request context (IP and User-Agent) from NextRequest
 */
export function extractRequestContext(request?: NextRequest): AuditRequestContext {
    if (!request) {
        return {};
    }

    // Try to get real IP from various headers
    const ip =
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        request.headers.get('cf-connecting-ip') || // Cloudflare
        undefined;

    const userAgent = request.headers.get('user-agent') || undefined;

    return { ip, userAgent };
}

/**
 * Sanitize payload to remove any potential PII
 * This is a basic implementation - extend as needed
 */
function sanitizePayload(
    payload?: Record<string, unknown>
): Record<string, unknown> {
    if (!payload) return {};

    // List of fields that might contain PII
    const piiFields = ['email', 'password', 'phone', 'address', 'name', 'displayName'];

    const sanitized = { ...payload };

    for (const field of piiFields) {
        if (field in sanitized) {
            // Replace with indication that field was present but redacted
            sanitized[field] = '[REDACTED]';
        }
    }

    return sanitized;
}

// ============================================
// Core Functions
// ============================================

/**
 * Log an audit event
 *
 * This function is designed to be non-blocking. Errors are logged
 * but do not throw to avoid failing the main operation.
 *
 * @param event - Audit event details
 * @param request - Optional NextRequest for extracting IP/User-Agent
 */
export async function logAuditEvent(
    event: CreateAuditLogInput,
    request?: NextRequest
): Promise<void> {
    try {
        const supabase = getAdminClient();
        const context = extractRequestContext(request);

        const entry = {
            tenant_id: event.tenantId,
            user_id: event.userId || null,
            action: event.action,
            resource_type: event.resourceType || null,
            resource_id: event.resourceId || null,
            payload: sanitizePayload(event.payload),
            ip_address: event.ipAddress || context.ip || null,
            user_agent: event.userAgent || context.userAgent || null,
        };

        const { error } = await supabase.from('audit_logs').insert(entry);

        if (error) {
            // Log error but don't throw - audit should not fail main operation
            console.error('[AuditService] Failed to log audit event:', error.message, {
                action: event.action,
                tenantId: event.tenantId,
            });
        }
    } catch (error) {
        // Catch any unexpected errors
        console.error('[AuditService] Unexpected error logging audit event:', error);
    }
}

/**
 * Get paginated audit logs for a tenant
 *
 * @param tenantId - Tenant ID to filter by
 * @param options - Query options (page, limit, action filter)
 * @returns Paginated audit logs
 */
export async function getAuditLogs(
    tenantId: string,
    options: AuditLogQueryOptions = {}
): Promise<AuditLogListResponse> {
    const supabase = getAdminClient();

    const page = options.page || 1;
    const limit = Math.min(options.limit || 50, 50); // Max 50 per page
    const offset = (page - 1) * limit;

    // Build query with user join for actor display_name
    let query = supabase
        .from('audit_logs')
        .select(`
            *,
            user:users!audit_logs_user_id_fkey (
                display_name,
                email
            )
        `, { count: 'exact' })
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    // Apply action filter if provided
    if (options.action) {
        query = query.eq('action', options.action);
    }

    const { data, error, count } = await query;

    if (error) {
        throw new AuditError(
            `Failed to fetch audit logs: ${error.message}`,
            'DB_ERROR',
            500
        );
    }

    // Enrich logs with target user info when resource_type is 'user'
    const logs = data || [];
    const targetUserIds = logs
        .filter((log) => log.resource_type === 'user' && log.resource_id)
        .map((log) => log.resource_id);

    let targetUsers: Record<string, { display_name: string | null; email: string }> = {};

    if (targetUserIds.length > 0) {
        const { data: targetUserData } = await supabase
            .from('users')
            .select('id, display_name, email')
            .in('id', targetUserIds);

        if (targetUserData) {
            targetUsers = targetUserData.reduce((acc, user) => {
                acc[user.id] = { display_name: user.display_name, email: user.email };
                return acc;
            }, {} as Record<string, { display_name: string | null; email: string }>);
        }
    }

    // Add target_user to logs
    const enrichedLogs = logs.map((log) => ({
        ...log,
        target_user: log.resource_type === 'user' && log.resource_id
            ? targetUsers[log.resource_id] || null
            : null,
    }));

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
        logs: enrichedLogs as AuditLogEntry[],
        pagination: {
            page,
            limit,
            total,
            totalPages,
        },
    };
}

/**
 * Get a single audit log by ID
 *
 * @param id - Audit log ID
 * @param tenantId - Tenant ID for verification
 * @returns Audit log entry
 */
export async function getAuditLogById(
    id: string,
    tenantId: string
): Promise<AuditLogEntry | null> {
    const supabase = getAdminClient();

    const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            return null; // Not found
        }
        throw new AuditError(
            `Failed to fetch audit log: ${error.message}`,
            'DB_ERROR',
            500
        );
    }

    return data as AuditLogEntry;
}

// ============================================
// Convenience Helpers
// ============================================

/**
 * Log a session-related audit event
 */
export async function logSessionEvent(
    tenantId: string,
    userId: string,
    action: 'session.create' | 'session.update' | 'session.delete',
    sessionId: string,
    payload?: Record<string, unknown>,
    request?: NextRequest
): Promise<void> {
    await logAuditEvent(
        {
            tenantId,
            userId,
            action: action as AuditAction,
            resourceType: 'session',
            resourceId: sessionId,
            payload,
        },
        request
    );
}

/**
 * Log a user-related audit event
 */
export async function logUserEvent(
    tenantId: string,
    userId: string,
    action: 'user.invite' | 'user.role_change',
    targetUserId: string,
    payload?: Record<string, unknown>,
    request?: NextRequest
): Promise<void> {
    await logAuditEvent(
        {
            tenantId,
            userId,
            action: action as AuditAction,
            resourceType: 'user',
            resourceId: targetUserId,
            payload,
        },
        request
    );
}

/**
 * Log an export-related audit event
 */
export async function logExportEvent(
    tenantId: string,
    userId: string,
    action: 'export.pdf' | 'export.data',
    exportType: string,
    payload?: Record<string, unknown>,
    request?: NextRequest
): Promise<void> {
    await logAuditEvent(
        {
            tenantId,
            userId,
            action: action as AuditAction,
            resourceType: 'export',
            payload: { exportType, ...payload },
        },
        request
    );
}
