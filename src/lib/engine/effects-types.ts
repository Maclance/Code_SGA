/**
 * Effects Types - Delayed Effects System
 *
 * @module lib/engine/effects-types
 * @description Type definitions for delayed effects, stacking and caps (US-021)
 *
 * References:
 * - docs/20_simulation/effets_retard.md
 * - docs/20_simulation/indices.md (INV-BIZ-08, INV-BIZ-09)
 */

import type { IndexId } from './types';

// Re-export IndexId for convenience
export type { IndexId };

// ============================================
// DOMAIN & EFFECT TYPES
// ============================================

/**
 * Effect domains with specific delay/decay configurations
 * Each domain maps to a business area with different time constants
 */
export type EffectDomain =
    | 'rh'
    | 'it'
    | 'prevention'
    | 'reputation'
    | 'marketing'
    | 'tarif';

/**
 * How the effect value is applied
 * - absolute: direct value change (e.g., +5 points)
 * - relative: percentage change (e.g., +10%)
 */
export type EffectType = 'absolute' | 'relative';

/**
 * Game speed affecting delay calculations
 */
export type GameSpeed = 'rapide' | 'moyenne' | 'lente';

// ============================================
// DELAYED EFFECT
// ============================================

/**
 * A delayed effect awaiting application at a future turn
 *
 * @remarks
 * Effects are created when a decision is made but only applied
 * after the delay period. They persist with decay over time.
 *
 * @example
 * ```ts
 * const effect: DelayedEffect = {
 *   id: 'eff-001',
 *   decisionId: 'dec-123',
 *   targetIndex: 'IERH',
 *   effectType: 'relative',
 *   value: 10,
 *   createdAtTurn: 3,
 *   appliesAtTurn: 5,
 *   decayRate: 0.1,
 *   domain: 'rh',
 *   description: 'Recrutement 10 ETP → +10% IERH',
 * };
 * ```
 */
export interface DelayedEffect {
    /** Unique identifier for this effect */
    id: string;
    /** ID of the decision that created this effect */
    decisionId: string;
    /** Target index to modify */
    targetIndex: IndexId;
    /** How the value is applied (absolute vs relative) */
    effectType: EffectType;
    /** Effect magnitude (before decay) */
    value: number;
    /** Turn when the effect was created */
    createdAtTurn: number;
    /** Turn when the effect will be applied */
    appliesAtTurn: number;
    /** Per-turn decay rate [0, 1] */
    decayRate: number;
    /** Business domain of the effect */
    domain: EffectDomain;
    /** Human-readable description for UI */
    description?: string;
    /** Whether the effect has been applied */
    isApplied?: boolean;
}

// ============================================
// EFFECT STACKING
// ============================================

/**
 * Stack of effects targeting the same index in a single turn
 *
 * @remarks
 * INV-BIZ-08: Σ relative effects on same target ≤ ±50%
 *
 * @example
 * ```ts
 * const stack: EffectStack = {
 *   targetIndex: 'IAC',
 *   effects: [effect1, effect2, effect3],
 *   totalDelta: 80,
 *   cappedDelta: 50,
 *   capApplied: true,
 * };
 * ```
 */
export interface EffectStack {
    /** Target index for this stack */
    targetIndex: IndexId;
    /** All effects in this stack */
    effects: DelayedEffect[];
    /** Sum of all effect values (before cap) */
    totalDelta: number;
    /** Final delta after cap applied */
    cappedDelta: number;
    /** Whether the cap was triggered */
    capApplied: boolean;
}

// ============================================
// EFFECT CONFIGURATION
// ============================================

/**
 * Configuration for a specific effect domain
 * Controls delay, decay, and stacking limits
 */
export interface EffectConfig {
    /** Domain this config applies to */
    domain: EffectDomain;
    /** Base delay in turns (at Medium speed) */
    baseDelay: number;
    /** Optional random variance on delay [0, variance] */
    delayVariance?: number;
    /** Per-turn decay rate [0, 1] */
    decayRate: number;
    /** Maximum concurrent effects from this domain */
    maxStack: number;
}

// ============================================
// CONSTANTS
// ============================================

/**
 * Maximum relative effect cap (INV-BIZ-08)
 * Total relative effects on same target capped at ±50%
 */
export const RELATIVE_EFFECT_CAP = 50;

/**
 * Speed multipliers for delay calculation
 * - Rapide (1 year/turn): ÷2
 * - Moyenne (1 quarter/turn): ×1
 * - Lente (1 month/turn): ×3
 */
export const SPEED_MULTIPLIERS: Record<GameSpeed, number> = {
    rapide: 0.5,
    moyenne: 1.0,
    lente: 3.0,
} as const;

