/**
 * Admin Audit Logs API Routes
 *
 * GET /api/admin/audit-logs - List audit logs with pagination
 *
 * @module app/api/admin/audit-logs
 * @description Audit log consultation for admins (US-004)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuditLogs, AuditError } from '@/lib/services/audit.service';
import { AuditLogQuerySchema } from '@/types/audit';

/**
 * GET /api/admin/audit-logs
 *
 * Query Parameters:
 * - page: number (default: 1)
 * - limit: number (default: 50, max: 50)
 * - action: string (optional filter by action type)
 *
 * Returns paginated audit logs for the current user's tenant.
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Get current user
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized', code: 'UNAUTHORIZED' },
                { status: 401 }
            );
        }

        // Get user's tenant_id from the users table
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('tenant_id, role')
            .eq('id', user.id)
            .single();

        if (userError || !userData) {
            return NextResponse.json(
                { error: 'User not found', code: 'USER_NOT_FOUND' },
                { status: 404 }
            );
        }

        // Only admin_tenant can access audit logs (per auth_rbac.md)
        if (userData.role !== 'admin_tenant') {
            return NextResponse.json(
                { error: 'Access denied', code: 'ACCESS_DENIED' },
                { status: 403 }
            );
        }

        // Parse query parameters
        const searchParams = request.nextUrl.searchParams;
        const rawParams = {
            page: searchParams.get('page') || undefined,
            limit: searchParams.get('limit') || undefined,
            action: searchParams.get('action') || undefined,
        };

        // Validate query parameters
        const validation = AuditLogQuerySchema.safeParse(rawParams);
        if (!validation.success) {
            return NextResponse.json(
                {
                    error: 'Invalid query parameters',
                    details: validation.error.issues.map((e) => ({
                        field: e.path.join('.'),
                        message: e.message,
                    })),
                },
                { status: 400 }
            );
        }

        // Fetch audit logs
        const result = await getAuditLogs(userData.tenant_id, {
            page: validation.data.page,
            limit: validation.data.limit,
            action: validation.data.action,
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('[GET /api/admin/audit-logs] Error:', error);

        if (error instanceof AuditError) {
            return NextResponse.json(
                { error: error.message, code: error.code },
                { status: error.statusCode }
            );
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
