/**
 * Turn Resolve API Route
 * 
 * @module app/api/game/[sessionId]/turns/[turnNumber]/resolve/route
 * @description GET current turn state, POST to resolve turn (US-014)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getLatestState, loadTurnState, saveTurnState, StateNotFoundError, StateAlreadyExistsError } from '@/lib/services/game-state.service';
import { TurnStateInput } from '@/types/game-state';
import { DelayedEffect, createEmptyEffectsQueue, GameSpeed } from '@/lib/engine/effects-types';
import { createDelayedEffect } from '@/lib/engine/delayed-effects';

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
                // For turn 1, try to get existing state (if any)
                turnState = await getLatestState(supabase, sessionId);
            } else {
                // For other turns, load the specific state for this turn
                turnState = await loadTurnState(supabase, sessionId, turnNumber);
            }
        } catch (error) {
            if (!(error instanceof StateNotFoundError)) {
                throw error;
            }
            // No state found - will use default state on client (or should use previous turn?)
            // If we are on Turn 2 and State 2 doesn't exist, we might want State 1 to display "previous"?
            // But TurnPage expects "currentState". 

            // Fallback: If turn > 1 and state missing, try loading previous turn to show SOMETHING?
            // Actually, if State N is missing, it usually means we shouldn't be here or it needs generation.
            // For now, returning null lets the client handle defaults.
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
                config: session.config, // Send full config including gameSpeed
            },
            turnState: turnState ? {
                turnNumber: turnState.turn_number,
                indices: turnState.indices,
                pnl: turnState.pnl,
                decisions: turnState.decisions,
                events: turnState.events,
                portfolio: turnState.portfolio,
                delayedEffects: turnState.delayed_effects?.pending || [],
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
    console.log('[API] POST resolve started');
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

        // Get previous state (Current turn state)
        // If resolving Turn 1, we need State 1 (or 0/Initial).
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

        // Handle delayed effects queue
        const previousEffectsQueue = previousState?.delayed_effects || createEmptyEffectsQueue();
        const nextEffectsQueue = {
            pending: [...previousEffectsQueue.pending],
            applied: [...previousEffectsQueue.applied], // Keep history
        };

        // 1. Process new decisions to create effects
        console.log('[API] Processing decisions:', decisions.length);

        // Uses French speed as defined in effects-types
        const gameSpeed = (session.config?.speed as GameSpeed) || 'moyenne';
        console.log('[API] Game speed:', gameSpeed);

        // Domain-to-index mappings with impact configuration
        // Each domain affects specific indices with different impact ranges
        const domainConfig: Record<string, {
            targetIndex: string;
            secondaryIndex?: string;
            impactMultiplier: number;
            description: string
        }> = {
            rh: { targetIndex: 'IERH', secondaryIndex: 'IPQO', impactMultiplier: 0.15, description: 'Amélioration RH' },
            it: { targetIndex: 'IMD', secondaryIndex: 'IPQO', impactMultiplier: 0.12, description: 'Maturité Data/IT' },
            marketing: { targetIndex: 'IAC', impactMultiplier: 0.20, description: 'Attractivité commerciale' },
            tarif: { targetIndex: 'IAC', secondaryIndex: 'IPP', impactMultiplier: 0.25, description: 'Impact P&L' },
            reputation: { targetIndex: 'IAC', secondaryIndex: 'IS', impactMultiplier: 0.10, description: 'Image de marque' },
            prevention: { targetIndex: 'IS', secondaryIndex: 'IRF', impactMultiplier: 0.08, description: 'Sincérité/Conformité' },
            sinistres: { targetIndex: 'IPQO', secondaryIndex: 'IS', impactMultiplier: 0.18, description: 'Gestion sinistres' },
        };

        // Lever ID to domain mapping (extended)
        const getLeverDomain = (leverId: string): string | null => {
            if (leverId.startsWith('LEV-RH')) return 'rh';
            if (leverId.startsWith('LEV-IT')) return 'it';
            if (leverId.startsWith('LEV-DIST') || leverId.startsWith('LEV-MKT')) return 'marketing';
            if (leverId.startsWith('LEV-TAR')) return 'tarif';
            if (leverId.startsWith('LEV-REP')) return 'reputation';
            if (leverId.startsWith('LEV-PREV')) return 'prevention';
            if (leverId.startsWith('LEV-SIN')) return 'sinistres';
            return null;
        };

        // Track immediate effects per index (for non-delayed levers like tarif)
        const immediateEffects: Record<string, number> = {};
        Object.keys(currentIndices).forEach(key => { immediateEffects[key] = 0; });

        for (const decision of decisions) {
            try {
                const domain = getLeverDomain(decision.leverId);
                if (domain) {
                    const config = domainConfig[domain];
                    const decisionValue = typeof decision.value === 'number' ? decision.value : 0;

                    // Calculate effect value based on lever value and domain multiplier
                    const effectValue = decisionValue * config.impactMultiplier;

                    console.log(`[API] Processing ${decision.leverId} (domain: ${domain}) -> ${config.targetIndex} effect: ${effectValue.toFixed(2)}`);

                    // Tarif domain has immediate effect (delay 0)
                    if (domain === 'tarif') {
                        // Immediate effects on IAC and IPP
                        immediateEffects[config.targetIndex] = (immediateEffects[config.targetIndex] || 0) + effectValue;
                        if (config.secondaryIndex) {
                            immediateEffects[config.secondaryIndex] = (immediateEffects[config.secondaryIndex] || 0) + effectValue * 0.5;
                        }
                    } else {
                        // Create delayed effect for other domains
                        const newEffect = createDelayedEffect({
                            decisionId: decision.leverId,
                            domain: domain as any,
                            targetIndex: config.targetIndex as any,
                            value: effectValue,
                            currentTurn: turnNumber,
                            speed: gameSpeed,
                            description: config.description,
                        });

                        if (newEffect) {
                            nextEffectsQueue.pending.push(newEffect);
                            console.log(`[API] Created delayed effect: ${newEffect.id} -> ${config.targetIndex} +${effectValue.toFixed(2)} at turn ${newEffect.appliesAtTurn}`);
                        }

                        // Create secondary effect if applicable (with reduced value)
                        if (config.secondaryIndex) {
                            const secondaryEffect = createDelayedEffect({
                                decisionId: `${decision.leverId}-secondary`,
                                domain: domain as any,
                                targetIndex: config.secondaryIndex as any,
                                value: effectValue * 0.4, // Secondary effect is 40% of primary
                                currentTurn: turnNumber,
                                speed: gameSpeed,
                                description: `${config.description} (secondaire)`,
                            });
                            if (secondaryEffect) {
                                nextEffectsQueue.pending.push(secondaryEffect);
                            }
                        }
                    }
                }
            } catch (err) {
                console.error('[API] Error creating effect:', err);
            }
        }

        console.log('[API] Effects queue size:', nextEffectsQueue.pending.length);

        // 2. Apply effects that are now due (appliesAtTurn === turnNumber + 1, since we're calculating for next turn)
        const nextTurn = turnNumber + 1;
        const effectsToApply = nextEffectsQueue.pending.filter(e => e.appliesAtTurn === nextTurn && !e.isApplied);
        const pendingAfterApplication = nextEffectsQueue.pending.filter(e => e.appliesAtTurn !== nextTurn || e.isApplied);

        // Apply mature delayed effects
        const delayedEffectsByIndex: Record<string, number> = {};
        for (const effect of effectsToApply) {
            const targetIndex = effect.targetIndex;
            delayedEffectsByIndex[targetIndex] = (delayedEffectsByIndex[targetIndex] || 0) + effect.value;
            console.log(`[API] Applying delayed effect: ${effect.id} -> ${targetIndex} +${effect.value.toFixed(2)}`);
        }

        // Mark applied effects
        const appliedEffects = effectsToApply.map(e => ({ ...e, isApplied: true }));
        nextEffectsQueue.pending = pendingAfterApplication;
        nextEffectsQueue.applied = [...nextEffectsQueue.applied, ...appliedEffects];

        // Add small market variation for realism (±1.5 max, not affecting all indices equally)
        const random = seed ? Math.sin(seed) * 10000 - Math.floor(Math.sin(seed) * 10000) : Math.random();
        const marketVariations: Record<string, number> = {
            IAC: (random - 0.5) * 1.5,
            IPQO: (Math.sin(random * 100) * 0.5) * 1.5,
            IERH: (Math.cos(random * 50) * 0.5) * 1.5,
            IRF: (random - 0.5) * 1.0,
            IMD: (Math.sin(random * 200) * 0.5) * 1.5,
            IS: (random - 0.5) * 0.8,
            IPP: (Math.cos(random * 150) * 0.5) * 2.0,
        };

        // Calculate new indices with differentiated effects
        const nextIndices: Record<string, number> = {};
        for (const [key, value] of Object.entries(currentIndices)) {
            const immediate = immediateEffects[key] || 0;
            const delayed = delayedEffectsByIndex[key] || 0;
            const market = marketVariations[key] || 0;
            const totalEffect = immediate + delayed + market;

            nextIndices[key] = Math.max(0, Math.min(100, (value as number) + totalEffect));

            if (Math.abs(totalEffect) > 0.01) {
                console.log(`[API] ${key}: ${(value as number).toFixed(1)} -> ${nextIndices[key].toFixed(1)} (imm: ${immediate.toFixed(2)}, del: ${delayed.toFixed(2)}, mkt: ${market.toFixed(2)})`);
            }
        }

        // Calculate P&L change based on IPP effect and tarif decisions
        const ippEffect = (immediateEffects['IPP'] || 0) + (delayedEffectsByIndex['IPP'] || 0);
        const pnlChange = ippEffect * 50_000 + (random - 0.5) * 100_000; // Effect-based + small market variation
        const nextPnl = {
            primes: currentPnl.primes + pnlChange * 0.5,
            sinistres: currentPnl.sinistres + pnlChange * 0.3,
            frais: currentPnl.frais + pnlChange * 0.1,
            produits_financiers: currentPnl.produits_financiers + pnlChange * 0.05,
            resultat: currentPnl.resultat + pnlChange * 0.05,
        };

        // Prepare new state
        const nextTurnNumber = turnNumber + 1;
        const nextStateInput: TurnStateInput = {
            session_id: sessionId,
            turn_number: nextTurnNumber,
            timestamp: new Date().toISOString(),
            indices: nextIndices as any, // Cast to match schema strictness if needed
            pnl: nextPnl,
            decisions: decisions.map((d: any) => ({
                lever_id: d.leverId,
                value: d.value,
                product_id: d.productId === 'auto' || d.productId === 'mrh' ? d.productId : undefined,
                timestamp: new Date().toISOString()
            })),
            events: [], // No events in this simple sim
            portfolio: {}, // Empty for now
            delayed_effects: nextEffectsQueue,
        };

        // SAVE STATE
        console.log('[API] Saving turn state:', nextTurnNumber);
        await saveTurnState(supabase, sessionId, nextTurnNumber, nextStateInput);
        console.log('[API] State saved successfully');

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
            .update({ current_turn: nextTurnNumber })
            .eq('id', sessionId);

        return NextResponse.json({
            success: true,
            nextState: {
                turnNumber: nextTurnNumber,
                indices: nextIndices,
                pnl: nextPnl,
                delayedEffects: nextEffectsQueue.pending,
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
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Erreur lors de la résolution'
        }, { status: 500 });
    }
}
