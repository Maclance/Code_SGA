/**
 * Delayed Effects Service
 *
 * @module lib/services/delayed-effects.service
 * @description Service layer for delayed effects management and UI formatting (US-023)
 *
 * References:
 * - docs/20_simulation/effets_retard.md
 * - docs/000_projet/specs_fonctionnelles_mvp.md (US-023)
 */

import type { IndexId } from '@/lib/engine/types';
import {
    type DelayedEffect,
    type DelayedEffectsQueue,
    type DelayedEffectDisplay,
    type EffectDomain,
    type GameSpeed as GameSpeedFR,
} from '@/lib/engine/effects-types';
import {
    type GameSpeed,
    getDelayForDomain,
    getDelayRange,
    getDecayRate,
    toFrenchSpeed,
    DELAY_CONFIGS,
} from '@/lib/engine/config/delay-config';
import { applyDecay } from '@/lib/engine/delayed-effects';

// ============================================
// INTENSITY CALCULATION
// ============================================

/**
 * Calculates the intensity level of an effect based on decay
 *
 * @param effect - The delayed effect
 * @param currentTurn - Current turn number
 * @returns Intensity level: 'low', 'medium', or 'high'
 *
 * @remarks
 * Intensity is determined by the remaining effect value after decay:
 * - high: > 66% of original value
 * - medium: 33-66% of original value
 * - low: < 33% of original value
 */
export function getEffectIntensity(
    effect: DelayedEffect,
    currentTurn: number
): 'low' | 'medium' | 'high' {
    const turnsElapsed = currentTurn - effect.createdAtTurn;
    const decayedValue = applyDecay(Math.abs(effect.value), effect.decayRate, turnsElapsed);
    const originalValue = Math.abs(effect.value);

    if (originalValue === 0) {
        return 'low';
    }

    const ratio = decayedValue / originalValue;

    if (ratio > 0.66) {
        return 'high';
    } else if (ratio > 0.33) {
        return 'medium';
    }
    return 'low';
}

// ============================================
// IMPACT ESTIMATION
// ============================================

/**
 * Estimates the impact range of an effect at application time
 *
 * @param effect - The delayed effect
 * @param currentTurn - Current turn number
 * @returns Estimated min/max impact values
 */
export function estimateImpact(
    effect: DelayedEffect,
    currentTurn: number
): { min: number; max: number } {
    const turnsUntilApplication = effect.appliesAtTurn - currentTurn;

    if (turnsUntilApplication <= 0) {
        // Effect applies this turn, use current value
        const value = effect.value;
        return { min: value, max: value };
    }

    // Calculate value at application time (future decay)
    const totalTurns = effect.appliesAtTurn - effect.createdAtTurn;
    const decayedValue = applyDecay(effect.value, effect.decayRate, totalTurns);

    // Provide a range accounting for uncertainty
    const minValue = decayedValue * 0.9;
    const maxValue = decayedValue * 1.1;

    return {
        min: Math.round(minValue * 10) / 10,
        max: Math.round(maxValue * 10) / 10,
    };
}

// ============================================
// UI TRANSFORMATION
// ============================================

/**
 * Transforms a DelayedEffect into a DelayedEffectDisplay for UI
 *
 * @param effect - The delayed effect
 * @param currentTurn - Current turn number
 * @returns Formatted display object for UI components
 */
export function toEffectDisplay(
    effect: DelayedEffect,
    currentTurn: number
): DelayedEffectDisplay {
    return {
        effectId: effect.id,
        description: effect.description || `Effet sur ${effect.targetIndex}`,
        expectedTurn: effect.appliesAtTurn,
        turnsRemaining: Math.max(0, effect.appliesAtTurn - currentTurn),
        intensity: getEffectIntensity(effect, currentTurn),
        targetIndex: effect.targetIndex,
        estimatedImpact: estimateImpact(effect, currentTurn),
        domain: effect.domain,
        decisionId: effect.decisionId,
    };
}

/**
 * Gets all pending effects formatted for UI display
 *
 * @param queue - The delayed effects queue
 * @param currentTurn - Current turn number
 * @returns Array of DelayedEffectDisplay objects sorted by expected turn
 *
 * @example
 * ```ts
 * const effects = getPendingEffectsForUI(queue, 3);
 * // Returns effects like:
 * // [
 * //   { effectId: 'eff-001', turnsRemaining: 2, intensity: 'high', ... },
 * //   { effectId: 'eff-002', turnsRemaining: 4, intensity: 'medium', ... },
 * // ]
 * ```
 */
export function getPendingEffectsForUI(
    queue: DelayedEffectsQueue,
    currentTurn: number
): DelayedEffectDisplay[] {
    return queue.pending
        .filter((effect) => !effect.isApplied && effect.appliesAtTurn >= currentTurn)
        .map((effect) => toEffectDisplay(effect, currentTurn))
        .sort((a, b) => a.expectedTurn - b.expectedTurn);
}

/**
 * Gets pending effects for a specific target index
 *
 * @param queue - The delayed effects queue
 * @param currentTurn - Current turn number
 * @param targetIndex - Index to filter by
 * @returns Filtered DelayedEffectDisplay array
 */
export function getPendingEffectsForIndex(
    queue: DelayedEffectsQueue,
    currentTurn: number,
    targetIndex: IndexId
): DelayedEffectDisplay[] {
    return getPendingEffectsForUI(queue, currentTurn).filter(
        (effect) => effect.targetIndex === targetIndex
    );
}

/**
 * Gets pending effects for a specific domain
 *
 * @param queue - The delayed effects queue
 * @param currentTurn - Current turn number
 * @param domain - Domain to filter by
 * @returns Filtered DelayedEffectDisplay array
 */
