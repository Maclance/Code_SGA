/**
 * Enriched Dashboard Page
 *
 * @module app/game/[sessionId]/dashboard/page
 * @description Main enriched dashboard with product grid and indicators (US-030)
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from './page.module.css';

// Dashboard components
import {
    ProductGrid,
    IndexGauge,
    PnLChart,
    EffectifRepartition,
    AlertBadges,
    createEffectifSegments,
} from '@/components/game/dashboard';

// Engine types and functions
import type {
    IndicesState,
    ProductDisplayMetrics,
    DashboardAlert,
    Difficulty,
} from '@/lib/engine';
import {
    INDEX_IDS,
    INDEX_LABELS,
    getDashboardConfig,
    generateAlerts,
    DEFAULT_ALERT_THRESHOLDS,
    PRODUCT_NAMES,
} from '@/lib/engine';

// ============================================
// TYPES
// ============================================

interface DashboardState {
    isLoading: boolean;
    error: string | null;
    session: SessionData | null;
    gameState: GameStateData | null;
    previousGameState: GameStateData | null;
}

interface SessionData {
    id: string;
    name: string;
    status: string;
    current_turn: number;
    max_turns: number;
    config: {
        difficulty: Difficulty;
        speed: string;
        products: string[];
    };
}

interface GameStateData {
    indices: IndicesState;
    pnl: {
        primes: number;
        sinistres: number;
        frais: number;
        produits_financiers: number;
        resultat: number;
    };
    products: {
        auto?: ProductMetricsData;
        mrh?: ProductMetricsData;
    };
    effectifs: {
        sinistres: number;
        distribution: number;
        dataIT: number;
        support: number;
    };
}

interface ProductMetricsData {
    nbContrats: number;
    primesCollectees: number;
    stockSinistres: number;
    fluxEntrees?: number;
    fluxSorties?: number;
    frequence?: number;
    coutMoyen?: number;
}

// ============================================
// COMPONENT
// ============================================

export default function EnrichedDashboardPage() {
    const params = useParams();
    const router = useRouter();
    const sessionId = params.sessionId as string;

    const [state, setState] = useState<DashboardState>({
        isLoading: true,
        error: null,
        session: null,
        gameState: null,
        previousGameState: null,
    });

    // Load data on mount
    useEffect(() => {
        console.log('[Dashboard] loading', { sessionId });
        loadDashboardData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId]);

    async function loadDashboardData() {
        try {
            setState((s) => ({ ...s, isLoading: true, error: null }));

            // For now, use mock data directly since API is not yet implemented
            // TODO: Replace with actual API calls when /api/game/[sessionId] is available
            console.log('[Dashboard] Using mock data (API not yet implemented)');

            // Create mock session based on sessionId
            const mockSession: SessionData = {
                id: sessionId,
                name: 'Partie en cours',
                status: 'running',
                current_turn: 1,
                max_turns: 8,
                config: {
                    difficulty: 'intermediaire',
                    speed: 'moyenne',
                    products: ['auto', 'mrh'],
                },
            };

            setState((s) => ({
                ...s,
                isLoading: false,
                session: mockSession,
                gameState: createMockGameState(),
                previousGameState: createMockPreviousState(),
            }));

            console.log('[Dashboard] loaded with mock data');
        } catch (err) {
            console.error('[Dashboard] error', err);
            setState((s) => ({
                ...s,
                isLoading: false,
                error: err instanceof Error ? err.message : 'Unknown error',
            }));
        }
    }

    // Refresh data periodically
    useEffect(() => {
        if (state.session?.status !== 'running') return;

        const interval = setInterval(() => {
            console.log('[Dashboard] data refresh');
            loadDashboardData();
        }, 30000); // 30s refresh

        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.session?.status]);

    // Render loading state
    if (state.isLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner} />
                    <span>Chargement du tableau de bord...</span>
                </div>
            </div>
        );
    }

    // Render error state
    if (state.error) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>
                    <span className={styles.errorIcon}>⚠️</span>
                    <h2>Erreur de chargement</h2>
                    <p>{state.error}</p>
                    <button onClick={loadDashboardData} className={styles.retryButton}>
                        Réessayer
                    </button>
                </div>
            </div>
        );
    }

    // Render empty state
    if (!state.session || !state.gameState) {
        return (
            <div className={styles.container}>
                <div className={styles.empty}>
                    <span className={styles.emptyIcon}>📭</span>
                    <h2>Aucune donnée</h2>
                    <p>Les données de la partie n&apos;ont pas encore été initialisées.</p>
                </div>
            </div>
        );
    }

    const { session, gameState, previousGameState } = state;
    const difficulty = session.config.difficulty ?? 'novice';
    const config = getDashboardConfig(difficulty);

    // Prepare product display metrics
    const productMetrics: ProductDisplayMetrics[] = Object.entries(gameState.products)
        .filter(([, data]) => data !== undefined)
        .map(([productId, data]) => ({
            productId: productId as 'auto' | 'mrh',
            productName: PRODUCT_NAMES[productId as 'auto' | 'mrh'],
            nbContrats: data!.nbContrats,
            primesCollectees: data!.primesCollectees,
            stockSinistres: data!.stockSinistres,
            fluxEntrees: data!.fluxEntrees,
            fluxSorties: data!.fluxSorties,
            frequence: data!.frequence,
            coutMoyen: data!.coutMoyen,
        }));

    // Generate alerts
    const previousTotalStock = previousGameState
        ? Object.values(previousGameState.products).reduce(
            (sum, p) => sum + (p?.stockSinistres ?? 0),
            0
        )
        : 0;
    const currentTotalStock = Object.values(gameState.products).reduce(
        (sum, p) => sum + (p?.stockSinistres ?? 0),
        0
    );

    const alerts: DashboardAlert[] = generateAlerts(
        gameState.indices,
        previousTotalStock,
        currentTotalStock,
        DEFAULT_ALERT_THRESHOLDS
    );

    // Prepare effectifs segments
    const effectifSegments = createEffectifSegments(
        gameState.effectifs.sinistres,
        gameState.effectifs.distribution,
        gameState.effectifs.dataIT,
        gameState.effectifs.support
    );
    const totalEffectifs =
        gameState.effectifs.sinistres +
        gameState.effectifs.distribution +
        gameState.effectifs.dataIT +
        gameState.effectifs.support;

    // Calculate P&L delta
    const previousResultat = previousGameState?.pnl.resultat ?? gameState.pnl.resultat;
    const pnlDeltaPercent = previousResultat !== 0
        ? ((gameState.pnl.resultat - previousResultat) / Math.abs(previousResultat)) * 100
        : 0;

    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1 className={styles.title}>📊 Tableau de Bord</h1>
                    <span className={styles.turnBadge}>
                        Tour {session.current_turn}/{session.max_turns}
                    </span>
                </div>
                <div className={styles.headerRight}>
                    <span className={styles.difficultyBadge}>
                        {difficulty === 'novice' ? 'Novice' : 'Intermédiaire'}
                    </span>
                    <button
                        onClick={() => router.push(`/game/${sessionId}/turn/${session.current_turn}`)}
                        className={styles.actionButton}
                    >
                        ▶️ Continuer
                    </button>
                </div>
            </header>

            <main className={styles.main}>
                {/* Alerts Section */}
                {config.showAlerts && alerts.length > 0 && (
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>🚨 Alertes</h2>
                        <AlertBadges alerts={alerts} maxVisible={3} />
                    </section>
                )}

                {/* Indices Grid */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>📈 Indices Stratégiques</h2>
                    <div className={styles.indicesGrid}>
                        {INDEX_IDS.map((indexId) => (
                            <IndexGauge
                                key={indexId}
                                indexId={indexId}
                                label={INDEX_LABELS[indexId]}
                                value={gameState.indices[indexId]}
                                previousValue={previousGameState?.indices[indexId]}
                                variant="bar"
                            />
                        ))}
                    </div>
                </section>

                {/* Product Grid */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>📦 Indicateurs par Produit</h2>
                    <ProductGrid
                        products={productMetrics}
                        difficulty={difficulty}
                    />
                </section>

                {/* Bottom Row: P&L + Effectifs */}
                <div className={styles.bottomRow}>
                    <section className={styles.halfSection}>
                        <PnLChart
                            primes={gameState.pnl.primes}
                            sinistres={gameState.pnl.sinistres}
                            frais={gameState.pnl.frais}
                            produits_financiers={gameState.pnl.produits_financiers}
                            resultat={gameState.pnl.resultat}
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
            </main>
        </div>
    );
}

