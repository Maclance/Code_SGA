/**
 * Turn Resolve API Route
 * 
 * @module app/api/game/[sessionId]/turns/[turnNumber]/resolve/route
 * @description GET current turn state, POST to resolve turn (US-014)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getLatestState, loadTurnState, StateNotFoundError } from '@/lib/services/game-state.service';

interface RouteParams {
    params: Promise<{
        sessionId: string;
        turnNumber: string;
    }>;
}

/**
 * GET /api/game/[sessionId]/turns/[turnNumber]/resolve
 * Load turn state and session info for the game page
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { sessionId, turnNumber: turnNumberStr } = await params;
    const turnNumber = parseInt(turnNumberStr, 10);
    const supabase = await createClient();

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    try {
        // Get session info
        const { data: session, error: sessionError } = await supabase
            .from('sessions')
            .select('id, name, status, config, current_turn, max_turns, engine_version')
            .eq('id', sessionId)
            .single();

        if (sessionError || !session) {
            return NextResponse.json({ error: 'Session non trouvée' }, { status: 404 });
        }

        // Try to get turn state from DB
        let turnState = null;
        try {
            if (turnNumber === 1) {
                // For turn 1, first try to get existing state, otherwise use defaults
                turnState = await getLatestState(supabase, sessionId);
            } else {
                // For other turns, load previous turn's state
                turnState = await loadTurnState(supabase, sessionId, turnNumber - 1);
            }
        } catch (error) {
            if (!(error instanceof StateNotFoundError)) {
                throw error;
            }
            // No state found - will use default state on client
        }

        return NextResponse.json({
            session: {
                id: session.id,
                name: session.name,
                status: session.status,
                currentTurn: session.current_turn,
                maxTurns: session.max_turns,
                engineVersion: session.engine_version,
                products: session.config?.products || ['auto', 'mrh'],
            },
            turnState: turnState ? {
                turnNumber: turnState.turn_number,
                indices: turnState.indices,
                pnl: turnState.pnl,
                decisions: turnState.decisions,
                events: turnState.events,
                portfolio: turnState.portfolio,
            } : null,
        });
    } catch (error) {
        console.error('Error loading turn data:', error);
        return NextResponse.json({ error: 'Erreur lors du chargement' }, { status: 500 });
    }
}

/**
 * POST /api/game/[sessionId]/turns/[turnNumber]/resolve
 * Resolve turn with decisions and calculate next state
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
    const { sessionId, turnNumber: turnNumberStr } = await params;
    const turnNumber = parseInt(turnNumberStr, 10);
    const supabase = await createClient();

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Parse body
    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
    }

    const { decisions = [], seed } = body;

    try {
        // Get session info
        const { data: session, error: sessionError } = await supabase
            .from('sessions')
            .select('*')
            .eq('id', sessionId)
            .single();

        if (sessionError || !session) {
            return NextResponse.json({ error: 'Session non trouvée' }, { status: 404 });
        }

        // Verify session is running
        if (session.status !== 'running' && session.status !== 'ready') {
            return NextResponse.json({
                error: 'Session non active'
            }, { status: 400 });
        }

        // Get previous state or use default for turn 1
        let previousState = null;
        try {
            previousState = await getLatestState(supabase, sessionId);
        } catch (error) {
            if (!(error instanceof StateNotFoundError)) {
                throw error;
            }
        }

        // Default initial indices if no previous state
        const defaultIndices = {
            IAC: 60, IPQO: 60, IERH: 60, IRF: 60, IMD: 45, IS: 70, IPP: 55
        };
        const defaultPnl = {
            primes: 50_000_000,
            sinistres: 32_500_000,
            frais: 12_500_000,
            produits_financiers: 1_500_000,
            resultat: 6_500_000,
        };

        const currentIndices = previousState?.indices || defaultIndices;
        const currentPnl = previousState?.pnl || defaultPnl;

        // Simple simulation: apply a small random variation based on decisions
        // This is a placeholder - real engine would use full simulation
        const random = seed ? Math.sin(seed) * 10000 - Math.floor(Math.sin(seed) * 10000) : Math.random();
        const variation = (random - 0.5) * 5; // -2.5 to +2.5

        const nextIndices: Record<string, number> = {};
        for (const [key, value] of Object.entries(currentIndices)) {
            const decisionEffect = decisions.length * 0.5; // More decisions = slightly better
            nextIndices[key] = Math.max(0, Math.min(100, (value as number) + variation + decisionEffect));
        }

        const pnlChange = variation * 100_000;
        const nextPnl = {
            primes: currentPnl.primes + pnlChange * 0.5,
            sinistres: currentPnl.sinistres + pnlChange * 0.3,
            frais: currentPnl.frais + pnlChange * 0.1,
            produits_financiers: currentPnl.produits_financiers + pnlChange * 0.05,
            resultat: currentPnl.resultat + pnlChange * 0.05,
        };

        // Calculate feedback
        const currentIndicesRecord = currentIndices as unknown as Record<string, number>;
        const majorVariations = Object.entries(nextIndices)
            .filter(([key]) => Math.abs(nextIndices[key] - (currentIndicesRecord[key] || 0)) > 2)
            .map(([key, value]) => ({
                index: key,
                delta: value - (currentIndicesRecord[key] || 0),
                previousValue: currentIndicesRecord[key] || 0,
                newValue: value,
                drivers: decisions.length > 0 ? ['Décisions stratégiques'] : ['Variation marché'],
            }));

        const indicesImproved = Object.entries(nextIndices).filter(
            ([key, value]) => value > (currentIndicesRecord[key] || 0)
        ).length;
        const indicesDegraded = Object.entries(nextIndices).filter(
            ([key, value]) => value < (currentIndicesRecord[key] || 0)
        ).length;

        // Update session current_turn
        await supabase
            .from('sessions')
            .update({ current_turn: turnNumber })
            .eq('id', sessionId);

        return NextResponse.json({
            success: true,
            nextState: {
                turnNumber,
                indices: nextIndices,
                pnl: nextPnl,
            },
            feedback: {
                majorVariations,
                summary: {
                    decisionsApplied: decisions.length,
                    indicesImproved,
                    indicesDegraded,
                    pnlChange: nextPnl.resultat - currentPnl.resultat,
                },
            },
        });
    } catch (error) {
        console.error('Error resolving turn:', error);
        return NextResponse.json({ error: 'Erreur lors de la résolution' }, { status: 500 });
    }
}
