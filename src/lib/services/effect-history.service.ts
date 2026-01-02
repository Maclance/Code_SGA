/**
 * Effect History Service
 *
 * @module lib/services/effect-history.service
 * @description Service layer for effect history and compensation options (US-024)
 *
 * References:
 * - docs/20_simulation/effets_retard.md (section persistance)
 * - docs/000_projet/specs_fonctionnelles_mvp.md (US-024)
 */

import type { IndexId } from '@/lib/engine/types';
import type { EffectHistoryEntry, EffectHistoryStatus } from '@/lib/engine/effects-types';
import type { PersistentEffect } from '@/lib/engine/effect-persistence';
import type { CompensationOption } from '@/lib/engine/compensation';
import {
    updatePersistentEffect,
    isEffectViableForCompensation,
    DEPLETION_THRESHOLD,
} from '@/lib/engine/effect-persistence';
import {
    createCompensationOption,
    getCompensationMultiplier,
    COMPENSATION_COST_CAP,
} from '@/lib/engine/compensation';

// ============================================
// CONSTANTS
// ============================================

/**
 * Maximum number of turns to include in history
 * Performance constraint: limit to 10 turns
 */
export const MAX_HISTORY_TURNS = 10;

/**
 * Default base cost for compensation (can be overridden per decision type)
 */
export const DEFAULT_COMPENSATION_BASE_COST = 100;

// ============================================
// HISTORY TRANSFORMATION
// ============================================

/**
 * Transforms a persistent effect into an EffectHistoryEntry for UI
 *
 * @param effect - The persistent effect
 * @param currentTurn - Current turn number
 * @returns Formatted history entry
 */
export function toEffectHistoryEntry(
    effect: PersistentEffect,
    currentTurn: number
): EffectHistoryEntry {
    // Update effect to get current value
    const updated = updatePersistentEffect(effect, currentTurn);

    return {
        turnNumber: effect.createdAtTurn,
        decisionId: effect.decisionId,
        decisionDescription: effect.description || `Effet sur ${effect.targetIndex}`,
        targetIndex: effect.targetIndex,
        initialEffect: effect.originalValue,
        currentEffect: updated.currentValue,
        status: updated.status as EffectHistoryStatus,
        canCompensate: isEffectViableForCompensation(updated),
    };
}

/**
 * Gets effect history for UI display
 *
 * @param effects - Array of persistent effects
 * @param currentTurn - Current turn number
 * @param maxTurns - Maximum turns to include (default: 10)
 * @returns Array of history entries sorted by turn (newest first)
 *
 * @example
 * ```ts
 * const history = getEffectHistory(effects, 8, 10);
 * // Returns entries from turns 1-8 (up to 10 turns back)
 * ```
 */
export function getEffectHistory(
    effects: PersistentEffect[],
    currentTurn: number,
    maxTurns: number = MAX_HISTORY_TURNS
): EffectHistoryEntry[] {
    const minTurn = Math.max(1, currentTurn - maxTurns + 1);

    // Filter to effects within the turn range
    const filteredEffects = effects.filter(
        (effect) => effect.createdAtTurn >= minTurn && effect.createdAtTurn <= currentTurn
    );

    // Transform to history entries
    const entries = filteredEffects.map((effect) =>
        toEffectHistoryEntry(effect, currentTurn)
    );

    // Sort by turn (newest first)
    return entries.sort((a, b) => b.turnNumber - a.turnNumber);
}

/**
 * Gets effect history filtered by target index
 *
 * @param effects - Array of persistent effects
 * @param currentTurn - Current turn number
 * @param targetIndex - Target index to filter by
 * @returns Filtered history entries
 */
export function getEffectHistoryByIndex(
    effects: PersistentEffect[],
    currentTurn: number,
    targetIndex: IndexId
): EffectHistoryEntry[] {
    return getEffectHistory(effects, currentTurn).filter(
        (entry) => entry.targetIndex === targetIndex
    );
}

/**
 * Gets effect history filtered by status
 *
 * @param effects - Array of persistent effects
 * @param currentTurn - Current turn number
 * @param status - Status to filter by
 * @returns Filtered history entries
 */
export function getEffectHistoryByStatus(
    effects: PersistentEffect[],
    currentTurn: number,
    status: EffectHistoryStatus
): EffectHistoryEntry[] {
    return getEffectHistory(effects, currentTurn).filter(
        (entry) => entry.status === status
    );
}

// ============================================
// COMPENSATION OPTIONS
// ============================================

/**
 * Gets compensation options for active effects
 *
 * @param effects - Array of persistent effects
 * @param currentTurn - Current turn number
 * @param getBaseCost - Optional function to determine base cost
 * @returns Array of compensation options
 *
 * @example
 * ```ts
 * const options = getCompensationOptions(effects, 5);
 * // Returns options with costs calculated for turn 5
 * ```
 */
export function getCompensationOptionsForUI(
    effects: PersistentEffect[],
    currentTurn: number,
    getBaseCost: (effect: PersistentEffect) => number = () => DEFAULT_COMPENSATION_BASE_COST
): CompensationOption[] {
    // Only get options for active effects
    const activeEffects = effects.filter((e) => e.status === 'active');

    return activeEffects.map((effect) => {
        // Update effect first to get current value
        const updated = updatePersistentEffect(effect, currentTurn);

        return createCompensationOption({
            effect: updated,
            baseCost: getBaseCost(effect),
            currentTurn,
        });
    });
}

/**
 * Gets only viable compensation options (effects still above threshold)
 *
 * @param effects - Array of persistent effects
 * @param currentTurn - Current turn number
 * @param getBaseCost - Optional function to determine base cost
 * @returns Viable compensation options only
 */
