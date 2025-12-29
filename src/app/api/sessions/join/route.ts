/**
 * Join Session API Endpoint
 *
 * @module app/api/sessions/join
 * @description Join a session by code (US-012)
 *
 * POST - Join a session using a session code
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import {
    joinSession,
    SessionError,
    SessionNotFoundError,
    SessionFullError,
    SessionInactiveError,
    AlreadyJoinedError,
} from '@/lib/services/session.service';
import { formatCodeForDisplay } from '@/lib/utils/session-code';
import { logAuditEvent } from '@/lib/services/audit.service';
import { AuditAction } from '@/types/audit';

// ============================================
// Validation Schema
// ============================================

const JoinSessionSchema = z.object({
    code: z
        .string()
        .min(1, 'Code requis')
        .max(7, 'Code invalide') // 6 chars + optional separator
        .transform((val) => val.replace(/-/g, '').toUpperCase()),
});

// ============================================
// POST - Join session
// ============================================

/**
 * Join a session using a session code
 */
export async function POST(
    request: NextRequest
): Promise<NextResponse> {
    try {
        // Auth check
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Non autorisé', code: 'UNAUTHORIZED' },
                { status: 401 }
            );
        }

        // Get user's tenant for audit logging
        const { data: userData } = await supabase
            .from('users')
            .select('tenant_id')
            .eq('id', user.id)
            .single();

        // Parse and validate request body
        const body = await request.json();
        const validation = JoinSessionSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                {
                    error: validation.error.issues[0]?.message || 'Code invalide',
                    code: 'VALIDATION_ERROR',
                },
                { status: 400 }
            );
        }

        const { code } = validation.data;

        // Join the session
        const result = await joinSession(code, user.id);

        // Log audit event (non-blocking)
        if (userData?.tenant_id) {
            logAuditEvent(
                {
                    tenantId: userData.tenant_id,
                    userId: user.id,
                    action: AuditAction.SESSION_JOIN,
                    resourceType: 'session',
                    resourceId: result.sessionId,
                    payload: {
                        code: code,
                        participantId: result.participantId,
                    },
                },
                request
            );
        }

        return NextResponse.json({
            sessionId: result.sessionId,
            session: {
                ...result.session,
                displayCode: formatCodeForDisplay(result.session.code),
            },
        });
    } catch (error) {
        console.error('Error joining session:', error);

        // AC2: Invalid code error
        if (error instanceof SessionNotFoundError) {
            return NextResponse.json(
                { error: 'Session introuvable', code: 'SESSION_NOT_FOUND' },
                { status: 404 }
            );
        }

        // AC3: Session full error
        if (error instanceof SessionFullError) {
            return NextResponse.json(
                { error: 'Session complète', code: 'SESSION_FULL' },
                { status: 409 }
            );
        }

        // Session not active error
        if (error instanceof SessionInactiveError) {
            return NextResponse.json(
                { error: 'Session non accessible', code: 'SESSION_INACTIVE' },
                { status: 403 }
            );
        }

        // Already joined error
        if (error instanceof AlreadyJoinedError) {
            return NextResponse.json(
                { error: 'Vous avez déjà rejoint cette session', code: 'ALREADY_JOINED' },
                { status: 409 }
            );
        }

        // Generic session error
        if (error instanceof SessionError) {
            return NextResponse.json(
                { error: error.message, code: error.code },
                { status: error.statusCode }
            );
        }

        return NextResponse.json(
            { error: 'Erreur serveur', code: 'INTERNAL_ERROR' },
            { status: 500 }
        );
    }
}
