/**
 * PnLChart Component
 *
 * @module components/game/dashboard/PnLChart
 * @description P&L summary chart with bars (US-030)
 */

'use client';

import React from 'react';
import styles from './PnLChart.module.css';

// ============================================
// TYPES
// ============================================

export interface PnLChartProps {
    /** Collected premiums (€) */
    primes: number;
    /** Paid claims (€) */
    sinistres: number;
    /** Total fees (€) */
    frais: number;
    /** Financial products (€) */
    produits_financiers: number;
    /** Final result (€) */
    resultat: number;
    /** Delta from previous turn */
    deltaPercent?: number;
    /** Loading state */
    isLoading?: boolean;
    /** Locale for formatting */
    locale?: 'fr' | 'en';
}

// ============================================
// FORMATTERS
// ============================================

function formatCurrency(value: number): string {
    const absValue = Math.abs(value);
    if (absValue >= 1_000_000_000) {
        return `${(value / 1_000_000_000).toFixed(1)}Md€`;
    }
    if (absValue >= 1_000_000) {
        return `${(value / 1_000_000).toFixed(1)}M€`;
    }
    if (absValue >= 1_000) {
        return `${(value / 1_000).toFixed(0)}k€`;
    }
    return `${value.toFixed(0)}€`;
}

// ============================================
// LABELS
// ============================================

const LABELS = {
    fr: {
        title: 'Compte de Résultat',
        primes: 'Primes',
        sinistres: 'Sinistres',
        frais: 'Frais',
        produits: 'Prod. financiers',
        resultat: 'Résultat',
    },
    en: {
        title: 'P&L Statement',
        primes: 'Premiums',
        sinistres: 'Claims',
        frais: 'Fees',
        produits: 'Financial Income',
        resultat: 'Result',
    },
};

// ============================================
// COMPONENT
// ============================================

export function PnLChart({
    primes,
    sinistres,
    frais,
    produits_financiers,
    resultat,
    deltaPercent,
    isLoading = false,
    locale = 'fr',
}: PnLChartProps) {
    const labels = LABELS[locale];

    // Calculate max for scaling bars
    const maxValue = Math.max(primes, sinistres, frais, produits_financiers, Math.abs(resultat));
    const getBarWidth = (value: number) => Math.max(5, (Math.abs(value) / maxValue) * 100);

    if (isLoading) {
        return (
            <div className={styles.container} aria-busy="true">
                <div className={styles.skeleton} />
            </div>
        );
    }

    const items = [
        { key: 'primes', label: labels.primes, value: primes, color: 'var(--color-primary, #3b82f6)', positive: true },
        { key: 'sinistres', label: labels.sinistres, value: sinistres, color: 'var(--color-danger, #ef4444)', positive: false },
        { key: 'frais', label: labels.frais, value: frais, color: 'var(--color-warning, #f59e0b)', positive: false },
        { key: 'produits', label: labels.produits, value: produits_financiers, color: 'var(--color-success, #22c55e)', positive: true },
    ];

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h3 className={styles.title}>💰 {labels.title}</h3>
                {deltaPercent !== undefined && (
                    <span
                        className={styles.delta}
                        style={{ color: deltaPercent >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}
                    >
                        {deltaPercent >= 0 ? '↑' : '↓'} {Math.abs(deltaPercent).toFixed(1)}%
                    </span>
                )}
            </header>

            <div className={styles.chart} role="img" aria-label={`${labels.title}: Résultat ${formatCurrency(resultat)}`}>
                {items.map(({ key, label, value, color, positive }) => (
                    <div key={key} className={styles.row}>
                        <span className={styles.label}>{label}</span>
                        <div className={styles.barContainer}>
                            <div
                                className={styles.bar}
                                style={{
                                    width: `${getBarWidth(value)}%`,
                                    backgroundColor: color,
                                }}
                            />
                        </div>
                        <span className={styles.value} style={{ color }}>
                            {positive ? '+' : '-'}{formatCurrency(value)}
                        </span>
                    </div>
                ))}

                {/* Separator */}
                <div className={styles.separator} />

                {/* Result Row */}
                <div className={`${styles.row} ${styles.resultRow}`}>
                    <span className={styles.label}>{labels.resultat}</span>
                    <div className={styles.barContainer}>
                        <div
                            className={`${styles.bar} ${styles.resultBar}`}
                            style={{
                                width: `${getBarWidth(resultat)}%`,
                                backgroundColor: resultat >= 0
                                    ? 'var(--color-success, #22c55e)'
                                    : 'var(--color-danger, #ef4444)',
                            }}
                        />
                    </div>
                    <span
                        className={`${styles.value} ${styles.resultValue}`}
                        style={{
                            color: resultat >= 0
                                ? 'var(--color-success, #22c55e)'
                                : 'var(--color-danger, #ef4444)',
                        }}
                    >
                        {resultat >= 0 ? '+' : ''}{formatCurrency(resultat)}
                    </span>
                </div>
            </div>
        </div>
    );
}

export default PnLChart;
