/**
 * Admin Tenant by ID API Routes
 * 
 * GET /api/admin/tenants/:id - Get tenant by ID
 * PATCH /api/admin/tenants/:id - Update tenant
 * DELETE /api/admin/tenants/:id - Soft delete tenant
 * 
 * @module app/api/admin/tenants/[id]
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
    getTenantById,
    updateTenant,
    deleteTenant,
    TenantError,
} from '@/lib/services/tenant.service';
import { UpdateTenantSchema } from '@/types/tenant';

interface RouteContext {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/tenants/:id
 * Gets a single tenant by ID
 */
export async function GET(
    request: Request,
    context: RouteContext
) {
    try {
        const supabase = await createClient();
        const { id } = await context.params;

        const tenant = await getTenantById(supabase, id);

        return NextResponse.json({ tenant });

    } catch (error) {
        console.error('[GET /api/admin/tenants/:id] Error:', error);

        if (error instanceof TenantError) {
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

/**
 * PATCH /api/admin/tenants/:id
 * Updates a tenant (partial update)
 */
export async function PATCH(
    request: Request,
    context: RouteContext
) {
    try {
        const supabase = await createClient();
        const { id } = await context.params;

        // Parse request body
        const body = await request.json();

        // Validate input
        const validation = UpdateTenantSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                {
                    error: 'Validation error',
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    details: validation.error.issues.map((e: any) => ({
                        field: e.path.join('.'),
                        message: e.message,
                    })),
                },
                { status: 400 }
            );
        }

        const tenant = await updateTenant(supabase, id, validation.data);

        return NextResponse.json({ tenant });

    } catch (error) {
        console.error('[PATCH /api/admin/tenants/:id] Error:', error);

        if (error instanceof TenantError) {
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

/**
 * DELETE /api/admin/tenants/:id
 * Soft deletes a tenant (sets deleted_at)
 */
export async function DELETE(
    request: Request,
    context: RouteContext
) {
    try {
        const supabase = await createClient();
        const { id } = await context.params;

        const result = await deleteTenant(supabase, id);

        const response: { message: string; tenant: typeof result.tenant; warning?: string } = {
            message: 'Tenant deleted successfully',
            tenant: result.tenant,
        };

        if (result.warning) {
            response.warning = result.warning;
        }

        return NextResponse.json(response);

    } catch (error) {
        console.error('[DELETE /api/admin/tenants/:id] Error:', error);

        if (error instanceof TenantError) {
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
