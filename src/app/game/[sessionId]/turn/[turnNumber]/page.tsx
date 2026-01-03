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
// Enriched Dashboard Components (US-030)
import {
    ProductGrid,
    IndexGauge,
    PnLChart,
    EffectifRepartition,
    AlertBadges,
    createEffectifSegments,
} from '@/components/game/dashboard';
import {
    INDEX_IDS,
    INDEX_LABELS,
    getDashboardConfig,
    generateAlerts,
    DEFAULT_ALERT_THRESHOLDS,
    PRODUCT_NAMES,
    type ProductDisplayMetrics,
    type DashboardAlert,
} from '@/lib/engine';
import { EventsScreen } from '@/components/game/events';
import type { GameEvent } from '@/lib/engine';
import { DecisionsScreen, type SelectedDecision } from '@/components/game/decisions/DecisionsScreen';
import { ResolutionScreen } from '@/components/game/ResolutionScreen';
import { FeedbackScreen } from '@/components/game/FeedbackScreen';
import { EffectTimeline } from '@/components/game/EffectTimeline';
import { type GameSpeed } from '@/lib/engine/config/delay-config';
import type { DelayedEffect, DelayedEffectDisplay } from '@/lib/engine/effects-types';
import { toEffectDisplay } from '@/lib/services/delayed-effects.service';
import type { EffectDomain, IndexId } from '@/lib/engine/effects-types';

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

interface PendingDecision extends SelectedDecision {
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
                    domain: domain as EffectDomain,
                    targetIndex: config.targetIndex as IndexId,
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
            // Transform decisions to include default value if not provided
            const decisionsWithValues = pendingDecisions.map(d => ({
                leverId: d.leverId,
                value: d.value ?? 50, // Default value for lever activation
                productId: d.productId,
            }));

