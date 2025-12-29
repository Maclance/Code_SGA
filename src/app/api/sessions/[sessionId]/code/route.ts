/**
 * Session Code API Endpoint (US-011)
 * 
 * @module app/api/sessions/[sessionId]/code
 * @description Get or regenerate session join code
 * 
 * GET - Returns current code (formatted)
 * POST - Regenerates code (only for draft sessions)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import {
    generateUniqueCode,
    formatCodeForDisplay,
} from '@/lib/utils/session-code';

// ============================================
// Types
// ============================================

interface RouteParams {
    params: Promise<{ sessionId: string }>;
}

interface CodeResponse {
    code: string;
    displayCode: string;
}

interface ErrorResponse {
    error: string;
    code: string;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Get admin Supabase client for bypassing RLS
 */
function getAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Missing Supabase configuration');
    }

    return createAdminClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}

// ============================================
// GET - Get session code
// ============================================

/**
 * Get current session code
 * 
 * @returns { code: string, displayCode: string }
 */
export async function GET(
    request: NextRequest,
    { params }: RouteParams
): Promise<NextResponse<CodeResponse | ErrorResponse>> {
    try {
        const { sessionId } = await params;

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

        // Get session
        const { data: session, error } = await supabase
            .from('sessions')
            .select('code')
            .eq('id', sessionId)
            .eq('tenant_id', userData.tenant_id)
            .single();

        if (error || !session) {
            return NextResponse.json(
                { error: 'Session non trouvée', code: 'SESSION_NOT_FOUND' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            code: session.code,
            displayCode: formatCodeForDisplay(session.code),
        });
    } catch (error) {
        console.error('Error getting session code:', error);
        return NextResponse.json(
            { error: 'Erreur serveur', code: 'INTERNAL_ERROR' },
            { status: 500 }
        );
    }
}

// ============================================
// POST - Regenerate session code
// ============================================

/**
 * Regenerate session code (only for draft sessions)
 * 
 * @returns { code: string, displayCode: string }
 */
export async function POST(
    request: NextRequest,
    { params }: RouteParams
): Promise<NextResponse<CodeResponse | ErrorResponse>> {
    try {
        const { sessionId } = await params;

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

        // Only admin_tenant and formateur can regenerate codes
        if (!['admin_tenant', 'formateur'].includes(userData.role || '')) {
            return NextResponse.json(
                { error: 'Rôle insuffisant', code: 'FORBIDDEN' },
                { status: 403 }
            );
        }

        // Get session and verify status
        const { data: session, error } = await supabase
            .from('sessions')
            .select('id, code, status')
            .eq('id', sessionId)
            .eq('tenant_id', userData.tenant_id)
            .single();

        if (error || !session) {
            return NextResponse.json(
                { error: 'Session non trouvée', code: 'SESSION_NOT_FOUND' },
                { status: 404 }
            );
        }

        // Can only regenerate code for draft sessions
        if (session.status !== 'draft') {
            return NextResponse.json(
                { error: 'Seules les sessions brouillon peuvent être modifiées', code: 'INVALID_STATUS' },
                { status: 400 }
            );
        }

        // Generate new unique code
        const adminClient = getAdminClient();
        const newCode = await generateUniqueCode(adminClient);

        // Update session with new code
        const { error: updateError } = await adminClient
            .from('sessions')
            .update({ code: newCode })
            .eq('id', sessionId);

        if (updateError) {
            console.error('Error updating session code:', updateError);
            return NextResponse.json(
                { error: 'Erreur lors de la mise à jour', code: 'UPDATE_ERROR' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            code: newCode,
            displayCode: formatCodeForDisplay(newCode),
        });
    } catch (error) {
        console.error('Error regenerating session code:', error);
        return NextResponse.json(
            { error: 'Erreur serveur', code: 'INTERNAL_ERROR' },
            { status: 500 }
        );
    }
}
