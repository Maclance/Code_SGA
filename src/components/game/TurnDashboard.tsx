/**
 * TurnDashboard Component
 * 
 * @module components/game/TurnDashboard
 * @description Displays indices and P&L overview at start of turn (US-014)
 */

'use client';

import React from 'react';
import styles from './TurnDashboard.module.css';

interface TurnDashboardProps {
    indices: Record<string, number>;
    pnl: {
        primes: number;
        sinistres: number;
        frais: number;
        produits_financiers: number;
        resultat: number;
    };
    previousIndices?: Record<string, number>;
    turnNumber: number;
    onContinue: () => void;
}

const INDEX_LABELS: Record<string, { name: string; emoji: string }> = {
    IAC: { name: 'Attractivité Commerciale', emoji: '📈' },
    IPQO: { name: 'Performance Opérationnelle', emoji: '⚙️' },
    IERH: { name: 'Équilibre RH', emoji: '👥' },
    IRF: { name: 'Résilience Financière', emoji: '🛡️' },
    IMD: { name: 'Maturité Data', emoji: '📊' },
    IS: { name: 'Sincérité', emoji: '✅' },
    IPP: { name: 'Performance P&L', emoji: '💰' },
};

function formatCurrency(value: number): string {
    if (value >= 1_000_000) {
        return `${(value / 1_000_000).toFixed(1)}M€`;
    }
    if (value >= 1_000) {
        return `${(value / 1_000).toFixed(0)}k€`;
    }
    return `${value.toFixed(0)}€`;
}

function getIndexColor(value: number): string {
    if (value >= 70) return '#4ade80';
    if (value >= 50) return '#facc15';
    if (value >= 30) return '#fb923c';
    return '#f87171';
}

function getDelta(current: number, previous: number | undefined): number | null {
    if (previous === undefined) return null;
    return current - previous;
}

export function TurnDashboard({
    indices,
    pnl,
    previousIndices,
    onContinue,
}: TurnDashboardProps) {
    return (
        <div className={styles.container}>
            {/* Indices Section */}
            <section className={styles.section}>
                <h3 className={styles.sectionTitle}>📊 Indices Stratégiques</h3>
                <div className={styles.indicesGrid}>
                    {Object.entries(INDEX_LABELS).map(([key, { name, emoji }]) => {
                        const value = indices[key] ?? 0;
                        const delta = getDelta(value, previousIndices?.[key]);

                        return (
                            <div key={key} className={styles.indexCard}>
                                <div className={styles.indexHeader}>
                                    <span className={styles.indexEmoji}>{emoji}</span>
                                    <span className={styles.indexName}>{name}</span>
                                </div>
                                <div className={styles.indexValue}>
                                    <span
                                        className={styles.value}
                                        style={{ color: getIndexColor(value) }}
                                    >
                                        {Math.round(value)}
                                    </span>
                                    <span className={styles.unit}>/100</span>
                                </div>
                                {delta !== null && delta !== 0 && (
                                    <div
                                        className={styles.delta}
                                        style={{ color: delta > 0 ? '#4ade80' : '#f87171' }}
                                    >
                                        {delta > 0 ? '+' : ''}{delta.toFixed(1)}
                                    </div>
                                )}
                                <div className={styles.gauge}>
                                    <div
                                        className={styles.gaugeBar}
                                        style={{
                                            width: `${value}%`,
                                            backgroundColor: getIndexColor(value)
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* P&L Section */}
            <section className={styles.section}>
                <h3 className={styles.sectionTitle}>💰 Compte de Résultat</h3>
                <div className={styles.pnlGrid}>
                    <div className={styles.pnlCard}>
                        <span className={styles.pnlLabel}>Primes nettes</span>
                        <span className={styles.pnlValue}>{formatCurrency(pnl.primes)}</span>
                    </div>
                    <div className={styles.pnlCard}>
                        <span className={styles.pnlLabel}>Sinistres</span>
                        <span className={styles.pnlValue} style={{ color: '#f87171' }}>
                            -{formatCurrency(pnl.sinistres)}
                        </span>
                    </div>
                    <div className={styles.pnlCard}>
                        <span className={styles.pnlLabel}>Frais</span>
                        <span className={styles.pnlValue} style={{ color: '#fb923c' }}>
                            -{formatCurrency(pnl.frais)}
                        </span>
                    </div>
                    <div className={styles.pnlCard}>
                        <span className={styles.pnlLabel}>Produits financiers</span>
                        <span className={styles.pnlValue} style={{ color: '#4ade80' }}>
                            +{formatCurrency(pnl.produits_financiers)}
                        </span>
                    </div>
                    <div className={`${styles.pnlCard} ${styles.pnlResult}`}>
                        <span className={styles.pnlLabel}>Résultat</span>
                        <span
                            className={styles.pnlValue}
                            style={{ color: pnl.resultat >= 0 ? '#4ade80' : '#f87171' }}
                        >
                            {pnl.resultat >= 0 ? '+' : ''}{formatCurrency(pnl.resultat)}
                        </span>
                    </div>
                </div>
            </section>

            {/* Continue Button */}
            <div className={styles.actions}>
                <button className={styles.continueBtn} onClick={onContinue}>
                    Voir les événements →
                </button>
            </div>
        </div>
    );
}
