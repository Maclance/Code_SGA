/**
 * Sessions API Endpoint
 * 
 * @module app/api/sessions
 * @description Create and list game sessions (US-010)
 * 
 * GET  - List sessions for current user's tenant
 * POST - Create a new session
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
    createSession,
    getSessionsByTenant,
    SessionError,
    ValidationError,
    UnauthorizedError,
} from '@/lib/services/session.service';
import { formatCodeForDisplay } from '@/lib/utils/session-code';

// ============================================
// GET - List sessions
// ============================================

/**
 * Get all sessions for the current user's tenant
 */
export async function GET(
    _request: NextRequest
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

        // Get user's tenant
        const { data: userData } = await supabase
            .from('users')
            .select('tenant_id')
            .eq('id', user.id)
            .single();

        if (!userData?.tenant_id) {
            return NextResponse.json(
                { error: 'Tenant non trouvé', code: 'TENANT_NOT_FOUND' },
                { status: 403 }
            );
        }

        // Get sessions
        const sessions = await getSessionsByTenant(userData.tenant_id);

        // Add display code to each session
        const sessionsWithDisplayCode = sessions.map(session => ({
            ...session,
            displayCode: formatCodeForDisplay(session.code),
        }));

        return NextResponse.json({ sessions: sessionsWithDisplayCode });
    } catch (error) {
        console.error('Error listing sessions:', error);
        return NextResponse.json(
            { error: 'Erreur serveur', code: 'INTERNAL_ERROR' },
            { status: 500 }
        );
    }
}

// ============================================
// POST - Create session
// ============================================

/**
 * Create a new game session
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

        // Get user's tenant and role
        const { data: userData } = await supabase
            .from('users')
            .select('tenant_id, role')
            .eq('id', user.id)
            .single();

        if (!userData?.tenant_id) {
            return NextResponse.json(
                { error: 'Tenant non trouvé', code: 'TENANT_NOT_FOUND' },
                { status: 403 }
            );
        }

        // Only admin_tenant and formateur can create sessions
        if (!['admin_tenant', 'formateur'].includes(userData.role || '')) {
            return NextResponse.json(
                { error: 'Rôle insuffisant pour créer une session', code: 'FORBIDDEN' },
                { status: 403 }
            );
        }

        // Parse request body
        const body = await request.json();

        // Create session
        const session = await createSession(body, user.id, userData.tenant_id);

        return NextResponse.json({
            session: {
                ...session,
                displayCode: formatCodeForDisplay(session.code),
            },
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating session:', error);

        if (error instanceof ValidationError) {
            return NextResponse.json(
                { error: error.message, code: error.code },
                { status: 400 }
            );
        }

        if (error instanceof UnauthorizedError) {
            return NextResponse.json(
                { error: error.message, code: error.code },
                { status: 403 }
            );
        }

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