export function getViableCompensationOptionsForUI(
    effects: PersistentEffect[],
    currentTurn: number,
    getBaseCost?: (effect: PersistentEffect) => number
): CompensationOption[] {
    return getCompensationOptionsForUI(effects, currentTurn, getBaseCost).filter(
        (option) => option.isViable
    );
}

/**
 * Gets compensation option for a specific effect
 *
 * @param effects - Array of persistent effects
 * @param effectId - ID of the effect
 * @param currentTurn - Current turn number
 * @param baseCost - Base cost for compensation
 * @returns Compensation option or null if not found
 */
export function getCompensationOptionById(
    effects: PersistentEffect[],
    effectId: string,
    currentTurn: number,
    baseCost: number = DEFAULT_COMPENSATION_BASE_COST
): CompensationOption | null {
    const effect = effects.find((e) => e.id === effectId);

    if (!effect) {
        return null;
    }

    const updated = updatePersistentEffect(effect, currentTurn);

    return createCompensationOption({
        effect: updated,
        baseCost,
        currentTurn,
    });
}

// ============================================
// SUMMARY HELPERS
// ============================================

/**
 * Summary of effect history
 */
export interface EffectHistorySummary {
    /** Total number of effects */
    total: number;
    /** Number of active effects */
    active: number;
    /** Number of depleted effects */
    depleted: number;
    /** Number of compensated effects */
    compensated: number;
    /** Net effect per index */
    netEffectsByIndex: Partial<Record<IndexId, number>>;
}

/**
 * Gets a summary of effect history
 *
 * @param effects - Array of persistent effects
 * @param currentTurn - Current turn number
 * @returns Summary object
 */
export function getEffectHistorySummary(
    effects: PersistentEffect[],
    currentTurn: number
): EffectHistorySummary {
    const history = getEffectHistory(effects, currentTurn);

    const summary: EffectHistorySummary = {
        total: history.length,
        active: 0,
        depleted: 0,
        compensated: 0,
        netEffectsByIndex: {},
    };

    for (const entry of history) {
        // Count by status
        if (entry.status === 'active') {
            summary.active++;
        } else if (entry.status === 'depleted') {
            summary.depleted++;
        } else if (entry.status === 'compensated') {
            summary.compensated++;
        }

        // Calculate net effects by index (only for active)
        if (entry.status === 'active') {
            const idx = entry.targetIndex;
            const current = summary.netEffectsByIndex[idx] || 0;
            summary.netEffectsByIndex[idx] = current + entry.currentEffect;
        }
    }

    return summary;
}

// ============================================
// I18N HELPERS
// ============================================

/**
 * Gets localized status text
 *
 * @param status - Effect status
 * @param locale - Locale (default: 'fr')
 * @returns Localized status text
 */
export function getStatusText(
    status: EffectHistoryStatus,
    locale: string = 'fr'
): string {
    const texts: Record<string, Record<EffectHistoryStatus, string>> = {
        fr: {
            active: 'Actif',
            depleted: 'Épuisé',
            compensated: 'Compensé',
        },
        en: {
            active: 'Active',
            depleted: 'Depleted',
            compensated: 'Compensated',
        },
    };

    return texts[locale]?.[status] || texts.en[status];
}

/**
 * Gets localized compensation cost description
 *
 * @param option - Compensation option
 * @param locale - Locale (default: 'fr')
 * @returns Formatted cost description
 */
export function getCompensationCostText(
    option: CompensationOption,
    locale: string = 'fr'
): string {
    const increase = Math.round((option.costMultiplier - 1) * 100);
    const atMax = option.costMultiplier >= COMPENSATION_COST_CAP;

    if (locale === 'fr') {
        if (increase === 0) {
            return `${option.currentCost} € (coût de base)`;
        }
        if (atMax) {
            return `${option.currentCost} € (+${increase}%, maximum)`;
        }
        return `${option.currentCost} € (+${increase}%)`;
    }

    // English
    if (increase === 0) {
        return `${option.currentCost} € (base cost)`;
    }
    if (atMax) {
        return `${option.currentCost} € (+${increase}%, maximum)`;
    }
    return `${option.currentCost} € (+${increase}%)`;
}

/**
 * Gets explanation text for compensation viability
 *
 * @param option - Compensation option
 * @param locale - Locale (default: 'fr')
 * @returns Explanation text
 */
export function getViabilityExplanation(
    option: CompensationOption,
    locale: string = 'fr'
): string {
    if (option.isViable) {
        if (locale === 'fr') {
            return `Compensation possible. Effet restant: ${option.effectToReverse.toFixed(1)}`;
        }
        return `Compensation available. Remaining effect: ${option.effectToReverse.toFixed(1)}`;
    }

    if (locale === 'fr') {
        return `Effet trop atténué (< ${DEPLETION_THRESHOLD}). Compensation non viable.`;
    }
    return `Effect too depleted (< ${DEPLETION_THRESHOLD}). Compensation not viable.`;
}

/**
 * Gets delay warning text for compensation cost
 *
 * @param option - Compensation option
 * @param locale - Locale (default: 'fr')
 * @returns Warning text about cost increase
 */
export function getCostWarningText(
    option: CompensationOption,
    locale: string = 'fr'
): string {
    const atMax = option.costMultiplier >= COMPENSATION_COST_CAP;
    const nextMultiplier = getCompensationMultiplier(option.turnsElapsed + 1);

    if (atMax) {
        return locale === 'fr'
            ? 'Coût maximum atteint'
            : 'Maximum cost reached';
    }

    const nextIncrease = Math.round((nextMultiplier - 1) * 100);

    return locale === 'fr'
        ? `Tour suivant: +${nextIncrease}%`
        : `Next turn: +${nextIncrease}%`;
}
