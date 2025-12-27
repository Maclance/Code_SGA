/**
 * User API Route
 *
 * @module api/tenants/[tenantId]/users/[userId]
 * @description API endpoint for user management (US-002)
 *
 * PATCH: Update user role
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRoleAndTenant } from '@/lib/auth/rbac';
import { updateUserRole, UserError } from '@/lib/services/user.service';
import { UpdateUserRoleSchema } from '@/types/user';

type RouteContext = {
    params: Promise<{ tenantId: string; userId: string }>;
};

/**
 * PATCH /api/tenants/[tenantId]/users/[userId]
 * Update a user's role
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
    try {
        const params = await context.params;
        const { tenantId, userId } = params;

        if (!tenantId || !userId) {
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

        // Parse and validate request body
        const body = await request.json();
        const validation = UpdateUserRoleSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                {
                    error: 'validation_error',
                    message: validation.error.issues.map((e) => e.message).join(', '),
                },
                { status: 400 }
            );
        }

        // Prevent changing own role
        if (userId === user.id) {
            return NextResponse.json(
                { error: 'forbidden', message: 'Cannot change your own role' },
                { status: 403 }
            );
        }

        // Update user role
        const updatedUser = await updateUserRole(userId, tenantId, validation.data);

        return NextResponse.json({ user: updatedUser });
    } catch (error) {
        if (error instanceof UserError) {
            return NextResponse.json(
                { error: error.code.toLowerCase(), message: error.message },
                { status: error.statusCode }
            );
        }
        console.error('Failed to update user role:', error);
        return NextResponse.json(
            { error: 'internal_error', message: 'Failed to update user role' },
            { status: 500 }
        );
    }
}
