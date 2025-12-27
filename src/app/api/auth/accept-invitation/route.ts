/**
 * Accept Invitation API Route
 *
 * @module api/auth/accept-invitation
 * @description API endpoint to finalize invitation acceptance (US-002)
 * Called after Supabase Auth signup to link user to tenant
 */

import { NextRequest, NextResponse } from 'next/server';
import { acceptInvitation, UserError } from '@/lib/services/user.service';
import { z } from 'zod';

const AcceptInvitationRequestSchema = z.object({
    token: z.string().uuid('Invalid token'),
    auth_user_id: z.string().uuid('Invalid user ID'),
    display_name: z.string().min(1, 'Display name required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
});

/**
 * POST /api/auth/accept-invitation
 * Accept an invitation and create user in our users table
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = AcceptInvitationRequestSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                {
                    error: 'validation_error',
                    message: validation.error.issues.map((e) => e.message).join(', '),
                },
                { status: 400 }
            );
        }

        const { token, auth_user_id, display_name, password } = validation.data;

        // Accept invitation with password and display name
        const user = await acceptInvitation(token, auth_user_id, display_name, password);

        return NextResponse.json({ user }, { status: 201 });
    } catch (error) {
        if (error instanceof UserError) {
            return NextResponse.json(
                { error: error.code.toLowerCase(), message: error.message },
                { status: error.statusCode }
            );
        }
        console.error('Failed to accept invitation:', error);
        return NextResponse.json(
            { error: 'internal_error', message: 'Failed to accept invitation' },
            { status: 500 }
        );
    }
}