/**
 * Default effect configurations by domain
 *
 * | Domain     | Base Delay | Decay Rate |
 * |------------|:----------:|:----------:|
 * | RH         | 2          | 0.10       |
 * | IT         | 4          | 0.15       |
 * | Prevention | 6          | 0.05       |
 * | Reputation | 2          | 0.20       |
 * | Marketing  | 1          | 0.25       |
 * | Tarif      | 0          | 0.30       |
 */
export const DEFAULT_EFFECT_CONFIGS: Record<EffectDomain, EffectConfig> = {
    rh: {
        domain: 'rh',
        baseDelay: 2,
        decayRate: 0.10,
        maxStack: 5,
    },
    it: {
        domain: 'it',
        baseDelay: 4,
        delayVariance: 2, // 3-6 turns
        decayRate: 0.15,
        maxStack: 3,
    },
    prevention: {
        domain: 'prevention',
        baseDelay: 6,
        delayVariance: 2, // 4-8 turns
        decayRate: 0.05,
        maxStack: 3,
    },
    reputation: {
        domain: 'reputation',
        baseDelay: 2,
        delayVariance: 1, // 1-3 turns
        decayRate: 0.20,
        maxStack: 5,
    },
    marketing: {
        domain: 'marketing',
        baseDelay: 1,
        delayVariance: 1, // 1-2 turns
        decayRate: 0.25,
        maxStack: 5,
    },
    tarif: {
        domain: 'tarif',
        baseDelay: 0,
        decayRate: 0.30,
        maxStack: 10,
    },
} as const;

/**
 * Indices that require minimum 1 turn delay (INV-BIZ-09)
 * These are structural financial indicators
 */
export const DELAYED_INDICES: readonly IndexId[] = ['IPP', 'IRF', 'IS'] as const;

// ============================================
// EFFECT QUEUE TYPE (for game state storage)
// ============================================

/**
 * Queue of pending delayed effects
 * Stored in game_states.state JSONB as delayed_effects_queue
 */
export interface DelayedEffectsQueue {
    /** Pending effects not yet applied */
    pending: DelayedEffect[];
    /** Applied effects kept for history/explainability */
    applied: DelayedEffect[];
}

/**
 * Creates an empty effects queue
 */
export function createEmptyEffectsQueue(): DelayedEffectsQueue {
    return {
        pending: [],
        applied: [],
    };
}

// ============================================
// RE-EXPORTS FROM DELAY CONFIG (US-023)
// ============================================

export {
    type GameSpeed as GameSpeedEN,
    type GameSpeedFR,
    DELAY_CONFIGS,
    getDelayConfig,
    getDelayForDomain,
    getDelayRange,
    getDecayRate,
    toFrenchSpeed,
    toEnglishSpeed,
    isValidGameSpeed,
    isValidGameSpeedFR,
    SPEED_EN_TO_FR,
    SPEED_FR_TO_EN,
} from './config/delay-config';

// ============================================
// DELAYED EFFECT DISPLAY (UI - US-023)
// ============================================

/**
 * Delayed effect formatted for UI display
 *
 * @remarks
 * Used by DelayedEffectIndicator and EffectTimeline components
 * to show pending effects to the player.
 *
 * @example
 * ```ts
 * const display: DelayedEffectDisplay = {
 *   effectId: 'eff-001',
 *   description: 'Recrutement sinistres → +8 IPQO',
 *   expectedTurn: 5,
 *   turnsRemaining: 2,
 *   intensity: 'high',
 *   targetIndex: 'IPQO',
 *   estimatedImpact: { min: 6, max: 10 },
 * };
 * ```
 */
export interface DelayedEffectDisplay {
    /** Unique effect identifier */
    effectId: string;
    /** Human-readable description for UI */
    description: string;
    /** Turn when effect will be applied */
    expectedTurn: number;
    /** Number of turns until application */
    turnsRemaining: number;
    /** Current intensity level (decays over time) */
    intensity: 'low' | 'medium' | 'high';
    /** Target index that will be affected */
    targetIndex: IndexId;
    /** Estimated impact range (after decay) */
    estimatedImpact: { min: number; max: number };
    /** Business domain of the effect */
    domain?: EffectDomain;
    /** Decision ID that created this effect */
    decisionId?: string;
}

// ============================================
// EFFECT HISTORY (US-024)
// ============================================

/**
 * Status of an effect in history
 */
export type EffectHistoryStatus = 'active' | 'depleted' | 'compensated';

/**
 * Entry in the effect history for UI display
 */
export interface EffectHistoryEntry {
    /** Turn when the decision was made */
    turnNumber: number;
    /** ID of the decision */
    decisionId: string;
    /** Human-readable description */
    decisionDescription: string;
    /** Target index affected */
    targetIndex: IndexId;
    /** Initial effect value */
    initialEffect: number;
    /** Current effect value after decay */
    currentEffect: number;
    /** Current status */
    status: EffectHistoryStatus;
    /** Whether compensation is available */
    canCompensate?: boolean;
}
