/**
 * Compensation Module
 *
 * @module lib/engine/compensation
 * @description Compensation mechanism for reversing past decisions with increasing costs (US-024)
 *
 * References:
 * - docs/20_simulation/effets_retard.md (section compensation)
 * - docs/000_projet/specs_fonctionnelles_mvp.md (US-024)
 *
 * Formulas:
 * - Cost: Coût_Compensation(t) = Coût_Base × (1 + 0.2 × turnsElapsed)
 * - Cap: Max 3× base cost
 * - Viability: Effect must be > 0.5 (DEPLETION_THRESHOLD)
 */

import type { IndexId } from './types';
import type { PersistentEffect } from './effect-persistence';
import { DEPLETION_THRESHOLD, isEffectViableForCompensation } from './effect-persistence';

// ============================================
// CONSTANTS
// ============================================

/**
 * Compensation cost multiplier per turn elapsed
 * Cost increases by 20% per turn
 */
export const COMPENSATION_COST_RATE = 0.2;

/**
 * Maximum compensation cost multiplier (3× base)
 */
export const COMPENSATION_COST_CAP = 3.0;

// ============================================
// TYPES
// ============================================

/**
 * A compensation option for a past decision
 *
 * @example
 * ```ts
 * const option: CompensationOption = {
 *   originalDecisionId: 'dec-123',
 *   effectId: 'peff-001',
 *   baseCost: 100,
 *   currentCost: 160,
 *   costMultiplier: 1.6,
 *   turnsElapsed: 3,
 *   effectToReverse: 5.12,
 *   targetIndex: 'IERH',
 *   isViable: true,
 *   description: 'Annuler: Décision RH négative',
 * };
 * ```
 */
export interface CompensationOption {
    /** ID of the original decision */
    originalDecisionId: string;
    /** ID of the persistent effect */
    effectId: string;
    /** Base cost of compensation */
    baseCost: number;
    /** Current cost with time penalty */
    currentCost: number;
    /** Current cost multiplier (1.0 = base, max 3.0) */
    costMultiplier: number;
    /** Number of turns since effect creation */
    turnsElapsed: number;
    /** Current effect value to reverse */
    effectToReverse: number;
    /** Target index affected */
    targetIndex: IndexId;
    /** Whether compensation is still viable */
    isViable: boolean;
    /** Human-readable description */
    description?: string;
}

/**
 * Parameters for creating a compensation option
 */
export interface CreateCompensationOptionParams {
    /** The persistent effect to compensate */
    effect: PersistentEffect;
    /** Base cost for compensation */
    baseCost: number;
    /** Current turn number */
    currentTurn: number;
    /** Optional custom description */
    description?: string;
}

// ============================================
// COST CALCULATION
// ============================================

/**
 * Calculates the compensation cost based on time elapsed
 *
 * @param baseCost - Base cost of compensation
 * @param turnsElapsed - Number of turns since effect creation
 * @returns Current compensation cost (capped at 3× base)
 *
 * @remarks
 * Formula: Coût_Compensation(t) = Coût_Base × (1 + 0.2 × turnsElapsed)
 * Cap: Maximum 3× base cost
 *
 * @example
 * ```ts
 * // Base cost 100, 3 turns elapsed
 * // 100 × (1 + 0.2 × 3) = 100 × 1.6 = 160
 * const cost = calculateCompensationCost(100, 3);
 * // cost === 160
 *
 * // With cap: base 100, 15 turns elapsed
 * // 100 × (1 + 0.2 × 15) = 100 × 4 → capped to 100 × 3 = 300
 * const cappedCost = calculateCompensationCost(100, 15);
 * // cappedCost === 300
 * ```
 */
export function calculateCompensationCost(
    baseCost: number,
    turnsElapsed: number
): number {
    if (baseCost <= 0 || turnsElapsed < 0) {
        return baseCost;
    }

    // Calculate raw multiplier
    const rawMultiplier = 1 + COMPENSATION_COST_RATE * turnsElapsed;

    // Cap at maximum
    const multiplier = Math.min(rawMultiplier, COMPENSATION_COST_CAP);

    return baseCost * multiplier;
}

/**
 * Gets the cost multiplier for a given number of turns elapsed
 *
 * @param turnsElapsed - Number of turns since effect creation
 * @returns Cost multiplier (1.0 to 3.0)
 */
export function getCompensationMultiplier(turnsElapsed: number): number {
    if (turnsElapsed < 0) {
        return 1.0;
    }

    const rawMultiplier = 1 + COMPENSATION_COST_RATE * turnsElapsed;
    return Math.min(rawMultiplier, COMPENSATION_COST_CAP);
}

// ============================================
// COMPENSATION OPTIONS
// ============================================

/**
 * Creates a compensation option for a persistent effect
 *
 * @param params - Parameters for creating the option
 * @returns CompensationOption instance
 */
export function createCompensationOption(
    params: CreateCompensationOptionParams
): CompensationOption {
    const { effect, baseCost, currentTurn, description } = params;

    const turnsElapsed = currentTurn - effect.createdAtTurn;
    const currentCost = calculateCompensationCost(baseCost, turnsElapsed);
    const multiplier = getCompensationMultiplier(turnsElapsed);
    const isViable = isEffectViableForCompensation(effect);

    return {
        originalDecisionId: effect.decisionId,
        effectId: effect.id,
        baseCost,
        currentCost,
        costMultiplier: Math.round(multiplier * 100) / 100,
        turnsElapsed,
        effectToReverse: effect.currentValue,
        targetIndex: effect.targetIndex,
        isViable,
        description: description || `Compensation: ${effect.description || effect.id}`,
    };
}

