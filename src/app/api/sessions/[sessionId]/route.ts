/**
 * Session by ID API Route
 *
 * @module app/api/sessions/[sessionId]/route
 * @description API endpoint for getting a single session
 *
 * GET /api/sessions/[sessionId] - Get session by ID
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
    getSessionById,
    SessionNotFoundError,
    SessionError,
} from '@/lib/services/session.service';

// ============================================
// GET /api/sessions/[sessionId]
// ============================================

export async function GET(
    request: Request,
    { params }: { params: Promise<{ sessionId: string }> }
) {
    try {
        // Get authenticated user
        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Non authentifié' },
                { status: 401 }
            );
        }

        // Get user's tenant_id
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('tenant_id')
            .eq('id', user.id)
            .single();

        if (userError || !userData?.tenant_id) {
            return NextResponse.json(
                { error: 'Tenant non trouvé' },
                { status: 404 }
            );
        }

        // Get session ID from params
        const { sessionId } = await params;

        // Get session
        const session = await getSessionById(sessionId, userData.tenant_id);

        return NextResponse.json({ session }, { status: 200 });
    } catch (error) {
        console.error('[API] GET /api/sessions/[sessionId] error:', error);

        if (error instanceof SessionNotFoundError) {
            return NextResponse.json(
                { error: error.message },
                { status: error.statusCode }
            );
        }

        if (error instanceof SessionError) {
            return NextResponse.json(
                { error: error.message },
                { status: error.statusCode }
            );
        }

        return NextResponse.json(
            { error: 'Erreur interne du serveur' },
            { status: 500 }
        );
    }
}
