/**
 * Confirm Product Scope API Endpoint
 *
 * @module app/api/sessions/[sessionId]/confirm-scope
 * @description Confirm product scope and activate session (US-013)
 *
 * POST - Confirm products and transition session to 'active'
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import {
    confirmProductScope,
    SessionError,
    SessionNotFoundError,
    ValidationError,
    InvalidStatusTransitionError,
} from '@/lib/services/session.service';
import { logAuditEvent } from '@/lib/services/audit.service';
import { AuditAction } from '@/types/audit';

// ============================================
// Validation Schema
// ============================================

const ConfirmScopeSchema = z.object({
    products: z
        .array(z.enum(['auto', 'mrh']))
        .min(1, 'Sélectionnez au moins un produit'),
});

// ============================================
// Route Context Type
// ============================================

interface RouteContext {
    params: Promise<{
        sessionId: string;
    }>;
}

// ============================================
// POST - Confirm product scope
// ============================================

/**
 * Confirm products for a session and activate it
 */
export async function POST(
    request: NextRequest,
    context: RouteContext
): Promise<NextResponse> {
    try {
        const { sessionId } = await context.params;

        // Auth check
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Non autorisé', code: 'UNAUTHORIZED' },
                { status: 401 }
            );
        }

        // Get user's tenant
        const { data: userData } = await supabase
            .from('users')
            .select('tenant_id')
            .eq('id', user.id)
            .single();

        if (!userData?.tenant_id) {
            return NextResponse.json(
                { error: 'Tenant non trouvé', code: 'NO_TENANT' },
                { status: 403 }
            );
        }

        // Parse and validate request body
        const body = await request.json();
        const validation = ConfirmScopeSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                {
                    error: validation.error.issues[0]?.message || 'Données invalides',
                    code: 'VALIDATION_ERROR',
                },
                { status: 400 }
            );
        }

        const { products } = validation.data;

        // Confirm product scope
        const result = await confirmProductScope(
            sessionId,
            products,
            user.id,
            userData.tenant_id
        );

        // Log audit event (non-blocking)
        logAuditEvent(
            {
                tenantId: userData.tenant_id,
                userId: user.id,
                action: AuditAction.SESSION_CONFIRM_SCOPE,
                resourceType: 'session',
                resourceId: sessionId,
                payload: {
                    products: products,
                    previousStatus: 'draft',
                    newStatus: 'ready',
                },
            },
            request
        );

        return NextResponse.json({
            success: true,
            session: result.session,
        });
    } catch (error) {
        console.error('Error confirming product scope:', error);

        // Session not found
        if (error instanceof SessionNotFoundError) {
            return NextResponse.json(
                { error: 'Session introuvable', code: 'SESSION_NOT_FOUND' },
                { status: 404 }
            );
        }

        // Invalid status transition
        if (error instanceof InvalidStatusTransitionError) {
            return NextResponse.json(
                { error: 'Session déjà activée ou non modifiable', code: 'INVALID_STATUS' },
                { status: 403 }
            );
        }

        // Validation error
        if (error instanceof ValidationError) {
            return NextResponse.json(
                { error: error.message, code: 'VALIDATION_ERROR' },
                { status: 400 }
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
