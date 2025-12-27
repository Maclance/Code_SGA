/**
 * Invitations API Route
 *
 * @module api/tenants/[tenantId]/invitations
 * @description API endpoints for invitation management (US-002)
 *
 * POST: Create new invitation (admin_tenant only)
 * GET: List pending invitations (admin_tenant only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRoleAndTenant, getTenantIdFromParams } from '@/lib/auth/rbac';
import {
    createInvitation,
    getInvitations,
    UserError,
} from '@/lib/services/user.service';
import { CreateInvitationSchema } from '@/types/user';

type RouteContext = {
    params: Promise<{ tenantId: string }>;
};

/**
 * POST /api/tenants/[tenantId]/invitations
 * Create a new invitation
 *
 * AC1: Given admin tenant, When invitation envoyée, Then email avec lien activation
 */
export async function POST(request: NextRequest, context: RouteContext) {
    try {
        const tenantId = await getTenantIdFromParams(context.params);

        // Check authentication and authorization
        const { response, user } = await requireRoleAndTenant(
            ['admin_tenant'],
            tenantId
        );
        if (response) return response;
        if (!user) {
            return NextResponse.json(
                { error: 'unauthorized', message: 'Authentication required' },
                { status: 401 }
            );
        }

        // Parse and validate request body
        const body = await request.json();
        const validation = CreateInvitationSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                {
                    error: 'validation_error',
                    message: validation.error.issues.map((e) => e.message).join(', '),
                },
                { status: 400 }
            );
        }

        // Create invitation
        const result = await createInvitation(tenantId, user.id, validation.data);

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        if (error instanceof UserError) {
            return NextResponse.json(
                { error: error.code.toLowerCase(), message: error.message },
                { status: error.statusCode }
            );
        }
        console.error('Failed to create invitation:', error);
        return NextResponse.json(
            { error: 'internal_error', message: 'Failed to create invitation' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/tenants/[tenantId]/invitations
 * List all pending invitations for the tenant
 */
export async function GET(request: NextRequest, context: RouteContext) {
    try {
        const tenantId = await getTenantIdFromParams(context.params);

        // Check authentication and authorization
        const { response, user } = await requireRoleAndTenant(
            ['admin_tenant'],
            tenantId
        );
        if (response) return response;
        if (!user) {
            return NextResponse.json(
                { error: 'unauthorized', message: 'Authentication required' },
                { status: 401 }
            );
        }

        // Get invitations
        const invitations = await getInvitations(tenantId);

        return NextResponse.json({ invitations });
    } catch (error) {
        if (error instanceof UserError) {
            return NextResponse.json(
                { error: error.code.toLowerCase(), message: error.message },
                { status: error.statusCode }
            );
        }
        console.error('Failed to fetch invitations:', error);
        return NextResponse.json(
            { error: 'internal_error', message: 'Failed to fetch invitations' },
            { status: 500 }
        );
    }
}