// ============================================
// MOCK DATA
// ============================================

function createMockGameState(): GameStateData {
    return {
        indices: {
            IAC: 62,
            IPQO: 58,
            IERH: 45,
            IRF: 55,
            IMD: 42,
            IS: 68,
            IPP: 52,
        },
        pnl: {
            primes: 85_000_000,
            sinistres: 55_000_000,
            frais: 22_000_000,
            produits_financiers: 3_000_000,
            resultat: 11_000_000,
        },
        products: {
            auto: {
                nbContrats: 45000,
                primesCollectees: 52_000_000,
                stockSinistres: 2100,
                fluxEntrees: 180,
                fluxSorties: 165,
                frequence: 7.2,
                coutMoyen: 2800,
            },
            mrh: {
                nbContrats: 32000,
                primesCollectees: 28_000_000,
                stockSinistres: 1200,
                fluxEntrees: 95,
                fluxSorties: 88,
                frequence: 4.8,
                coutMoyen: 3500,
            },
        },
        effectifs: {
            sinistres: 100,
            distribution: 80,
            dataIT: 30,
            support: 40,
        },
    };
}

function createMockPreviousState(): GameStateData {
    return {
        indices: {
            IAC: 60,
            IPQO: 55,
            IERH: 48,
            IRF: 57,
            IMD: 40,
            IS: 70,
            IPP: 50,
        },
        pnl: {
            primes: 82_000_000,
            sinistres: 53_000_000,
            frais: 21_000_000,
            produits_financiers: 2_800_000,
            resultat: 10_800_000,
        },
        products: {
            auto: {
                nbContrats: 44000,
                primesCollectees: 50_000_000,
                stockSinistres: 2000,
                fluxEntrees: 170,
                fluxSorties: 160,
                frequence: 7.0,
                coutMoyen: 2750,
            },
            mrh: {
                nbContrats: 31000,
                primesCollectees: 27_000_000,
                stockSinistres: 1150,
                fluxEntrees: 90,
                fluxSorties: 85,
                frequence: 4.6,
                coutMoyen: 3400,
            },
        },
        effectifs: {
            sinistres: 100,
            distribution: 80,
            dataIT: 30,
            support: 40,
        },
    };
}
