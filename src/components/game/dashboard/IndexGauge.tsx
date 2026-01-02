/**
 * IndexGauge Component
 *
 * @module components/game/dashboard/IndexGauge
 * @description Individual index gauge with value, delta, and status (US-030)
 */

'use client';

import React from 'react';
import styles from './IndexGauge.module.css';
import type { IndexStatus, IndexThresholds } from '@/lib/engine';
import { getIndexStatus, DEFAULT_INDEX_THRESHOLDS, INDEX_ICONS } from '@/lib/engine';
import type { IndicesState } from '@/lib/engine';

// ============================================
// TYPES
// ============================================

export interface IndexGaugeProps {
    /** Index identifier */
    indexId: keyof IndicesState;
    /** Display label */
    label: string;
    /** Current value (0-100) */
    value: number;
    /** Previous turn value for delta calculation */
    previousValue?: number;
    /** Custom thresholds (optional) */
    thresholds?: IndexThresholds;
    /** Compact mode for smaller display */
    compact?: boolean;
    /** Show bar or circular gauge */
    variant?: 'bar' | 'circular';
}

// ============================================
// STATUS COLORS
// ============================================

const STATUS_COLORS: Record<IndexStatus, string> = {
    critical: 'var(--color-danger, #ef4444)',
    warning: 'var(--color-warning, #f59e0b)',
    ok: 'var(--color-info, #06b6d4)',
    good: 'var(--color-success, #22c55e)',
};

// ============================================
// COMPONENT
// ============================================

export function IndexGauge({
    indexId,
    label,
    value,
    previousValue,
    thresholds = DEFAULT_INDEX_THRESHOLDS,
    compact = false,
    variant = 'bar',
}: IndexGaugeProps) {
    const status = getIndexStatus(value, thresholds);
    const delta = previousValue !== undefined ? value - previousValue : null;
    const deltaPercent = previousValue && previousValue !== 0
        ? ((value - previousValue) / previousValue) * 100
        : null;

    const icon = INDEX_ICONS[indexId] ?? '📊';
    const color = STATUS_COLORS[status];

    // Aria label for accessibility
    const ariaLabel = `${label}: ${Math.round(value)} sur 100${delta !== null ? `, variation de ${delta > 0 ? '+' : ''}${delta.toFixed(1)}` : ''
        }, statut ${status}`;

    if (variant === 'circular') {
        return (
            <div
                className={`${styles.gauge} ${styles.circular} ${compact ? styles.compact : ''}`}
                role="meter"
                aria-label={ariaLabel}
                aria-valuenow={value}
                aria-valuemin={0}
                aria-valuemax={100}
            >
                <div className={styles.circularGauge}>
                    <svg viewBox="0 0 100 100" className={styles.circularSvg}>
                        {/* Background circle */}
                        <circle
                            cx="50"
                            cy="50"
                            r="42"
                            fill="none"
                            stroke="rgba(255, 255, 255, 0.1)"
                            strokeWidth="8"
                        />
                        {/* Value arc */}
                        <circle
                            cx="50"
                            cy="50"
                            r="42"
                            fill="none"
                            stroke={color}
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={`${(value / 100) * 264} 264`}
                            transform="rotate(-90 50 50)"
                            className={styles.circularProgress}
                        />
                    </svg>
                    <div className={styles.circularValue}>
                        <span className={styles.icon}>{icon}</span>
                        <span className={styles.valueText} style={{ color }}>
                            {Math.round(value)}
                        </span>
                    </div>
                </div>
                <div className={styles.labelContainer}>
                    <span className={styles.label}>{label}</span>
                    {delta !== null && delta !== 0 && (
                        <span
                            className={styles.delta}
                            style={{ color: delta > 0 ? STATUS_COLORS.good : STATUS_COLORS.critical }}
                        >
                            {delta > 0 ? '↑' : '↓'} {Math.abs(delta).toFixed(1)}
                        </span>
                    )}
                </div>
            </div>
        );
    }

    // Bar variant (default)
    return (
        <div
            className={`${styles.gauge} ${styles.bar} ${compact ? styles.compact : ''}`}
            role="meter"
            aria-label={ariaLabel}
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={100}
        >
            <div className={styles.header}>
                <div className={styles.titleRow}>
                    <span className={styles.icon}>{icon}</span>
                    <span className={styles.label}>{label}</span>
                </div>
                <div className={styles.valueRow}>
                    <span className={styles.valueText} style={{ color }}>
                        {Math.round(value)}
                    </span>
                    <span className={styles.maxValue}>/100</span>
                    {delta !== null && delta !== 0 && (
                        <span
                            className={styles.delta}
                            style={{ color: delta > 0 ? STATUS_COLORS.good : STATUS_COLORS.critical }}
                        >
                            {delta > 0 ? '+' : ''}{delta.toFixed(1)}
                            {deltaPercent !== null && (
                                <span className={styles.deltaPercent}>
                                    ({deltaPercent > 0 ? '+' : ''}{deltaPercent.toFixed(1)}%)
                                </span>
                            )}
                        </span>
                    )}
                </div>
            </div>
            <div className={styles.barContainer}>
                <div
                    className={styles.barFill}
                    style={{
                        width: `${value}%`,
                        backgroundColor: color,
                    }}
                />
                {/* Threshold markers */}
                <div
                    className={styles.thresholdMarker}
                    style={{ left: `${thresholds.critical}%` }}
                    title={`Seuil critique: ${thresholds.critical}`}
                />
                <div
                    className={styles.thresholdMarker}
                    style={{ left: `${thresholds.warning}%` }}
                    title={`Seuil d'alerte: ${thresholds.warning}`}
                />
                <div
                    className={styles.thresholdMarker}
                    style={{ left: `${thresholds.good}%` }}
                    title={`Seuil bon: ${thresholds.good}`}
                />
            </div>
            <div className={`${styles.statusBadge} ${styles[status]}`}>
                {status === 'critical' && 'Critique'}
                {status === 'warning' && 'Attention'}
                {status === 'ok' && 'OK'}
                {status === 'good' && 'Bon'}
            </div>
        </div>
    );
}

export default IndexGauge;