            const response = await fetch(`/api/game/${sessionId}/turns/${turnNumber}/resolve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    decisions: decisionsWithValues,
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
                {phase === TurnPhase.DASHBOARD && currentState && (() => {
                    // Prepare data for enriched dashboard
                    const difficulty = 'intermediaire' as const;
                    const config = getDashboardConfig(difficulty);

                    // Mock product metrics (would come from game state)
                    const productMetrics: ProductDisplayMetrics[] = [
                        {
                            productId: 'auto',
                            productName: PRODUCT_NAMES.auto,
                            nbContrats: 45000,
                            primesCollectees: currentState.pnl.primes * 0.65,
                            stockSinistres: 2100,
                            fluxEntrees: 180,
                            fluxSorties: 165,
                            frequence: 7.2,
                            coutMoyen: 2800,
                        },
                        {
                            productId: 'mrh',
                            productName: PRODUCT_NAMES.mrh,
                            nbContrats: 32000,
                            primesCollectees: currentState.pnl.primes * 0.35,
                            stockSinistres: 1200,
                            fluxEntrees: 95,
                            fluxSorties: 88,
                            frequence: 4.8,
                            coutMoyen: 3500,
                        },
                    ];

                    // Generate alerts
                    const alerts: DashboardAlert[] = generateAlerts(
                        currentState.indices as unknown as import('@/types/game-state').IndicesSnapshot,
                        3000,
                        3300,
                        DEFAULT_ALERT_THRESHOLDS
                    );

                    // Effectifs
                    const effectifSegments = createEffectifSegments(100, 80, 30, 40);
                    const totalEffectifs = 250;

                    // P&L delta
                    const previousResultat = previousState?.pnl.resultat ?? currentState.pnl.resultat;
                    const pnlDeltaPercent = previousResultat !== 0
                        ? ((currentState.pnl.resultat - previousResultat) / Math.abs(previousResultat)) * 100
                        : 0;

                    return (
                        <div className={styles.enrichedDashboard}>
                            {/* Alerts Section */}
                            {config.showAlerts && alerts.length > 0 && (
                                <section className={styles.dashboardSection}>
                                    <h3 className={styles.dashboardSectionTitle}>🚨 Alertes</h3>
                                    <AlertBadges alerts={alerts} maxVisible={3} />
                                </section>
                            )}

                            {/* Indices Grid */}
                            <section className={styles.dashboardSection}>
                                <h3 className={styles.dashboardSectionTitle}>📈 Indices Stratégiques</h3>
                                <div className={styles.indicesGrid}>
                                    {INDEX_IDS.map((indexId) => (
                                        <IndexGauge
                                            key={indexId}
                                            indexId={indexId}
                                            label={INDEX_LABELS[indexId]}
                                            value={currentState.indices[indexId] ?? 50}
                                            previousValue={previousState?.indices[indexId]}
                                            variant="bar"
                                        />
                                    ))}
                                </div>
                            </section>

                            {/* Product Grid */}
                            <section className={styles.dashboardSection}>
                                <h3 className={styles.dashboardSectionTitle}>📦 Indicateurs par Produit</h3>
                                <ProductGrid
                                    products={productMetrics}
                                    difficulty={difficulty}
                                />
                            </section>

                            {/* Bottom Row: P&L + Effectifs */}
                            <div className={styles.bottomRow}>
                                <section className={styles.halfSection}>
                                    <PnLChart
                                        primes={currentState.pnl.primes}
                                        sinistres={currentState.pnl.sinistres}
                                        frais={currentState.pnl.frais}
                                        produits_financiers={currentState.pnl.produits_financiers}
                                        resultat={currentState.pnl.resultat}
                                        deltaPercent={pnlDeltaPercent}
                                    />
                                </section>

                                <section className={styles.halfSection}>
                                    <EffectifRepartition
                                        segments={effectifSegments}
                                        total={totalEffectifs}
                                    />
                                </section>
                            </div>

                            {/* Continue Button */}
                            <div className={styles.continueActions}>
                                <button className={styles.continueBtn} onClick={handleNextPhase}>
                                    Voir les événements →
                                </button>
                            </div>
                        </div>
                    );
                })()}

                {phase === TurnPhase.EVENTS && (() => {
                    // Sample events with narratives (US-033)
                    const events: GameEvent[] = [
                        {
                            id: 'EVT-CYB-01',
                            type: 'company',
                            category: 'CYBER',
                            name: 'Cyberattaque Détectée',
                            severity: 'critical',
                            impacts: [
                                { target: 'IPQO', value: -15, type: 'absolute' },
                                { target: 'IMD', value: -10, type: 'absolute' },
                            ],
                            duration: 2,
                            timestamp: new Date().toISOString(),
                            turnTriggered: turnNumber,
                        },
                        {
                            id: 'EVT-INF-01',
                            type: 'market',
                            category: 'ECONOMIQUE',
                            name: 'Inflation Persistante',
                            severity: 'medium',
                            impacts: [
                                { target: 'IPP', value: -3, type: 'absolute' },
                                { target: 'IS', value: -2, type: 'absolute' },
                            ],
                            duration: 4,
                            timestamp: new Date(Date.now() - 3600000).toISOString(),
                            turnTriggered: turnNumber,
                        },
                        {
                            id: 'EVT-CLI-01',
                            type: 'market',
                            category: 'CLIMAT',
                            name: 'Épisode Climatique',
                            severity: 'high',
                            impacts: [
                                { target: 'IPP', value: -5, type: 'absolute' },
                                { target: 'IRF', value: -3, type: 'absolute' },
                            ],
                            duration: 2,
                            timestamp: new Date(Date.now() - 7200000).toISOString(),
                            turnTriggered: turnNumber,
                        },
                    ];

                    return (
                        <EventsScreen
                            events={events}
                            currentTurn={turnNumber}
                            showFlash={true}
                            onContinue={handleNextPhase}
                        />
                    );
                })()}

                {phase === TurnPhase.DECISIONS && (
                    <DecisionsScreen
                        difficulty="novice"
                        selectedDecisions={pendingDecisions}
                        onDecisionsChange={(decisions) => handleDecisionChange(decisions.map(d => ({ ...d, productId: undefined })))}
                        onConfirm={handleResolve}
                        availableBudget={10}
                        currentTurn={turnNumber}
                        locale="fr"
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
