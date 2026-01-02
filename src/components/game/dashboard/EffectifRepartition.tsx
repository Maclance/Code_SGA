/**
 * EffectifRepartition Component
 *
 * @module components/game/dashboard/EffectifRepartition
 * @description Donut chart showing staff distribution (US-030)
 */

'use client';

import React from 'react';
import styles from './EffectifRepartition.module.css';
import type { EffectifSegment } from '@/lib/engine';
import { EFFECTIF_COLORS } from '@/lib/engine';

// ============================================
// TYPES
// ============================================

export interface EffectifRepartitionProps {
    /** Effectif segments to display */
    segments: EffectifSegment[];
    /** Total effectifs (for center display) */
    total: number;
    /** Loading state */
    isLoading?: boolean;
    /** Locale for formatting */
    locale?: 'fr' | 'en';
}

// ============================================
// LABELS
// ============================================

const LABELS = {
    fr: {
        title: 'Répartition Effectifs',
        total: 'Total ETP',
        sinistres: 'Sinistres',
        distribution: 'Distribution',
        dataIT: 'Data & IT',
        support: 'Support',
    },
    en: {
        title: 'Staff Distribution',
        total: 'Total FTE',
        sinistres: 'Claims',
        distribution: 'Distribution',
        dataIT: 'Data & IT',
        support: 'Support',
    },
};

// ============================================
// COMPONENT
// ============================================

export function EffectifRepartition({
    segments,
    total,
    isLoading = false,
    locale = 'fr',
}: EffectifRepartitionProps) {
    const labels = LABELS[locale];

    if (isLoading) {
        return (
            <div className={styles.container} aria-busy="true">
                <div className={styles.skeleton} />
            </div>
        );
    }

    // Calculate conic-gradient stops
    let accumulatedPercent = 0;
    const gradientStops = segments.map((segment) => {
        const start = accumulatedPercent;
        accumulatedPercent += segment.percentage;
        return `${segment.color} ${start}% ${accumulatedPercent}%`;
    }).join(', ');

    const conicGradient = `conic-gradient(from 0deg, ${gradientStops})`;

    return (
        <div className={styles.container}>
            <h3 className={styles.title}>👥 {labels.title}</h3>

            <div className={styles.content}>
                {/* Donut Chart */}
                <div
                    className={styles.donut}
                    style={{ background: conicGradient }}
                    role="img"
                    aria-label={`${labels.title}: ${total} ETP`}
                >
                    <div className={styles.donutCenter}>
                        <span className={styles.totalValue}>{total}</span>
                        <span className={styles.totalLabel}>{labels.total}</span>
                    </div>
                </div>

                {/* Legend */}
                <div className={styles.legend} role="list">
                    {segments.map((segment) => (
                        <div key={segment.id} className={styles.legendItem} role="listitem">
                            <span
                                className={styles.legendColor}
                                style={{ backgroundColor: segment.color }}
                            />
                            <span className={styles.legendLabel}>
                                {labels[segment.id as keyof typeof labels] ?? segment.label}
                            </span>
                            <span className={styles.legendValue}>
                                {segment.value} <span className={styles.legendPercent}>({segment.percentage.toFixed(0)}%)</span>
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/**
 * Helper to create segments from EffectifsPool
 */
export function createEffectifSegments(
    sinistres: number,
    distribution: number,
    dataIT: number,
    support: number
): EffectifSegment[] {
    const total = sinistres + distribution + dataIT + support;
    if (total === 0) return [];

    return [
        {
            id: 'sinistres',
            label: 'Sinistres',
            value: sinistres,
            percentage: (sinistres / total) * 100,
            color: EFFECTIF_COLORS.sinistres,
        },
        {
            id: 'distribution',
            label: 'Distribution',
            value: distribution,
            percentage: (distribution / total) * 100,
            color: EFFECTIF_COLORS.distribution,
        },
        {
            id: 'dataIT',
            label: 'Data & IT',
            value: dataIT,
            percentage: (dataIT / total) * 100,
            color: EFFECTIF_COLORS.dataIT,
        },
        {
            id: 'support',
            label: 'Support',
            value: support,
            percentage: (support / total) * 100,
            color: EFFECTIF_COLORS.support,
        },
    ];
}

export default EffectifRepartition;
