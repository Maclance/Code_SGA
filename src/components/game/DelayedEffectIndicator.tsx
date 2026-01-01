/**
 * Delayed Effect Indicator Component
 *
 * @module components/game/DelayedEffectIndicator
 * @description Displays "Effet attendu à T+X" for a pending decision effect (US-023)
 *
 * References:
 * - docs/20_simulation/effets_retard.md
 * - docs/000_projet/specs_fonctionnelles_mvp.md (US-023 AC3)
 */

'use client';

import React from 'react';
import type { GameSpeed } from '@/lib/engine/config/delay-config';
import {
    getDelayIndicatorText,
    getIntensityText,
    getDelayRangeForUI,
} from '@/lib/services/delayed-effects.service';
import styles from './DelayedEffectIndicator.module.css';

// ============================================
// TYPES
// ============================================

export interface DelayedEffectIndicatorProps {
    /** Business domain of the effect (rh, it, prevention, etc.) */
    domain: string;
    /** Current turn number */
    currentTurn: number;
    /** Game speed affecting delay calculation */
    gameSpeed?: GameSpeed;
    /** Number of turns remaining until effect applies (if known) */
    turnsRemaining?: number;
    /** Effect intensity level */
    intensity?: 'low' | 'medium' | 'high';
    /** Target index name (for display) */
    targetIndex?: string;
    /** Whether to show the delay range instead of single value */
    showRange?: boolean;
    /** Additional CSS class */
    className?: string;
    /** Locale for text (default: 'fr') */
    locale?: string;
}

// ============================================
// COMPONENT
// ============================================

/**
 * DelayedEffectIndicator - Shows expected effect timing
 *
 * @remarks
 * Displays a visual indicator showing when an effect will apply.
 * Includes intensity level (decaying over time) and target index.
 *
 * @example
 * ```tsx
 * <DelayedEffectIndicator
 *   domain="rh"
 *   currentTurn={3}
 *   gameSpeed="medium"
 *   intensity="high"
 *   targetIndex="IERH"
 * />
 * // Displays: "Effet attendu à T+2 sur IERH"
 * ```
 */
export function DelayedEffectIndicator({
    domain,
    currentTurn,
    gameSpeed = 'medium',
    turnsRemaining,
    intensity = 'medium',
    targetIndex,
    showRange = false,
    className = '',
    locale = 'fr',
}: DelayedEffectIndicatorProps): React.JSX.Element {
    // Calculate delay if not provided
    const range = getDelayRangeForUI(domain, gameSpeed);

    // Build display text
    let delayText: string;

    if (turnsRemaining !== undefined) {
        delayText = getDelayIndicatorText(turnsRemaining, locale);
    } else if (showRange && range.min !== range.max) {
        delayText =
            locale === 'fr'
                ? `Effet attendu entre ${range.min} et ${range.max}`
                : `Effect expected between ${range.min} and ${range.max}`;
    } else {
        // Use minimum delay as default display
        const minDelay = parseInt(range.min.replace('T+', ''));
        delayText = getDelayIndicatorText(minDelay, locale);
    }

    // Add target index if provided
    if (targetIndex) {
        delayText += locale === 'fr' ? ` sur ${targetIndex}` : ` on ${targetIndex}`;
    }

    return (
        <div
            className={`${styles.indicator} ${styles[intensity]} ${className}`}
            data-testid="delayed-effect-indicator"
            data-domain={domain}
            data-intensity={intensity}
        >
            <div className={styles.iconContainer}>
                <span className={styles.icon} aria-hidden="true">
                    ⏱️
                </span>
            </div>
            <div className={styles.content}>
                <span className={styles.delayText}>{delayText}</span>
                <span className={styles.intensityBadge} title={getIntensityText(intensity, locale)}>
                    {getIntensityText(intensity, locale)}
                </span>
            </div>
        </div>
    );
}

// ============================================
// COMPACT VARIANT
// ============================================

export interface CompactDelayIndicatorProps {
    /** Number of turns remaining */
    turnsRemaining: number;
    /** Optional intensity */
    intensity?: 'low' | 'medium' | 'high';
    /** Additional CSS class */
    className?: string;
}

/**
 * CompactDelayIndicator - Minimal version showing only "T+X"
 *
 * @example
 * ```tsx
 * <CompactDelayIndicator turnsRemaining={3} intensity="high" />
 * // Displays: "T+3" with high intensity styling
 * ```
 */
export function CompactDelayIndicator({
    turnsRemaining,
    intensity = 'medium',
    className = '',
}: CompactDelayIndicatorProps): React.JSX.Element {
    const displayText = turnsRemaining === 0 ? 'Now' : `T+${turnsRemaining}`;

    return (
        <span
            className={`${styles.compact} ${styles[intensity]} ${className}`}
            data-testid="compact-delay-indicator"
            data-turns={turnsRemaining}
        >
            {displayText}
        </span>
    );
}

export default DelayedEffectIndicator;
