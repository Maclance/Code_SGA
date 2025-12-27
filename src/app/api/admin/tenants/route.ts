/**
 * Admin Tenants API Routes
 * 
 * POST /api/admin/tenants - Create a new tenant
 * GET /api/admin/tenants - List all tenants
 * 
 * @module app/api/admin/tenants
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
    createTenant,
    getTenants,
    TenantError,
} from '@/lib/services/tenant.service';
import { CreateTenantSchema } from '@/types/tenant';

/**
 * POST /api/admin/tenants
 * Creates a new tenant (super admin only)
 */
export async function POST(request: Request) {
    try {
        const supabase = await createClient();

        // Parse request body
        const body = await request.json();

        // Validate input
        const validation = CreateTenantSchema.safeParse(body);
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

        // Create tenant
        const tenant = await createTenant(supabase, validation.data);

        return NextResponse.json(
            { tenant },
            { status: 201 }
        );

    } catch (error) {
        console.error('[POST /api/admin/tenants] Error:', error);

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
 * GET /api/admin/tenants
 * Lists all active tenants (super admin only)
 */
export async function GET() {
    try {
        const supabase = await createClient();

        const tenants = await getTenants(supabase);

        return NextResponse.json({ tenants });

    } catch (error) {
        console.error('[GET /api/admin/tenants] Error:', error);

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
