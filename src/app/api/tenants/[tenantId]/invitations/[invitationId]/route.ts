/**
 * Single Invitation API Route
 *
 * @module api/tenants/[tenantId]/invitations/[invitationId]
 * @description API endpoints for single invitation management (US-002)
 *
 * DELETE: Cancel/delete an invitation (admin_tenant only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRoleAndTenant } from '@/lib/auth/rbac';
import {
    deleteInvitation,
    resendInvitation,
    UserError,
} from '@/lib/services/user.service';

type RouteContext = {
    params: Promise<{ tenantId: string; invitationId: string }>;
};

/**
 * DELETE /api/tenants/[tenantId]/invitations/[invitationId]
 * Delete/cancel an invitation
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
    try {
        const params = await context.params;
        const tenantId = params.tenantId;
        const invitationId = params.invitationId;

        if (!tenantId || !invitationId) {
            return NextResponse.json(
                { error: 'validation_error', message: 'Missing required parameters' },
                { status: 400 }
            );
        }

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

        // Delete invitation
        await deleteInvitation(invitationId, tenantId);

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        if (error instanceof UserError) {
            return NextResponse.json(
                { error: error.code.toLowerCase(), message: error.message },
                { status: error.statusCode }
            );
        }
        console.error('Failed to delete invitation:', error);
        return NextResponse.json(
            { error: 'internal_error', message: 'Failed to delete invitation' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/tenants/[tenantId]/invitations/[invitationId]/resend
 * Resend an invitation email
 */
export async function POST(request: NextRequest, context: RouteContext) {
    try {
        const params = await context.params;
        const tenantId = params.tenantId;
        const invitationId = params.invitationId;

        if (!tenantId || !invitationId) {
            return NextResponse.json(
                { error: 'validation_error', message: 'Missing required parameters' },
                { status: 400 }
            );
        }

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

        // Resend invitation
        const result = await resendInvitation(invitationId, tenantId);

        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        if (error instanceof UserError) {
            return NextResponse.json(
                { error: error.code.toLowerCase(), message: error.message },
                { status: error.statusCode }
            );
        }
        console.error('Failed to resend invitation:', error);
        return NextResponse.json(
            { error: 'internal_error', message: 'Failed to resend invitation' },
            { status: 500 }
        );
    }
}
