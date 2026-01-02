/**
 * FeedbackScreen Component
 * 
 * @module components/game/FeedbackScreen
 * @description Results summary with major variations (US-014)
 */

'use client';

import React from 'react';
import styles from './FeedbackScreen.module.css';

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

interface TurnState {
    indices: Record<string, number>;
    pnl: {
        primes: number;
        sinistres: number;
        frais: number;
        produits_financiers: number;
        resultat: number;
    };
}

interface FeedbackScreenProps {
    feedback: Feedback;
    currentState: TurnState;
    previousState: TurnState | null;
    isFinalTurn: boolean;
    onNextTurn: () => void;
}

const INDEX_LABELS: Record<string, string> = {
    IAC: 'Attractivité Commerciale',
    IPQO: 'Performance Opérationnelle',
    IERH: 'Équilibre RH',
    IRF: 'Résilience Financière',
    IMD: 'Maturité Data',
    IS: 'Sincérité',
    IPP: 'Performance P&L',
};

function formatCurrency(value: number): string {
    const absValue = Math.abs(value);
    if (absValue >= 1_000_000) {
        return `${(value / 1_000_000).toFixed(1)}M€`;
    }
    if (absValue >= 1_000) {
        return `${(value / 1_000).toFixed(0)}k€`;
    }
    return `${value.toFixed(0)}€`;
}

export function FeedbackScreen({
    feedback,
    isFinalTurn,
    onNextTurn,
}: FeedbackScreenProps) {
    const { majorVariations, summary } = feedback;

    return (
        <div className={styles.container}>
            {/* Summary Cards */}
            <section className={styles.summarySection}>
                <div className={styles.summaryCards}>
                    <div className={styles.summaryCard}>
                        <span className={styles.summaryValue}>{summary.decisionsApplied}</span>
                        <span className={styles.summaryLabel}>Décision{summary.decisionsApplied !== 1 ? 's' : ''} appliquée{summary.decisionsApplied !== 1 ? 's' : ''}</span>
                    </div>
                    <div className={`${styles.summaryCard} ${styles.positive}`}>
                        <span className={styles.summaryValue}>+{summary.indicesImproved}</span>
                        <span className={styles.summaryLabel}>Indices améliorés</span>
                    </div>
                    <div className={`${styles.summaryCard} ${styles.negative}`}>
                        <span className={styles.summaryValue}>{summary.indicesDegraded}</span>
                        <span className={styles.summaryLabel}>Indices dégradés</span>
                    </div>
                    <div className={`${styles.summaryCard} ${summary.pnlChange >= 0 ? styles.positive : styles.negative}`}>
                        <span className={styles.summaryValue}>
                            {summary.pnlChange >= 0 ? '+' : ''}{formatCurrency(summary.pnlChange)}
                        </span>
                        <span className={styles.summaryLabel}>Variation P&L</span>
                    </div>
                </div>
            </section>

            {/* Major Variations */}
            {majorVariations.length > 0 && (
                <section className={styles.variationsSection}>
                    <h3 className={styles.sectionTitle}>📊 Variations Majeures</h3>
                    <div className={styles.variationsList}>
                        {majorVariations.map((variation) => (
                            <div
                                key={variation.index}
                                className={`${styles.variationCard} ${variation.delta >= 0 ? styles.positive : styles.negative}`}
                            >
                                <div className={styles.variationHeader}>
                                    <span className={styles.indexName}>
                                        {INDEX_LABELS[variation.index] || variation.index}
                                    </span>
                                    <span className={styles.delta}>
                                        {variation.delta >= 0 ? '+' : ''}{variation.delta.toFixed(1)}
                                    </span>
                                </div>
                                <div className={styles.valueChange}>
                                    <span className={styles.oldValue}>{variation.previousValue.toFixed(0)}</span>
                                    <span className={styles.arrow}>→</span>
                                    <span className={styles.newValue}>{variation.newValue.toFixed(0)}</span>
                                </div>
                                {variation.drivers.length > 0 && (
                                    <div className={styles.drivers}>
                                        <span className={styles.driversLabel}>Drivers :</span>
                                        {variation.drivers.map((driver) => (
                                            <span key={driver} className={styles.driverTag}>
                                                {driver}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {majorVariations.length === 0 && (
                <section className={styles.noVariations}>
                    <span className={styles.noVariationsEmoji}>📈</span>
                    <h3>Stabilité des indicateurs</h3>
                    <p>Aucune variation majeure ce trimestre.</p>
                </section>
            )}

            {/* Next Turn Button */}
            <div className={styles.actions}>
                <button className={styles.nextBtn} onClick={onNextTurn}>
                    {isFinalTurn ? 'Voir le Débrief 📋' : 'Tour Suivant →'}
                </button>
            </div>
        </div>
    );
}
