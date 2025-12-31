/**
 * Delayed Effects Module
 *
 * @module lib/engine/delayed-effects
 * @description Management of delayed effects: creation, filtering, decay (US-021)
 *
 * References:
 * - docs/20_simulation/effets_retard.md (delay tables, decay formula)
 * - docs/20_simulation/indices.md (INV-BIZ-09)
 */

import type { IndexId } from './types';
import {
    type DelayedEffect,
    type EffectDomain,
    type EffectType,
    type GameSpeed,
    type DelayedEffectsQueue,
    DEFAULT_EFFECT_CONFIGS,
    SPEED_MULTIPLIERS,
    DELAYED_INDICES,
} from './effects-types';

// ============================================
// TYPES
// ============================================

/**
 * Parameters for creating a delayed effect
 */
export interface CreateEffectParams {
    /** Unique ID for the decision that triggers this effect */
    decisionId: string;
    /** Business domain of the effect */
    domain: EffectDomain;
    /** Target index to modify */
    targetIndex: IndexId;
    /** Effect value (magnitude) */
    value: number;
    /** Current turn number */
    currentTurn: number;
    /** Game speed for delay calculation */
    speed?: GameSpeed;
    /** Optional seed for reproducible variance */
    seed?: number;
    /** Effect type (default: 'relative') */
    effectType?: EffectType;
    /** Human-readable description */
    description?: string;
}

// ============================================
// ID GENERATION
// ============================================

let effectCounter = 0;

/**
 * Generates a unique effect ID
 * @param decisionId - The parent decision ID
 * @returns Unique effect identifier
 */
export function generateEffectId(decisionId: string): string {
    effectCounter++;
    return `eff-${decisionId}-${effectCounter}-${Date.now().toString(36)}`;
}

/**
 * Resets the effect counter (for testing)
 */
export function resetEffectCounter(): void {
    effectCounter = 0;
}

// ============================================
// SEEDED RANDOM
// ============================================

/**
 * Simple seeded random number generator (mulberry32)
 * Used for reproducible delay variance
 *
 * @param seed - Seed value
 * @returns Random number in [0, 1)
 */
