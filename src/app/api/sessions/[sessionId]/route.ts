/**
 * Session API Route
 * 
 * @module app/api/sessions/[sessionId]/route
 * @description PATCH endpoint for updating session (status, current_turn, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

interface RouteParams {
    params: Promise<{
        sessionId: string;
    }>;
}

// Validation schema for session update
const UpdateSessionSchema = z.object({
    status: z.enum(['draft', 'ready', 'running', 'paused', 'ended']).optional(),
    current_turn: z.number().int().min(0).optional(),
    started_at: z.string().optional(),
    ended_at: z.string().optional(),
    name: z.string().min(1).max(255).optional(),
}).partial();

/**
 * PATCH /api/sessions/[sessionId]
 * Update session fields (status, turn, etc.)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const { sessionId } = await params;
    const supabase = await createClient();

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Parse and validate body
    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
    }

    const parseResult = UpdateSessionSchema.safeParse(body);
    if (!parseResult.success) {
        return NextResponse.json({
            error: 'Données invalides',
            details: parseResult.error.flatten()
        }, { status: 400 });
    }

    const updateData = parseResult.data;

    // Check session exists and user has access
    const { data: session, error: fetchError } = await supabase
        .from('sessions')
        .select('id, tenant_id, created_by')
        .eq('id', sessionId)
        .single();

    if (fetchError || !session) {
        return NextResponse.json({ error: 'Session non trouvée' }, { status: 404 });
    }

    // Perform update
    const { data: updatedSession, error: updateError } = await supabase
        .from('sessions')
        .update(updateData)
        .eq('id', sessionId)
        .select()
        .single();

    if (updateError) {
        console.error('Error updating session:', updateError);
        return NextResponse.json({
            error: 'Erreur lors de la mise à jour'
        }, { status: 500 });
    }

    return NextResponse.json({
        success: true,
        session: updatedSession
    });
}

/**
 * GET /api/sessions/[sessionId]
 * Get session details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { sessionId } = await params;
    const supabase = await createClient();

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Fetch session
    const { data: session, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

    if (error || !session) {
        return NextResponse.json({ error: 'Session non trouvée' }, { status: 404 });
    }

    return NextResponse.json({ session });
}