export function getPendingEffectsForDomain(
    queue: DelayedEffectsQueue,
    currentTurn: number,
    domain: EffectDomain
): DelayedEffectDisplay[] {
    return getPendingEffectsForUI(queue, currentTurn).filter(
        (effect) => effect.domain === domain
    );
}

// ============================================
// DELAY CALCULATION WRAPPERS
// ============================================

/**
 * Calculate delay for a domain with game speed
 * Wrapper for engine function with logging
 *
 * @param domain - Business domain
 * @param speed - Game speed (EN: fast/medium/slow)
 * @param useMax - If true, use maximum delay; otherwise minimum
 * @returns Delay in turns
 */
export function calculateDelayForDecision(
    domain: string,
    speed: GameSpeed = 'medium',
    useMax: boolean = false
): number {
    const delay = getDelayForDomain(domain, speed, useMax);

    console.log(
        `[DELAY-SERVICE] Domain: ${domain}, Speed: ${speed}, Delay: ${delay}T`
    );

    return delay;
}

/**
 * Gets expected application turn for a new decision
 *
 * @param domain - Business domain
 * @param currentTurn - Current turn number
 * @param speed - Game speed
 * @returns Expected turn for effect application
 */
export function getExpectedApplicationTurn(
    domain: string,
    currentTurn: number,
    speed: GameSpeed = 'medium'
): number {
    const delay = getDelayForDomain(domain, speed, false);
    return currentTurn + delay;
}

/**
 * Gets delay range for UI display
 *
 * @param domain - Business domain
 * @param speed - Game speed
 * @returns Object with min and max delay strings
 *
 * @example
 * ```ts
 * const range = getDelayRangeForUI('rh', 'medium');
 * // range === { min: 'T+2', max: 'T+3' }
 * ```
 */
export function getDelayRangeForUI(
    domain: string,
    speed: GameSpeed = 'medium'
): { min: string; max: string } {
    const range = getDelayRange(domain, speed);
    return {
        min: `T+${range.min}`,
        max: `T+${range.max}`,
    };
}

// ============================================
// TIMELINE HELPERS
// ============================================

/**
 * Groups effects by turn for timeline display
 *
 * @param effects - Array of DelayedEffectDisplay
 * @returns Map of turn number to effects
 */
export function groupEffectsByTurn(
    effects: DelayedEffectDisplay[]
): Map<number, DelayedEffectDisplay[]> {
    const grouped = new Map<number, DelayedEffectDisplay[]>();

    for (const effect of effects) {
        const turn = effect.expectedTurn;
        const existing = grouped.get(turn) || [];
        grouped.set(turn, [...existing, effect]);
    }

    return grouped;
}

/**
 * Gets effects summary for a specific turn
 *
 * @param effects - Array of DelayedEffectDisplay
 * @param turn - Turn number
 * @returns Summary object with count and total impact
 */
export function getEffectsSummaryForTurn(
    effects: DelayedEffectDisplay[],
    turn: number
): { count: number; totalPositive: number; totalNegative: number } {
    const turnEffects = effects.filter((e) => e.expectedTurn === turn);

    let totalPositive = 0;
    let totalNegative = 0;

    for (const effect of turnEffects) {
        const avgImpact = (effect.estimatedImpact.min + effect.estimatedImpact.max) / 2;
        if (avgImpact >= 0) {
            totalPositive += avgImpact;
        } else {
            totalNegative += avgImpact;
        }
    }

    return {
        count: turnEffects.length,
        totalPositive: Math.round(totalPositive * 10) / 10,
        totalNegative: Math.round(totalNegative * 10) / 10,
    };
}

// ============================================
// I18N HELPERS (US-023 READY)
// ============================================

/**
 * Gets localized text for delay indicator
 *
 * @param turnsRemaining - Number of turns until application
 * @param locale - Locale for text (default: 'fr')
 * @returns Localized string
 */
export function getDelayIndicatorText(
    turnsRemaining: number,
    locale: string = 'fr'
): string {
    if (locale === 'fr') {
        if (turnsRemaining === 0) {
            return 'Effet immédiat';
        } else if (turnsRemaining === 1) {
            return 'Effet attendu au prochain tour';
        }
        return `Effet attendu à T+${turnsRemaining}`;
    }

    // English fallback
    if (turnsRemaining === 0) {
        return 'Immediate effect';
    } else if (turnsRemaining === 1) {
        return 'Effect expected next turn';
    }
    return `Effect expected at T+${turnsRemaining}`;
}

/**
 * Gets localized description for intensity level
 *
 * @param intensity - Intensity level
 * @param locale - Locale for text
 * @returns Localized intensity description
 */
export function getIntensityText(
    intensity: 'low' | 'medium' | 'high',
    locale: string = 'fr'
): string {
    const texts: Record<string, Record<'low' | 'medium' | 'high', string>> = {
        fr: {
            low: 'Faible',
            medium: 'Moyen',
            high: 'Fort',
        },
        en: {
            low: 'Low',
            medium: 'Medium',
            high: 'High',
        },
    };

    return texts[locale]?.[intensity] || texts.en[intensity];
}

// ============================================
// VALIDATION
// ============================================

/**
 * Validates that a domain has a valid delay configuration
 *
 * @param domain - Domain to validate
 * @returns True if domain has valid config
 */
export function isValidDelayDomain(domain: string): boolean {
    return domain.toLowerCase() in DELAY_CONFIGS;
}

/**
 * Gets all configured domains
 *
 * @returns Array of domain names
 */
export function getConfiguredDomains(): string[] {
    return Object.keys(DELAY_CONFIGS);
}
