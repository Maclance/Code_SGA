/**
 * Effect Persistence Module
 *
 * @module lib/engine/effect-persistence
 * @description Persistent effects with decay over time (US-024)
 *
 * References:
 * - docs/20_simulation/effets_retard.md (section persistance)
 * - docs/000_projet/specs_fonctionnelles_mvp.md (US-024)
 *
 * Formulas:
 * - Decay: Effet(t) = Effet_Initial × (1 - decay_rate)^(t - t_decision)
 * - Depletion threshold: < 0.5 → status='depleted'
 */

import type { IndexId } from './types';

// ============================================
// CONSTANTS
// ============================================

/**
 * Minimum effect value threshold.
 * Effects below this are considered depleted and ignored.
 */
export const DEPLETION_THRESHOLD = 0.5;

// ============================================
// TYPES
// ============================================

/**
 * Status of a persistent effect
 * - active: Effect is still producing impact
 * - depleted: Effect has decayed below threshold
 * - compensated: Effect was neutralized by compensation
 */
export type PersistentEffectStatus = 'active' | 'depleted' | 'compensated';

/**
 * A persistent effect that decays over time
 *
 * @remarks
 * Effects from decisions persist across turns but attenuate
 * following the decay formula until reaching depletion.
 *
 * @example
 * ```ts
 * const effect: PersistentEffect = {
 *   id: 'peff-001',
 *   decisionId: 'dec-123',
 *   originalValue: 10,
 *   currentValue: 8.1,  // after decay
 *   createdAtTurn: 3,
 *   lastCalculatedTurn: 4,
 *   decayRate: 0.2,
 *   targetIndex: 'IERH',
 *   status: 'active',
 * };
 * ```
 */
export interface PersistentEffect {
    /** Unique identifier for this persistent effect */
    id: string;
    /** ID of the decision that created this effect */
    decisionId: string;
    /** Original effect value at creation */
    originalValue: number;
    /** Current effect value after decay */
    currentValue: number;
    /** Turn when the effect was created */
    createdAtTurn: number;
    /** Turn when currentValue was last calculated */
    lastCalculatedTurn: number;
    /** Per-turn decay rate [0, 1] */
    decayRate: number;
    /** Target index affected by this effect */
    targetIndex: IndexId;
    /** Current status of the effect */
    status: PersistentEffectStatus;
    /** Human-readable description */
    description?: string;
}

/**
 * Parameters for creating a persistent effect
 */
export interface CreatePersistentEffectParams {
    /** Decision ID that triggered this effect */
    decisionId: string;
    /** Initial effect value */
    value: number;
    /** Target index to modify */
    targetIndex: IndexId;
    /** Per-turn decay rate [0, 1] */
    decayRate: number;
    /** Turn when created */
    currentTurn: number;
    /** Human-readable description */
    description?: string;
}

// ============================================
// ID GENERATION
// ============================================

let persistentEffectCounter = 0;

/**
 * Generates a unique persistent effect ID
 * @param decisionId - The parent decision ID
 * @returns Unique persistent effect identifier
 */
export function generatePersistentEffectId(decisionId: string): string {
    persistentEffectCounter++;
    return `peff-${decisionId}-${persistentEffectCounter}-${Date.now().toString(36)}`;
}

/**
 * Resets the effect counter (for testing)
 */
export function resetPersistentEffectCounter(): void {
    persistentEffectCounter = 0;
}

// ============================================
// DECAY CALCULATION
// ============================================

/**
 * Calculates the decayed effect value
 *
 * @param originalValue - Original effect value at creation
 * @param decayRate - Per-turn decay rate [0, 1]
 * @param turnsElapsed - Number of turns since creation
 * @returns Decayed value
 *
 * @remarks
 * Formula: Effet(t) = Effet_Initial × (1 - decay_rate)^turnsElapsed
 *
 * @example
 * ```ts
 * // Initial 10 with 20% decay after 3 turns
 * // 10 × (1-0.2)³ = 10 × 0.8³ = 10 × 0.512 = 5.12
 * const decayed = calculateDecayedEffect(10, 0.2, 3);
 * // decayed ≈ 5.12
 * ```
 */
export function calculateDecayedEffect(
    originalValue: number,
    decayRate: number,
    turnsElapsed: number
): number {
    if (turnsElapsed <= 0) {
        return originalValue;
    }

    // Clamp decay rate to valid range
    const clampedRate = Math.max(0, Math.min(1, decayRate));
    const retentionRate = 1 - clampedRate;
    const decayFactor = Math.pow(retentionRate, turnsElapsed);

    return originalValue * decayFactor;
}

/**
 * Determines the status of an effect based on its current value
 *
 * @param currentValue - Current effect value
 * @param existingStatus - Existing status (compensated overrides)
 * @returns Effect status
 */
export function getEffectStatus(
    currentValue: number,
    existingStatus?: PersistentEffectStatus
): PersistentEffectStatus {
    // Compensated status is permanent
    if (existingStatus === 'compensated') {
        return 'compensated';
    }

    // Check depletion threshold
    if (Math.abs(currentValue) < DEPLETION_THRESHOLD) {
        return 'depleted';
    }

    return 'active';
}

// ============================================
// EFFECT MANAGEMENT
// ============================================

