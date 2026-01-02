/**
 * Turn Page
 * 
 * @module app/game/[sessionId]/turn/[turnNumber]/page
 * @description Game turn page with phase-based rendering (US-014)
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { TurnPhase, nextPhase, PHASE_CONFIGS } from '@/lib/game/turn-machine';
import { TurnDashboard } from '@/components/game/TurnDashboard';
import { EventsPanel } from '@/components/game/EventsPanel';
import { DecisionsPanel } from '@/components/game/DecisionsPanel';
import { ResolutionScreen } from '@/components/game/ResolutionScreen';
import { FeedbackScreen } from '@/components/game/FeedbackScreen';
import { EffectTimeline } from '@/components/game/EffectTimeline';
import { type GameSpeed, toFrenchSpeed } from '@/lib/engine/config/delay-config';
import type { DelayedEffect, DelayedEffectDisplay } from '@/lib/engine/effects-types';
import { toEffectDisplay } from '@/lib/services/delayed-effects.service';
import { createDelayedEffect } from '@/lib/engine/delayed-effects';

interface PageProps {
    params: Promise<{
        sessionId: string;
        turnNumber: string;
    }>;
}

interface TurnState {
    indices: Record<string, number>;
    pnl: {
        primes: number;
        sinistres: number;
        frais: number;
        produits_financiers: number;
        resultat: number;
    };
    delayedEffects?: DelayedEffect[];
}

interface PendingDecision {
    leverId: string;
    value: number | string | boolean;
    productId?: string;
}

interface MajorVariation {
    index: string;
    delta: number;
    previousValue: number;
    newValue: number;
    drivers: string[];
}

interface Feedback {
    majorVariations: MajorVariation[];
    summary: {
        decisionsApplied: number;
        indicesImproved: number;
        indicesDegraded: number;
        pnlChange: number;
    };
}

export default function TurnPage({ params }: PageProps) {
    const router = useRouter();
    const [sessionId, setSessionId] = useState<string>('');
    const [turnNumber, setTurnNumber] = useState<number>(1);
    const [phase, setPhase] = useState<TurnPhase>(TurnPhase.DASHBOARD);
    const [currentState, setCurrentState] = useState<TurnState | null>(null);
    const [previousState, setPreviousState] = useState<TurnState | null>(null);
    const [pendingDecisions, setPendingDecisions] = useState<PendingDecision[]>([]);
    const [delayedEffectsDisplay, setDelayedEffectsDisplay] = useState<DelayedEffectDisplay[]>([]);
    const [feedback, setFeedback] = useState<Feedback | null>(null);
    const [loading, setLoading] = useState(true);
    const [resolving, setResolving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [maxTurns, setMaxTurns] = useState<number>(12);
    const [sessionName, setSessionName] = useState<string>('');
    const [gameSpeed, setGameSpeed] = useState<GameSpeed>('medium');

    // Load params
    useEffect(() => {
        params.then(({ sessionId: sid, turnNumber: tn }) => {
            setSessionId(sid);
            setTurnNumber(parseInt(tn, 10));
        });
    }, [params]);

    // Load session and turn data
    useEffect(() => {
        if (!sessionId || turnNumber < 1) return;

        const loadData = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/game/${sessionId}/turns/${turnNumber}/resolve`);
                const data = await response.json();

                if (data.session) {
                    setMaxTurns(data.session.maxTurns || 12);
                    setSessionName(data.session.name || 'Partie en cours');
                    // Extract game speed from config if available
                    if (data.session.config?.gameSpeed) {
                        setGameSpeed(data.session.config.gameSpeed as GameSpeed);
                    }
                }

                if (data.turnState) {
                    setCurrentState({
                        indices: data.turnState.indices,
                        pnl: data.turnState.pnl,
                    });
                    setPreviousState({
                        indices: data.turnState.indices,
                        pnl: data.turnState.pnl,
                    });

                    if (data.turnState.delayedEffects) {
                        const displays = (data.turnState.delayedEffects as DelayedEffect[])
                            .map(e => toEffectDisplay(e, turnNumber));
                        setDelayedEffectsDisplay(displays);
                    } else {
                        setDelayedEffectsDisplay([]);
                    }
                } else {
                    // Default initial state for turn 1
                    const defaultState: TurnState = {
                        indices: {
                            IAC: 60, IPQO: 60, IERH: 60, IRF: 60, IMD: 45, IS: 70, IPP: 55
                        },
                        pnl: {
                            primes: 50_000_000,
                            sinistres: 32_500_000,
                            frais: 12_500_000,
                            produits_financiers: 1_500_000,
                            resultat: 6_500_000,
                        },
                    };
                    setCurrentState(defaultState);
                    setPreviousState(null);
                }
            } catch (err) {
                setError('Erreur lors du chargement des données');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [sessionId, turnNumber]);

    // Handle phase advancement
    const handleNextPhase = useCallback(() => {
        const next = nextPhase(phase);
        if (next) {
            setPhase(next);
        }
    }, [phase]);

    // Handle decision changes
    const handleDecisionChange = useCallback((decisions: PendingDecision[]) => {
        setPendingDecisions(decisions);
    }, []);

    // Combine persistent and preview effects for display
    const combinedEffectsDisplay = useMemo(() => {
        if (!currentState) return delayedEffectsDisplay;

        // Domain-to-index mappings based on indices.md documentation
        const domainConfig: Record<string, {
            targetIndex: string;
            delay: number;
            impact: { min: number; max: number };
            description: string;
        }> = {
            rh: { targetIndex: 'IERH', delay: 2, impact: { min: 3, max: 8 }, description: 'Amélioration RH' },
            it: { targetIndex: 'IMD', delay: 3, impact: { min: 2, max: 6 }, description: 'Maturité Data/IT' },
            marketing: { targetIndex: 'IAC', delay: 1, impact: { min: 4, max: 10 }, description: 'Attractivité commerciale' },
            tarif: { targetIndex: 'IPP', delay: 0, impact: { min: -8, max: 12 }, description: 'Impact P&L' },
            reputation: { targetIndex: 'IAC', delay: 1, impact: { min: 2, max: 7 }, description: 'Image de marque' },
            prevention: { targetIndex: 'IS', delay: 4, impact: { min: 1, max: 5 }, description: 'Sincérité/Conformité' },
        };

        // Create preview effects with stable IDs
        const previewEffects: DelayedEffectDisplay[] = pendingDecisions
            .map(d => {
                let domain: string | null = null;
                if (d.leverId.startsWith('LEV-RH')) domain = 'rh';
                else if (d.leverId.startsWith('LEV-IT')) domain = 'it';
                else if (d.leverId.startsWith('LEV-DIST')) domain = 'marketing';
                else if (d.leverId.startsWith('LEV-TAR')) domain = 'tarif';
                else if (d.leverId.startsWith('LEV-REP')) domain = 'reputation';
                else if (d.leverId.startsWith('LEV-PREV')) domain = 'prevention';

                if (!domain) return null;

                const config = domainConfig[domain];
                const expectedTurn = turnNumber + config.delay;
                const decisionValue = typeof d.value === 'number' ? d.value : 50;
                const intensity = decisionValue > 70 ? 'high' : decisionValue > 30 ? 'medium' : 'low';

                const previewDisplay: DelayedEffectDisplay = {
                    effectId: `preview-${d.leverId}`,
                    description: config.description,
                    domain: domain as any,
                    targetIndex: config.targetIndex as any,
                    expectedTurn: expectedTurn,
                    turnsRemaining: config.delay,
                    intensity: intensity as 'low' | 'medium' | 'high',
                    estimatedImpact: config.impact,
                };

                return previewDisplay;
            })
            .filter((e): e is DelayedEffectDisplay => e !== null);

        return [...delayedEffectsDisplay, ...previewEffects];
    }, [delayedEffectsDisplay, pendingDecisions, turnNumber, currentState]);

    // Handle turn resolution
    const handleResolve = useCallback(async () => {
        if (phase !== TurnPhase.DECISIONS) return;

        setPhase(TurnPhase.RESOLUTION);
        setResolving(true);
        setError(null);

        try {
            const response = await fetch(`/api/game/${sessionId}/turns/${turnNumber}/resolve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    decisions: pendingDecisions,
                    seed: Date.now(),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de la résolution');
            }

            // Update state with results
            setPreviousState(currentState);
            setCurrentState({
                indices: data.nextState.indices,
                pnl: data.nextState.pnl,
            });
            setFeedback(data.feedback);
            setPhase(TurnPhase.FEEDBACK);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur inconnue');
            setPhase(TurnPhase.DECISIONS);
        } finally {
            setResolving(false);
        }
    }, [phase, sessionId, turnNumber, pendingDecisions, currentState]);

    // Handle next turn navigation
    const handleNextTurn = useCallback(() => {
        const nextTurnNumber = turnNumber + 1;

        if (nextTurnNumber > maxTurns) {
            // Session complete - go to debrief
            router.push(`/game/${sessionId}/debrief`);
        } else {
            // Go to next turn
            router.push(`/game/${sessionId}/turn/${nextTurnNumber}`);
        }
    }, [turnNumber, maxTurns, sessionId, router]);

    // Loading state
    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Chargement du tour...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error && !resolving) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>
                    <h2>❌ Erreur</h2>
                    <p>{error}</p>
                    <button onClick={() => setError(null)} className={styles.retryBtn}>
                        Réessayer
                    </button>
                </div>
            </div>
        );
    }

    const phaseConfig = PHASE_CONFIGS[phase];
    const isFinalTurn = turnNumber >= maxTurns;

    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerInfo}>
                    <h1 className={styles.title}>{sessionName}</h1>
                    <span className={styles.turnBadge}>
                        Tour {turnNumber} / {maxTurns}
                    </span>
                </div>
                <div className={styles.phaseIndicator}>
                    {PHASE_CONFIGS[TurnPhase.DASHBOARD].name}
                    {phase !== TurnPhase.DASHBOARD && ' → '}
                    {phase !== TurnPhase.DASHBOARD && PHASE_CONFIGS[TurnPhase.EVENTS].name}
                    {[TurnPhase.DECISIONS, TurnPhase.RESOLUTION, TurnPhase.FEEDBACK].includes(phase) && ' → '}
                    {[TurnPhase.DECISIONS, TurnPhase.RESOLUTION, TurnPhase.FEEDBACK].includes(phase) && PHASE_CONFIGS[TurnPhase.DECISIONS].name}
                    {[TurnPhase.RESOLUTION, TurnPhase.FEEDBACK].includes(phase) && ' → '}
                    {[TurnPhase.RESOLUTION, TurnPhase.FEEDBACK].includes(phase) && PHASE_CONFIGS[TurnPhase.RESOLUTION].name}
                    {phase === TurnPhase.FEEDBACK && ' → '}
                    {phase === TurnPhase.FEEDBACK && PHASE_CONFIGS[TurnPhase.FEEDBACK].name}
                </div>
            </header>

            {/* Phase name */}
            <div className={styles.phaseHeader}>
                <h2 className={styles.phaseName}>{phaseConfig.name}</h2>
                <p className={styles.phaseDesc}>{phaseConfig.description}</p>
            </div>

            {/* Main content based on phase */}
            <main className={styles.main}>
                {phase === TurnPhase.DASHBOARD && currentState && (
                    <TurnDashboard
                        indices={currentState.indices}
                        pnl={currentState.pnl}
                        previousIndices={previousState?.indices}
                        turnNumber={turnNumber}
                        onContinue={handleNextPhase}
                    />
                )}

                {phase === TurnPhase.EVENTS && (
                    <EventsPanel
                        events={[]} // Events would come from turn state
                        turnNumber={turnNumber}
                        onContinue={handleNextPhase}
                    />
                )}

                {phase === TurnPhase.DECISIONS && (
                    <DecisionsPanel
                        decisions={pendingDecisions}
                        onDecisionsChange={handleDecisionChange}
                        onValidate={handleResolve}
                        gameSpeed={gameSpeed}
                        currentTurn={turnNumber}
                    />
                )}

                {phase === TurnPhase.RESOLUTION && (
                    <ResolutionScreen
                        isResolving={resolving}
                        error={error}
                    />
                )}

                {phase === TurnPhase.FEEDBACK && feedback && currentState && (
                    <FeedbackScreen
                        feedback={feedback}
                        currentState={currentState}
                        previousState={previousState}
                        isFinalTurn={isFinalTurn}
                        onNextTurn={handleNextTurn}
                    />
                )}
                {/* Effect Timeline (Persistent) */}
                <div style={{ marginTop: '2rem' }}>
                    <EffectTimeline
                        effects={combinedEffectsDisplay}
                        currentTurn={turnNumber}
                        locale="fr"
                    />
                </div>
            </main>
        </div>
    );
}
