/**
 * Confirm Scope API Route
 * 
 * @module app/api/sessions/[sessionId]/confirm-scope/route
 * @description POST endpoint for confirming product scope and activating session (US-013)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import {
    confirmProductScope,
    ValidationError,
    SessionNotFoundError,
    InvalidStatusTransitionError,
    SessionError,
} from '@/lib/services/session.service';
import type { ProductId } from '@/types/session';

interface RouteParams {
    params: Promise<{
        sessionId: string;
    }>;
}

// Validation schema for confirm scope
const ConfirmScopeSchema = z.object({
    products: z.array(z.enum(['auto', 'mrh'])).min(1, 'Au moins un produit requis'),
});

/**
 * POST /api/sessions/[sessionId]/confirm-scope
 * Confirm product scope and transition session to 'ready' status
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
    const { sessionId } = await params;
    const supabase = await createClient();

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Get user's tenant
    const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

    if (!userData?.tenant_id) {
        return NextResponse.json({ error: 'Tenant non trouvé' }, { status: 403 });
    }

    // Parse and validate body
    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
    }

    const parseResult = ConfirmScopeSchema.safeParse(body);
    if (!parseResult.success) {
        return NextResponse.json({
            error: 'Sélectionnez au moins un produit',
            details: parseResult.error.flatten()
        }, { status: 400 });
    }

    const { products } = parseResult.data;

    try {
        // Use the service function which handles RLS bypass with admin client
        const result = await confirmProductScope(
            sessionId,
            products as ProductId[],
            user.id,
            userData.tenant_id
        );

        // Log audit event
        try {
            await supabase.from('audit_logs').insert({
                user_id: user.id,
                tenant_id: userData.tenant_id,
                action: 'session.confirm_scope',
                entity_type: 'session',
                entity_id: sessionId,
                metadata: { products },
            });
        } catch (auditError) {
            // Non-blocking - log but don't fail the request
            console.warn('Failed to create audit log:', auditError);
        }

        return NextResponse.json({
            success: true,
            session: result.session,
        });
    } catch (error) {
        if (error instanceof ValidationError) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        if (error instanceof SessionNotFoundError) {
            return NextResponse.json({ error: 'Session non trouvée' }, { status: 404 });
        }
        if (error instanceof InvalidStatusTransitionError) {
            return NextResponse.json({ error: 'Cette session a déjà été configurée' }, { status: 400 });
        }
        if (error instanceof SessionError) {
            return NextResponse.json({ error: error.message }, { status: error.statusCode });
        }

        console.error('Error confirming scope:', error);
        return NextResponse.json({ error: 'Erreur lors de la confirmation' }, { status: 500 });
    }
}
