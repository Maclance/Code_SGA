/**
 * Effect Stacking Module
 *
 * @module lib/engine/effect-stacking
 * @description Effect stacking and caps management (US-021)
 *
 * References:
 * - docs/20_simulation/indices.md (INV-BIZ-08)
 * - docs/20_simulation/effets_retard.md
 */

import type { IndexId } from './types';
import { INDEX_IDS } from './types';
import {
    type DelayedEffect,
    type EffectStack,
    type DelayedEffectsQueue,
    RELATIVE_EFFECT_CAP,
} from './effects-types';
import { getActiveEffects, getEffectiveValue } from './delayed-effects';

// ============================================
// EFFECT STACKING
// ============================================

/**
 * Groups effects by their target index
 *
 * @param effects - List of effects to group
 * @param currentTurn - Current turn for decay calculation
 * @returns Map of target index to effect stack
 *
 * @example
 * ```ts
 * const stacks = stackEffects([effect1, effect2, effect3], 5);
 * // stacks.get('IAC') → EffectStack for IAC
 * ```
 */
export function stackEffects(
    effects: DelayedEffect[],
    currentTurn: number
): Map<IndexId, EffectStack> {
    const stacks = new Map<IndexId, EffectStack>();

    // Initialize stacks for each index
    for (const indexId of INDEX_IDS) {
        stacks.set(indexId, {
            targetIndex: indexId,
            effects: [],
            totalDelta: 0,
            cappedDelta: 0,
            capApplied: false,
        });
    }

    // Group effects by target
    for (const effect of effects) {
        const stack = stacks.get(effect.targetIndex);
        if (stack) {
            stack.effects.push(effect);
            // Calculate effective value with decay
            const effectiveValue = getEffectiveValue(effect, currentTurn);
            stack.totalDelta += effectiveValue;
        }
    }

    return stacks;
}

/**
 * Stacks effects from a queue for the current turn
 *
 * @param queue - The effects queue
 * @param currentTurn - Current turn number
 * @returns Map of stacked effects by target index
 */
export function stackEffectsFromQueue(
    queue: DelayedEffectsQueue,
    currentTurn: number
): Map<IndexId, EffectStack> {
    const activeEffects = getActiveEffects(queue, currentTurn);
    return stackEffects(activeEffects, currentTurn);
}

// ============================================
// CAP APPLICATION
// ============================================

/**
 * Applies the relative effect cap to a single stack
 *
 * @param stack - Effect stack to cap
 * @returns Stack with cap applied
 *
 * @remarks
 * INV-BIZ-08: Σ effets_relatifs sur même cible dans même tour ≤ ±50%
 */
export function applyCap(stack: EffectStack): EffectStack {
    const { totalDelta, targetIndex } = stack;

    if (Math.abs(totalDelta) <= RELATIVE_EFFECT_CAP) {
        return {
            ...stack,
            cappedDelta: totalDelta,
            capApplied: false,
        };
    }

    // Cap triggered
    const cappedDelta = Math.sign(totalDelta) * RELATIVE_EFFECT_CAP;

    console.log(
        `[CAP] Cap déclenché sur ${targetIndex}: ${totalDelta.toFixed(2)} → ${cappedDelta}`
    );

    return {
        ...stack,
        cappedDelta,
        capApplied: true,
    };
}

/**
 * Applies caps to all effect stacks
 *
 * @param stacks - Map of effect stacks
 * @returns Map with caps applied
 */
export function applyCaps(
    stacks: Map<IndexId, EffectStack>
): Map<IndexId, EffectStack> {
    const result = new Map<IndexId, EffectStack>();

    for (const [indexId, stack] of stacks) {
        result.set(indexId, applyCap(stack));
    }

    return result;
}

// ============================================
// NET EFFECT CALCULATION
// ============================================

/**
 * Result of effect calculation for a single index
 */
export interface EffectResult {
    /** Target index */
    targetIndex: IndexId;
    /** Net delta to apply (after cap) */
    netDelta: number;
    /** Number of effects contributing */
    effectCount: number;
    /** Whether cap was applied */
    capApplied: boolean;
    /** Individual effect contributions */
    contributions: Array<{
        effectId: string;
        value: number;
        domain: string;
        description?: string;
    }>;
}

/**
 * Calculates the net effect for a single stack
 *
 * @param stack - The effect stack (after cap applied)
 * @param currentTurn - Current turn for decay
 * @returns Effect result with details
 */
export function calculateStackResult(
    stack: EffectStack,
    currentTurn: number
): EffectResult {
    return {
        targetIndex: stack.targetIndex,
        netDelta: stack.cappedDelta,
        effectCount: stack.effects.length,
        capApplied: stack.capApplied,
        contributions: stack.effects.map((effect) => ({
            effectId: effect.id,
            value: getEffectiveValue(effect, currentTurn),
            domain: effect.domain,
            description: effect.description,
        })),
    };
}

/**
 * Calculates net effects for all indices from a queue
 *
 * @param queue - The effects queue
 * @param currentTurn - Current turn number
 * @returns Array of effect results for indices with effects
 */
export function calculateNetEffects(
    queue: DelayedEffectsQueue,
    currentTurn: number
): EffectResult[] {
    const stacks = stackEffectsFromQueue(queue, currentTurn);
    const cappedStacks = applyCaps(stacks);

    const results: EffectResult[] = [];

    for (const stack of cappedStacks.values()) {
        if (stack.effects.length > 0) {
            results.push(calculateStackResult(stack, currentTurn));
        }
    }

    return results;
}

/**
 * Simplified function to get the net delta for a specific index
 *
 * @param queue - The effects queue
 * @param currentTurn - Current turn number
 * @param targetIndex - Index to get delta for
 * @returns Net delta value (after cap)
 */
export function calculateNetEffect(
    queue: DelayedEffectsQueue,
    currentTurn: number,
    targetIndex: IndexId
): number {
    const stacks = stackEffectsFromQueue(queue, currentTurn);
    const stack = stacks.get(targetIndex);

    if (!stack || stack.effects.length === 0) {
        return 0;
    }

    const capped = applyCap(stack);
    return capped.cappedDelta;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Checks if any cap was triggered in a set of stacks
 *
 * @param stacks - Map of effect stacks
 * @returns True if any cap was applied
 */
export function hasCapTriggered(stacks: Map<IndexId, EffectStack>): boolean {
    for (const stack of stacks.values()) {
        if (stack.capApplied) {
            return true;
        }
    }
    return false;
}

/**
 * Gets all stacks where cap was triggered
 *
 * @param stacks - Map of effect stacks
 * @returns Array of stacks with caps triggered
 */
export function getCappedStacks(
    stacks: Map<IndexId, EffectStack>
): EffectStack[] {
    return Array.from(stacks.values()).filter((stack) => stack.capApplied);
}

/**
 * Summarizes effects for UI display
 *
 * @param results - Effect results
 * @returns Formatted summary string
 */
export function summarizeEffects(results: EffectResult[]): string {
    if (results.length === 0) {
        return 'Aucun effet appliqué ce tour';
    }

    const lines = results.map((r) => {
        const sign = r.netDelta >= 0 ? '+' : '';
        const capNote = r.capApplied ? ' (cap)' : '';
        return `${r.targetIndex} ${sign}${r.netDelta.toFixed(1)}${capNote}`;
    });

    return lines.join(' | ');
}