/**
 * Gets compensation options for all viable effects
 *
 * @param effects - Array of persistent effects
 * @param currentTurn - Current turn number
 * @param getBaseCost - Function to determine base cost for an effect
 * @returns Array of compensation options
 */
export function getCompensationOptions(
    effects: PersistentEffect[],
    currentTurn: number,
    getBaseCost: (effect: PersistentEffect) => number
): CompensationOption[] {
    return effects.map((effect) =>
        createCompensationOption({
            effect,
            baseCost: getBaseCost(effect),
            currentTurn,
        })
    );
}

/**
 * Gets only viable compensation options
 *
 * @param effects - Array of persistent effects
 * @param currentTurn - Current turn number
 * @param getBaseCost - Function to determine base cost for an effect
 * @returns Array of viable compensation options only
 */
export function getViableCompensationOptions(
    effects: PersistentEffect[],
    currentTurn: number,
    getBaseCost: (effect: PersistentEffect) => number
): CompensationOption[] {
    return getCompensationOptions(effects, currentTurn, getBaseCost).filter(
        (option) => option.isViable
    );
}

// ============================================
// COMPENSATION APPLICATION
// ============================================

/**
 * Result of applying compensation
 */
export interface CompensationResult {
    /** Whether compensation was successful */
    success: boolean;
    /** Updated effect (with status='compensated') */
    updatedEffect: PersistentEffect;
    /** Cost that was charged */
    costCharged: number;
    /** Error message if failed */
    error?: string;
}

/**
 * Applies compensation to a persistent effect
 *
 * @param effect - The effect to compensate
 * @param option - The compensation option being used
 * @returns Compensation result
 *
 * @remarks
 * Compensation:
 * - Marks effect status as 'compensated'
 * - Sets currentValue to 0
 * - Logs the action
 */
export function applyCompensation(
    effect: PersistentEffect,
    option: CompensationOption
): CompensationResult {
    // Validate viability
    if (!option.isViable) {
        return {
            success: false,
            updatedEffect: effect,
            costCharged: 0,
            error: `Effet non viable pour compensation (valeur=${effect.currentValue.toFixed(2)}, seuil=${DEPLETION_THRESHOLD})`,
        };
    }

    // Validate effect matches option
    if (effect.id !== option.effectId) {
        return {
            success: false,
            updatedEffect: effect,
            costCharged: 0,
            error: `Effect ID mismatch: ${effect.id} vs ${option.effectId}`,
        };
    }

    // Validate effect is still compensable
    if (effect.status !== 'active') {
        return {
            success: false,
            updatedEffect: effect,
            costCharged: 0,
            error: `Effect not active (status=${effect.status})`,
        };
    }

    // Apply compensation
    const updatedEffect: PersistentEffect = {
        ...effect,
        currentValue: 0,
        status: 'compensated',
    };

    console.log(
        `[COMPENSATION] Compensation appliquée: ${effect.id} → ` +
        `reversed=${option.effectToReverse.toFixed(2)}, cost=${option.currentCost}`
    );

    return {
        success: true,
        updatedEffect,
        costCharged: option.currentCost,
    };
}

/**
 * Applies compensation to an effect within a collection
 *
 * @param effects - Array of persistent effects
 * @param effectId - ID of effect to compensate
 * @param currentTurn - Current turn number
 * @param baseCost - Base cost for compensation
 * @returns Updated effects array and result
 */
export function applyCompensationToCollection(
    effects: PersistentEffect[],
    effectId: string,
    currentTurn: number,
    baseCost: number
): { effects: PersistentEffect[]; result: CompensationResult } {
    const effectIndex = effects.findIndex((e) => e.id === effectId);

    if (effectIndex === -1) {
        return {
            effects,
            result: {
                success: false,
                updatedEffect: {} as PersistentEffect,
                costCharged: 0,
                error: `Effect not found: ${effectId}`,
            },
        };
    }

    const effect = effects[effectIndex];
    const option = createCompensationOption({
        effect,
        baseCost,
        currentTurn,
    });

    const result = applyCompensation(effect, option);

    if (!result.success) {
        return { effects, result };
    }

    // Create new array with updated effect
    const newEffects = [...effects];
    newEffects[effectIndex] = result.updatedEffect;

    return {
        effects: newEffects,
        result,
    };
}

// ============================================
// FORMATTING HELPERS
// ============================================

/**
 * Formats compensation cost for display
 *
 * @param option - Compensation option
 * @returns Formatted string like "160 € (+60%)"
 */
export function formatCompensationCost(option: CompensationOption): string {
    const increase = Math.round((option.costMultiplier - 1) * 100);

    if (increase === 0) {
        return `${option.currentCost} €`;
    }

    return `${option.currentCost} € (+${increase}%)`;
}

/**
 * Formats the viability status for display
 *
 * @param option - Compensation option
 * @param locale - Locale for text (default: 'fr')
 * @returns Formatted status string
 */
export function formatViabilityStatus(
    option: CompensationOption,
    locale: string = 'fr'
): string {
    if (option.isViable) {
        return locale === 'fr' ? 'Compensation possible' : 'Compensation available';
    }
    return locale === 'fr' ? 'Effet trop atténué' : 'Effect too depleted';
}
