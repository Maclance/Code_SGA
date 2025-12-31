/**
 * Turn Resolution API Route
 * 
 * @module app/api/game/[sessionId]/turns/[turnNumber]/resolve
 * @description POST endpoint for turn resolution (US-014)
 * 
 * Accepts player decisions, calculates new state using engine,
 * and returns feedback about major variations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resolveTurn, TurnResolutionError } from '@/lib/services/turn.service';
import { z } from 'zod';

// ============================================
// VALIDATION SCHEMAS
// ============================================

const DecisionSchema = z.object({
    leverId: z.string().min(1),
    value: z.union([z.number(), z.string(), z.boolean()]),
    productId: z.enum(['auto', 'mrh', 'pj', 'gav']).optional(),
});

const ResolveTurnRequestSchema = z.object({
    decisions: z.array(DecisionSchema),
    seed: z.number().int().optional().default(Date.now()),
});

// ============================================
// ROUTE HANDLERS
// ============================================

interface RouteParams {
    params: Promise<{
        sessionId: string;
        turnNumber: string;
    }>;
}

/**
 * POST /api/game/[sessionId]/turns/[turnNumber]/resolve
 * 
 * Resolve a turn by applying decisions and calculating new state
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { sessionId, turnNumber: turnNumberStr } = await params;
        const turnNumber = parseInt(turnNumberStr, 10);

        // Validate turn number
        if (isNaN(turnNumber) || turnNumber < 1) {
            return NextResponse.json(
                { error: 'Invalid turn number', code: 'INVALID_TURN_NUMBER' },
                { status: 400 }
            );
        }

        // Auth check
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized', code: 'UNAUTHORIZED' },
                { status: 401 }
            );
        }

        // Get session to verify access and get tenant
        const { data: session, error: sessionError } = await supabase
            .from('sessions')
            .select('*, tenant:tenants!inner(id)')
            .eq('id', sessionId)
            .single();

        if (sessionError || !session) {
            return NextResponse.json(
                { error: 'Session not found', code: 'SESSION_NOT_FOUND' },
                { status: 404 }
            );
        }

        // Verify session is running
        if (session.status !== 'running') {
            return NextResponse.json(
                { error: 'Session is not running', code: 'SESSION_NOT_RUNNING' },
                { status: 400 }
            );
        }

        // Verify turn number matches current turn
        if (turnNumber !== session.current_turn) {
            return NextResponse.json(
                {
                    error: `Expected turn ${session.current_turn}, got ${turnNumber}`,
                    code: 'TURN_MISMATCH'
                },
                { status: 400 }
            );
        }

        // Parse and validate request body
        const body = await request.json();
        const parseResult = ResolveTurnRequestSchema.safeParse(body);

        if (!parseResult.success) {
            return NextResponse.json(
                {
                    error: 'Invalid request body',
                    code: 'VALIDATION_ERROR',
                    details: parseResult.error.flatten()
                },
                { status: 400 }
            );
        }

        const { decisions, seed } = parseResult.data;

        // Resolve turn
        const result = await resolveTurn(
            supabase,
            {
                sessionId,
                turnNumber,
                decisions,
                seed,
            },
            session.tenant_id,
            user.id
        );

        // Update session current_turn
        const nextTurn = turnNumber + 1;
        const isComplete = nextTurn > session.max_turns;

        await supabase
            .from('sessions')
            .update({
                current_turn: nextTurn,
                status: isComplete ? 'ended' : 'running',
                ended_at: isComplete ? new Date().toISOString() : null,
                updated_at: new Date().toISOString(),
            })
            .eq('id', sessionId);

        // Return result
        return NextResponse.json({
            success: true,
            nextState: result.nextState,
            feedback: result.feedback,
            isComplete,
        });

    } catch (error) {
        console.error('Turn resolution error:', error);

        if (error instanceof TurnResolutionError) {
            return NextResponse.json(
                { error: error.message, code: error.code },
                { status: error.statusCode }
            );
        }

        return NextResponse.json(
            { error: 'Internal server error', code: 'INTERNAL_ERROR' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/game/[sessionId]/turns/[turnNumber]/resolve
 * 
 * Get current turn state (useful for resuming)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { sessionId, turnNumber: turnNumberStr } = await params;
        const turnNumber = parseInt(turnNumberStr, 10);

        // Auth check
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized', code: 'UNAUTHORIZED' },
                { status: 401 }
            );
        }

        // Get session
        const { data: session, error: sessionError } = await supabase
            .from('sessions')
            .select('*')
            .eq('id', sessionId)
            .single();

        if (sessionError || !session) {
            return NextResponse.json(
                { error: 'Session not found', code: 'SESSION_NOT_FOUND' },
                { status: 404 }
            );
        }

        // Get previous turn state (to show current indices at start of this turn)
        // For turn N, we load the state saved after turn N-1
        const previousTurnNumber = turnNumber - 1;

        let turnState = null;

        if (previousTurnNumber >= 1) {
            const { data: gameState } = await supabase
                .from('game_states')
                .select('*')
                .eq('session_id', sessionId)
                .eq('turn_number', previousTurnNumber)
                .single();

            if (gameState?.state) {
                turnState = gameState.state;
            }
        }

        return NextResponse.json({
            session: {
                id: session.id,
                name: session.name,
                status: session.status,
                currentTurn: session.current_turn,
                maxTurns: session.max_turns,
                config: session.config,
            },
            turnState,
        });

    } catch (error) {
        console.error('Get turn state error:', error);
        return NextResponse.json(
            { error: 'Internal server error', code: 'INTERNAL_ERROR' },
            { status: 500 }
        );
    }
}
