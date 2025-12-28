/**
 * Audit Logger
 *
 * @module lib/auth/audit-logger
 * @description Audit logging for authentication events (US-003)
 */

import { createClient } from '@supabase/supabase-js';

export type AuthEventType =
    | 'AUTH_LOGIN_SUCCESS'
    | 'AUTH_LOGIN_FAILURE'
    | 'AUTH_LOGOUT'
    | 'AUTH_PASSWORD_RESET_REQUEST'
    | 'AUTH_PASSWORD_RESET_SUCCESS'
    | 'AUTH_RATE_LIMITED';

interface AuditLogEntry {
    eventType: AuthEventType;
    userId?: string;
    tenantId?: string;
    email?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
}

/**
 * Get admin Supabase client with service role
 */
function getAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    return createClient(url, serviceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}

/**
 * Log an authentication event to audit_logs table
 * 
 * @param entry - Audit log entry
 */
export async function logAuthEvent(entry: AuditLogEntry): Promise<void> {
    const supabase = getAdminClient();

    try {
        const { error } = await supabase.from('audit_logs').insert({
            event_type: entry.eventType,
            user_id: entry.userId,
            tenant_id: entry.tenantId,
            entity_type: 'auth',
            entity_id: entry.userId,
            action: entry.eventType.toLowerCase().replace('auth_', ''),
            ip_address: entry.ipAddress,
            user_agent: entry.userAgent,
            metadata: {
                email: entry.email,
                ...entry.metadata,
            },
        });

        if (error) {
            // Log to console but don't throw - audit logging shouldn't break auth
            console.error('Failed to log auth event:', error);
        }
    } catch (err) {
        console.error('Audit log exception:', err);
    }
}

/**
 * Log a successful login
 */
export async function logLoginSuccess(options: {
    userId: string;
    tenantId: string;
    email: string;
    ipAddress?: string;
    userAgent?: string;
}): Promise<void> {
    await logAuthEvent({
        eventType: 'AUTH_LOGIN_SUCCESS',
        ...options,
    });
}

/**
 * Log a failed login attempt
 */
export async function logLoginFailure(options: {
    email: string;
    ipAddress?: string;
    userAgent?: string;
    reason?: string;
}): Promise<void> {
    await logAuthEvent({
        eventType: 'AUTH_LOGIN_FAILURE',
        email: options.email,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
        metadata: { reason: options.reason },
    });
}

/**
 * Log a rate limited attempt
 */
export async function logRateLimited(options: {
    email: string;
    ipAddress?: string;
}): Promise<void> {
    await logAuthEvent({
        eventType: 'AUTH_RATE_LIMITED',
        email: options.email,
        ipAddress: options.ipAddress,
        metadata: { message: 'Too many failed attempts' },
    });
}