/**
 * Creates a new persistent effect
 *
 * @param params - Creation parameters
 * @returns New PersistentEffect instance
 *
 * @example
 * ```ts
 * const effect = createPersistentEffect({
 *   decisionId: 'dec-001',
 *   value: 10,
 *   targetIndex: 'IERH',
 *   decayRate: 0.2,
 *   currentTurn: 3,
 *   description: 'Décision RH négative',
 * });
 * ```
 */
export function createPersistentEffect(
    params: CreatePersistentEffectParams
): PersistentEffect {
    const {
        decisionId,
        value,
        targetIndex,
        decayRate,
        currentTurn,
        description,
    } = params;

    const effect: PersistentEffect = {
        id: generatePersistentEffectId(decisionId),
        decisionId,
        originalValue: value,
        currentValue: value,
        createdAtTurn: currentTurn,
        lastCalculatedTurn: currentTurn,
        decayRate,
        targetIndex,
        status: 'active',
        description,
    };

    console.log(
        `[PERSIST] Created: ${effect.id} → ${targetIndex} initial=${value}`
    );

    return effect;
}

/**
 * Updates a persistent effect for the current turn
 * Recalculates the current value with decay and updates status
 *
 * @param effect - The effect to update
 * @param currentTurn - Current turn number
 * @returns Updated effect (immutable)
 *
 * @remarks
 * This function:
 * 1. Calculates decay from creation turn
 * 2. Updates currentValue
 * 3. Checks depletion threshold
 * 4. Updates status if needed
 */
export function updatePersistentEffect(
    effect: PersistentEffect,
    currentTurn: number
): PersistentEffect {
    // Compensated effects don't decay
    if (effect.status === 'compensated') {
        return {
            ...effect,
            lastCalculatedTurn: currentTurn,
        };
    }

    // Already depleted
    if (effect.status === 'depleted') {
        return {
            ...effect,
            lastCalculatedTurn: currentTurn,
        };
    }

    // Calculate decay from creation
    const turnsElapsed = currentTurn - effect.createdAtTurn;
    const newValue = calculateDecayedEffect(
        effect.originalValue,
        effect.decayRate,
        turnsElapsed
    );

    // Determine new status
    const newStatus = getEffectStatus(newValue, effect.status);

    // Log state changes
    const wasActive = effect.status === 'active';
    if (newStatus === 'depleted' && wasActive) {
        console.log(
            `[PERSIST] Effet épuisé: ${effect.id} → value=${newValue.toFixed(3)}`
        );
    } else if (effect.lastCalculatedTurn !== currentTurn) {
        console.log(
            `[PERSIST] Effet décayi: ${effect.id} → ${effect.currentValue.toFixed(2)} → ${newValue.toFixed(2)}`
        );
    }

    return {
        ...effect,
        currentValue: newValue,
        lastCalculatedTurn: currentTurn,
        status: newStatus,
    };
}

/**
 * Updates all effects in a collection for the current turn
 *
 * @param effects - Array of persistent effects
 * @param currentTurn - Current turn number
 * @returns Updated effects array
 */
export function updateAllPersistentEffects(
    effects: PersistentEffect[],
    currentTurn: number
): PersistentEffect[] {
    return effects.map((effect) => updatePersistentEffect(effect, currentTurn));
}

// ============================================
// FILTERING HELPERS
// ============================================

/**
 * Gets all active effects (not depleted or compensated)
 *
 * @param effects - Array of persistent effects
 * @returns Active effects only
 */
export function getActiveEffects(effects: PersistentEffect[]): PersistentEffect[] {
    return effects.filter((effect) => effect.status === 'active');
}

/**
 * Gets effects by target index
 *
 * @param effects - Array of persistent effects
 * @param targetIndex - Target index to filter by
 * @returns Filtered effects
 */
export function getEffectsByIndex(
    effects: PersistentEffect[],
    targetIndex: IndexId
): PersistentEffect[] {
    return effects.filter((effect) => effect.targetIndex === targetIndex);
}

/**
 * Gets effects created within a turn range (for history)
 *
 * @param effects - Array of persistent effects
 * @param fromTurn - Start turn (inclusive)
 * @param toTurn - End turn (inclusive)
 * @returns Effects within range
 */
export function getEffectsInRange(
    effects: PersistentEffect[],
    fromTurn: number,
    toTurn: number
): PersistentEffect[] {
    return effects.filter(
        (effect) =>
            effect.createdAtTurn >= fromTurn && effect.createdAtTurn <= toTurn
    );
}

/**
 * Gets the net effect on a specific index from all active effects
 *
 * @param effects - Array of persistent effects
 * @param targetIndex - Target index
 * @returns Total current value from all active effects
 */
export function getNetEffectOnIndex(
    effects: PersistentEffect[],
    targetIndex: IndexId
): number {
    return effects
        .filter((e) => e.status === 'active' && e.targetIndex === targetIndex)
        .reduce((sum, e) => sum + e.currentValue, 0);
}

/**
 * Checks if an effect is still viable for compensation
 *
 * @param effect - The effect to check
 * @returns True if effect can be compensated
 */
export function isEffectViableForCompensation(effect: PersistentEffect): boolean {
    return effect.status === 'active' && Math.abs(effect.currentValue) >= DEPLETION_THRESHOLD;
}
