/**
 * Sessions API Route
 *
 * @module app/api/sessions/route
 * @description API endpoints for session management (US-010)
 *
 * POST /api/sessions - Create a new session
 * GET /api/sessions - List sessions for current tenant
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
    createSession,
    getSessionsByTenant,
    ValidationError,
    UnauthorizedError,
    SessionError,
} from '@/lib/services/session.service';
import { CreateSessionInputSchema } from '@/types/session';
import { logAuditEvent, AuditAction } from '@/lib/services/audit.service';

// ============================================
// POST /api/sessions - Create Session
// ============================================

export async function POST(request: NextRequest) {
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

        // Get user's tenant_id from users table
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('tenant_id, role')
            .eq('id', user.id)
            .single();

        if (userError || !userData) {
            return NextResponse.json(
                { error: 'Utilisateur non trouvé' },
                { status: 404 }
            );
        }

        // Check tenant_id exists (AC: formateur sans tenant_id → erreur 403)
        if (!userData.tenant_id) {
            return NextResponse.json(
                { error: 'Formateur sans tenant_id' },
                { status: 403 }
            );
        }

        // Check role permissions (only trainers and admins can create sessions)
        const allowedRoles = ['super_admin', 'admin_tenant', 'formateur'];
        if (!allowedRoles.includes(userData.role)) {
            return NextResponse.json(
                { error: 'Permission refusée - rôle insuffisant' },
                { status: 403 }
            );
        }

        // Parse and validate request body
        let body;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                { error: 'Corps de requête invalide' },
                { status: 400 }
            );
        }

        // Validate input with Zod
        const validation = CreateSessionInputSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                {
                    error: 'Validation échouée',
                    details: validation.error.issues.map((e) => ({
                        field: e.path.join('.'),
                        message: e.message,
                    })),
                },
                { status: 400 }
            );
        }

        // Create session
        const session = await createSession(
            validation.data,
            user.id,
            userData.tenant_id
        );

        // Log audit event (AC: Log audit_logs: action = 'session.create')
        await logAuditEvent(
            {
                tenantId: userData.tenant_id,
                userId: user.id,
                action: AuditAction.SESSION_CREATE,
                resourceType: 'session',
                resourceId: session.id,
                payload: {
                    sessionName: session.name,
                    sessionCode: session.code,
                    config: session.config,
                },
            },
            request
        );

        return NextResponse.json({ session }, { status: 201 });
    } catch (error) {
        console.error('[API] POST /api/sessions error:', error);

        if (error instanceof ValidationError) {
            return NextResponse.json(
                { error: error.message },
                { status: error.statusCode }
            );
        }

        if (error instanceof UnauthorizedError) {
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

// ============================================
// GET /api/sessions - List Sessions
// ============================================

export async function GET() {
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

        // Get sessions
        const sessions = await getSessionsByTenant(userData.tenant_id);

        return NextResponse.json({ sessions }, { status: 200 });
    } catch (error) {
        console.error('[API] GET /api/sessions error:', error);

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
