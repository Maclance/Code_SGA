/**
 * CompensationCostIndicator Component
 *
 * @module components/game/CompensationCostIndicator
 * @description Displays compensation cost with visual progression (US-024)
 *
 * Features:
 * - Shows base vs current cost with multiplier
 * - Progress bar from 1× to 3× (max)
 * - Viability status indicator
 * - Warning for next turn cost increase
 */

'use client';

import React from 'react';
import styles from './CompensationCostIndicator.module.css';
import type { CompensationOption } from '@/lib/engine/compensation';
import { COMPENSATION_COST_CAP } from '@/lib/engine/compensation';

// ============================================
// TYPES
// ============================================

export interface CompensationCostIndicatorProps {
    /** The compensation option to display */
    option: CompensationOption;
    /** Show extended details */
    showDetails?: boolean;
    /** Show warning about next turn */
    showWarning?: boolean;
    /** Locale for i18n */
    locale?: string;
    /** Custom class name */
    className?: string;
}

// ============================================
// HELPERS
// ============================================

function getMultiplierClass(multiplier: number): string {
    if (multiplier >= COMPENSATION_COST_CAP) {
        return styles.max;
    }
    if (multiplier >= 2.0) {
        return styles.high;
    }
    if (multiplier >= 1.4) {
        return styles.medium;
    }
    return styles.low;
}

function getProgressPercent(multiplier: number): number {
    // Map 1.0 to 3.0 → 0% to 100%
    return Math.min(100, ((multiplier - 1) / (COMPENSATION_COST_CAP - 1)) * 100);
}

// ============================================
// COMPONENT
// ============================================

export default function CompensationCostIndicator({
    option,
    showDetails = true,
    showWarning = true,
    locale = 'fr',
    className,
}: CompensationCostIndicatorProps) {
    const increase = Math.round((option.costMultiplier - 1) * 100);
    const isAtMax = option.costMultiplier >= COMPENSATION_COST_CAP;
    const progressPercent = getProgressPercent(option.costMultiplier);

    // Calculate next turn cost
    const nextMultiplier = Math.min(
        option.costMultiplier + 0.2,
        COMPENSATION_COST_CAP
    );
    const nextIncrease = Math.round((nextMultiplier - 1) * 100);

    return (
        <div className={`${styles.indicator} ${className || ''}`}>
            {/* Header */}
            <div className={styles.header}>
                <span className={styles.label}>
                    {locale === 'fr' ? 'Coût de compensation' : 'Compensation Cost'}
                </span>
                <span
                    className={`${styles.multiplier} ${getMultiplierClass(
                        option.costMultiplier
                    )}`}
                >
                    ×{option.costMultiplier.toFixed(1)}
                </span>
            </div>

            {/* Cost Display */}
            <div className={styles.costDisplay}>
                <span className={styles.currentCost}>{option.currentCost} €</span>
                {increase > 0 && (
                    <>
                        <span className={styles.baseCost}>{option.baseCost} €</span>
                        <span className={styles.increase}>+{increase}%</span>
                    </>
                )}
            </div>

            {/* Progress Bar */}
            {showDetails && (
                <div className={styles.progressContainer}>
                    <div className={styles.progressLabel}>
                        <span>×1</span>
                        <span>
                            {locale === 'fr' ? 'max' : 'max'} ×{COMPENSATION_COST_CAP}
                        </span>
                    </div>
                    <div className={styles.progressBar}>
                        <div
                            className={styles.progressFill}
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Viability Status */}
            <div
                className={`${styles.viability} ${option.isViable ? styles.viable : styles.notViable
                    }`}
            >
                {option.isViable
                    ? locale === 'fr'
                        ? 'Compensation possible'
                        : 'Compensation available'
                    : locale === 'fr'
                        ? 'Effet trop atténué'
                        : 'Effect too depleted'}
            </div>

            {/* Warning for next turn */}
            {showWarning && option.isViable && !isAtMax && (
                <div className={styles.warning}>
                    {locale === 'fr'
                        ? `Tour suivant: +${nextIncrease}%`
                        : `Next turn: +${nextIncrease}%`}
                </div>
            )}

            {/* Max reached notification */}
            {isAtMax && (
                <div className={styles.warning}>
                    {locale === 'fr'
                        ? 'Coût maximum atteint'
                        : 'Maximum cost reached'}
                </div>
            )}
        </div>
    );
}
