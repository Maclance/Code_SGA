/**
 * Turn State API Routes
 * 
 * GET /api/sessions/[sessionId]/turns/[turnNumber] - Load turn state
 * POST /api/sessions/[sessionId]/turns/[turnNumber] - Save turn state
 * 
 * @module app/api/sessions/[sessionId]/turns/[turnNumber]
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
    loadTurnState,
    saveTurnState,
    GameStateError,
} from '@/lib/services/game-state.service';
import { TurnStateInputSchema } from '@/types/game-state';

interface RouteParams {
    params: Promise<{
        sessionId: string;
        turnNumber: string;
    }>;
}

/**
 * GET /api/sessions/[sessionId]/turns/[turnNumber]
 * Load a specific turn state with checksum validation
 */
export async function GET(
    request: Request,
    { params }: RouteParams
) {
    try {
        const { sessionId, turnNumber: turnNumberStr } = await params;
        const turnNumber = parseInt(turnNumberStr, 10);

        // Validate turnNumber
        if (isNaN(turnNumber) || turnNumber < 0) {
            return NextResponse.json(
                { error: 'Invalid turn number', code: 'INVALID_TURN_NUMBER' },
                { status: 400 }
            );
        }

        // Validate sessionId format (UUID)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(sessionId)) {
            return NextResponse.json(
                { error: 'Invalid session ID format', code: 'INVALID_SESSION_ID' },
                { status: 400 }
            );
        }

        const supabase = await createClient();
        const state = await loadTurnState(supabase, sessionId, turnNumber);

        return NextResponse.json({ state });

    } catch (error) {
        console.error('[GET /api/sessions/.../turns/...] Error:', error);

        if (error instanceof GameStateError) {
            return NextResponse.json(
                { error: error.message, code: error.code },
                { status: error.statusCode }
            );
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/sessions/[sessionId]/turns/[turnNumber]
 * Save a turn state (append-only - cannot overwrite existing)
 */
export async function POST(
    request: Request,
    { params }: RouteParams
) {
    try {
        const { sessionId, turnNumber: turnNumberStr } = await params;
        const turnNumber = parseInt(turnNumberStr, 10);

        // Validate turnNumber
        if (isNaN(turnNumber) || turnNumber < 0) {
            return NextResponse.json(
                { error: 'Invalid turn number', code: 'INVALID_TURN_NUMBER' },
                { status: 400 }
            );
        }

        // Validate sessionId format (UUID)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(sessionId)) {
            return NextResponse.json(
                { error: 'Invalid session ID format', code: 'INVALID_SESSION_ID' },
                { status: 400 }
            );
        }

        // Parse request body
        const body = await request.json();

        // Validate input schema
        const validation = TurnStateInputSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                {
                    error: 'Validation error',
                    code: 'VALIDATION_ERROR',
                    details: validation.error.issues.map(e => ({
                        field: e.path.join('.'),
                        message: e.message,
                    })),
                },
                { status: 400 }
            );
        }

        const supabase = await createClient();
        const state = await saveTurnState(
            supabase,
            sessionId,
            turnNumber,
            validation.data
        );

        return NextResponse.json(
            { state },
            { status: 201 }
        );

    } catch (error) {
        console.error('[POST /api/sessions/.../turns/...] Error:', error);

        if (error instanceof GameStateError) {
            return NextResponse.json(
                { error: error.message, code: error.code },
                { status: error.statusCode }
            );
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