export function seededRandom(seed: number): number {
    let t = (seed + 0x6d2b79f5) | 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// ============================================
// DELAY CALCULATION
// ============================================

/**
 * Calculates the effective delay for an effect
 *
 * @param domain - Effect business domain
 * @param speed - Game speed
 * @param seed - Optional seed for variance (if domain has variance)
 * @returns Delay in turns (minimum 1 for delayed indices)
 *
 * @remarks
 * Formula: `delay = max(1, ceil(baseDelay × speedFactor + variance))`
 *
 * INV-DELAY-05: `delai_final = max(1, ceil(delai_base × facteur_vitesse × facteur_difficulte))`
 */
export function calculateDelay(
    domain: EffectDomain,
    speed: GameSpeed = 'moyenne',
    seed?: number
): number {
    const config = DEFAULT_EFFECT_CONFIGS[domain];
    const speedFactor = SPEED_MULTIPLIERS[speed];

    let baseDelay = config.baseDelay * speedFactor;

    // Add variance if configured and seed provided
    if (config.delayVariance && seed !== undefined) {
        const variance = seededRandom(seed) * config.delayVariance;
        baseDelay += variance;
    }

    // Minimum delay of 1 turn (INV-DELAY-02: no retroactive effects)
    return Math.max(1, Math.ceil(baseDelay));
}

// ============================================
// EFFECT CREATION
// ============================================

/**
 * Creates a new delayed effect
 *
 * @param params - Effect creation parameters
 * @returns New DelayedEffect instance
 *
 * @example
 * ```ts
 * const effect = createDelayedEffect({
 *   decisionId: 'dec-123',
 *   domain: 'rh',
 *   targetIndex: 'IERH',
 *   value: 10,
 *   currentTurn: 3,
 * });
 * // effect.appliesAtTurn === 5 (3 + 2 for RH domain)
 * ```
 */
export function createDelayedEffect(params: CreateEffectParams): DelayedEffect {
    const {
        decisionId,
        domain,
        targetIndex,
        value,
        currentTurn,
        speed = 'moyenne',
        seed,
        effectType = 'relative',
        description,
    } = params;

    const config = DEFAULT_EFFECT_CONFIGS[domain];
    let delay = calculateDelay(domain, speed, seed);

    // INV-BIZ-09: Minimum 1T delay for structural financial indices
    if (DELAYED_INDICES.includes(targetIndex) && delay < 1) {
        delay = 1;
    }

    const effect: DelayedEffect = {
        id: generateEffectId(decisionId),
        decisionId,
        targetIndex,
        effectType,
        value,
        createdAtTurn: currentTurn,
        appliesAtTurn: currentTurn + delay,
        decayRate: config.decayRate,
        domain,
        description,
        isApplied: false,
    };

    console.log(
        `[EFFECT] Created: ${effect.id} → ${targetIndex} ${value >= 0 ? '+' : ''}${value} at T+${delay}`
    );

    return effect;
}

// ============================================
// DECAY CALCULATION
// ============================================

/**
 * Applies decay formula to an effect value
 *
 * @param initialValue - Original effect value
 * @param decayRate - Per-turn decay rate [0, 1]
 * @param turnsElapsed - Number of turns since creation
 * @returns Decayed value
 *
 * @remarks
 * Formula: `Effet(t) = Effet_Initial × (1 - decay_rate)^turnsElapsed`
 *
 * @example
 * ```ts
 * // Initial 10 with 20% decay after 3 turns
 * // 10 × (0.8)³ = 10 × 0.512 = 5.12
 * const decayed = applyDecay(10, 0.2, 3);
 * // decayed ≈ 5.12
 * ```
 */
export function applyDecay(
    initialValue: number,
    decayRate: number,
    turnsElapsed: number
): number {
    if (turnsElapsed <= 0) {
        return initialValue;
    }

    const retentionRate = 1 - decayRate;
    const decayFactor = Math.pow(retentionRate, turnsElapsed);

    return initialValue * decayFactor;
}

/**
 * Gets the current effective value of a delayed effect
 *
 * @param effect - The delayed effect
 * @param currentTurn - Current turn number
 * @returns Current effective value after decay
 */
export function getEffectiveValue(
    effect: DelayedEffect,
    currentTurn: number
): number {
    const turnsElapsed = currentTurn - effect.createdAtTurn;
    return applyDecay(effect.value, effect.decayRate, turnsElapsed);
}

// ============================================
// EFFECT FILTERING
// ============================================

/**
 * Gets all effects that should be applied at the current turn
 *
 * @param queue - The effects queue
 * @param currentTurn - Current turn number
 * @returns Effects ready to apply this turn
 */
export function getActiveEffects(
    queue: DelayedEffectsQueue,
    currentTurn: number
): DelayedEffect[] {
    return queue.pending.filter(
        (effect) => effect.appliesAtTurn === currentTurn && !effect.isApplied
    );
}

/**
 * Gets all pending effects for a specific target index
 *
 * @param queue - The effects queue
 * @param targetIndex - Target index to filter by
 * @returns Pending effects for the target
 */
export function getEffectsByTarget(
    queue: DelayedEffectsQueue,
    targetIndex: IndexId
): DelayedEffect[] {
    return queue.pending.filter((effect) => effect.targetIndex === targetIndex);
}

/**
 * Gets all pending effects for a specific domain
 *
 * @param queue - The effects queue
 * @param domain - Domain to filter by
 * @returns Pending effects from the domain
 */
export function getEffectsByDomain(
    queue: DelayedEffectsQueue,
    domain: EffectDomain
): DelayedEffect[] {
    return queue.pending.filter((effect) => effect.domain === domain);
}

/**
 * Gets upcoming effects for display in UI
 *
 * @param queue - The effects queue
 * @param currentTurn - Current turn number
 * @param lookAhead - Number of turns to look ahead (default: 3)
 * @returns Effects grouped by turn
 */
export function getUpcomingEffects(
    queue: DelayedEffectsQueue,
    currentTurn: number,
    lookAhead: number = 3
): Map<number, DelayedEffect[]> {
    const result = new Map<number, DelayedEffect[]>();

    for (let turn = currentTurn; turn <= currentTurn + lookAhead; turn++) {
        const effects = queue.pending.filter(
            (effect) => effect.appliesAtTurn === turn && !effect.isApplied
        );
        if (effects.length > 0) {
            result.set(turn, effects);
        }
    }

    return result;
}

// ============================================
// QUEUE MANAGEMENT
// ============================================

/**
 * Adds an effect to the queue
 *
 * @param queue - The effects queue
 * @param effect - Effect to add
 * @returns Updated queue
 */
export function addEffectToQueue(
    queue: DelayedEffectsQueue,
    effect: DelayedEffect
): DelayedEffectsQueue {
    return {
        ...queue,
        pending: [...queue.pending, effect],
    };
}

/**
 * Marks effects as applied and moves them to history
 *
 * @param queue - The effects queue
 * @param effectIds - IDs of effects to mark as applied
 * @returns Updated queue
 */
export function markEffectsApplied(
    queue: DelayedEffectsQueue,
    effectIds: string[]
): DelayedEffectsQueue {
    const effectIdSet = new Set(effectIds);

    const stillPending: DelayedEffect[] = [];
    const newlyApplied: DelayedEffect[] = [];

    for (const effect of queue.pending) {
        if (effectIdSet.has(effect.id)) {
            newlyApplied.push({ ...effect, isApplied: true });
            console.log(`[EFFECT] Applied: ${effect.id} → ${effect.targetIndex}`);
        } else {
            stillPending.push(effect);
        }
    }

    return {
        pending: stillPending,
        applied: [...queue.applied, ...newlyApplied],
    };
}

/**
 * Removes expired effects from history (for cleanup)
 *
 * @param queue - The effects queue
 * @param maxHistoryTurns - Maximum turns to keep in history
 * @param currentTurn - Current turn number
 * @returns Updated queue with trimmed history
 */
export function cleanupEffectHistory(
    queue: DelayedEffectsQueue,
    maxHistoryTurns: number,
    currentTurn: number
): DelayedEffectsQueue {
    const cutoffTurn = currentTurn - maxHistoryTurns;

    return {
        ...queue,
        applied: queue.applied.filter(
            (effect) => effect.appliesAtTurn >= cutoffTurn
        ),
    };
}
