/**
 * Delayed Effects Unit Tests
 *
 * @module tests/engine/delayed-effects.test
 * @description Unit tests for delayed effects system (US-021)
 *
 * References:
 * - docs/20_simulation/effets_retard.md
 * - docs/20_simulation/indices.md (INV-BIZ-08, INV-BIZ-09)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    createDelayedEffect,
    applyDecay,
    getActiveEffects,
    getEffectsByTarget,
    getEffectsByDomain,
    getUpcomingEffects,
    addEffectToQueue,
    markEffectsApplied,
    calculateDelay,
    getEffectiveValue,
    seededRandom,
    resetEffectCounter,
    type CreateEffectParams,
} from '@/lib/engine/delayed-effects';
import {
    createEmptyEffectsQueue,
    DEFAULT_EFFECT_CONFIGS,
    DELAYED_INDICES,
    type DelayedEffect,
    type DelayedEffectsQueue,
} from '@/lib/engine/effects-types';

// ============================================
// TEST HELPERS
// ============================================

/**
 * Creates a test effect with defaults
 */
function createTestEffect(overrides: Partial<DelayedEffect> = {}): DelayedEffect {
    return {
        id: 'test-effect-1',
        decisionId: 'dec-001',
        targetIndex: 'IERH',
        effectType: 'relative',
        value: 10,
        createdAtTurn: 1,
        appliesAtTurn: 3,
        decayRate: 0.1,
        domain: 'rh',
        description: 'Test effect',
        isApplied: false,
        ...overrides,
    };
}

/**
 * Creates a queue with some test effects
 */
function createTestQueue(): DelayedEffectsQueue {
    return {
        pending: [
            createTestEffect({ id: 'eff-1', appliesAtTurn: 3, targetIndex: 'IERH' }),
            createTestEffect({ id: 'eff-2', appliesAtTurn: 3, targetIndex: 'IAC' }),
            createTestEffect({ id: 'eff-3', appliesAtTurn: 5, targetIndex: 'IERH' }),
            createTestEffect({ id: 'eff-4', appliesAtTurn: 3, targetIndex: 'IERH', domain: 'it' }),
        ],
        applied: [],
    };
}

// ============================================
// DELAY CALCULATION TESTS
// ============================================

describe('calculateDelay', () => {
    it('should return base delay for RH domain at medium speed', () => {
        const delay = calculateDelay('rh', 'moyenne');
        expect(delay).toBe(DEFAULT_EFFECT_CONFIGS.rh.baseDelay); // 2
    });

    it('should halve delay for fast speed', () => {
        const delay = calculateDelay('rh', 'rapide');
        expect(delay).toBe(1); // ceil(2 * 0.5) = 1
    });

    it('should triple delay for slow speed', () => {
        const delay = calculateDelay('rh', 'lente');
        expect(delay).toBe(6); // ceil(2 * 3) = 6
    });

    it('should add variance when seed provided', () => {
        // IT domain has variance of 2
        const delay1 = calculateDelay('it', 'moyenne', 12345);
        const delay2 = calculateDelay('it', 'moyenne', 99999);
        // Both should be valid but potentially different
        expect(delay1).toBeGreaterThanOrEqual(4);
        expect(delay2).toBeGreaterThanOrEqual(4);
    });

    it('should always return minimum 1 turn delay', () => {
        const delay = calculateDelay('tarif', 'rapide');
        expect(delay).toBeGreaterThanOrEqual(1);
    });
});

// ============================================
// CREATE DELAYED EFFECT TESTS
// ============================================

describe('createDelayedEffect', () => {
    beforeEach(() => {
        resetEffectCounter();
    });

    it('should create RH effect with delay 2 turns (TEST-QA-021-01)', () => {
        const params: CreateEffectParams = {
            decisionId: 'dec-001',
            domain: 'rh',
            targetIndex: 'IERH',
            value: 10,
            currentTurn: 3,
        };

        const effect = createDelayedEffect(params);

        expect(effect.appliesAtTurn).toBe(5); // 3 + 2
        expect(effect.domain).toBe('rh');
        expect(effect.targetIndex).toBe('IERH');
        expect(effect.value).toBe(10);
        expect(effect.createdAtTurn).toBe(3);
        expect(effect.decayRate).toBe(0.1);
        expect(effect.isApplied).toBe(false);
    });

    it('should create IT effect with delay 4+ turns', () => {
        const effect = createDelayedEffect({
            decisionId: 'dec-002',
            domain: 'it',
            targetIndex: 'IMD',
            value: 15,
            currentTurn: 1,
        });

        expect(effect.appliesAtTurn).toBeGreaterThanOrEqual(5); // 1 + 4
        expect(effect.domain).toBe('it');
    });

    it('should enforce minimum 1T delay for IPP, IRF, IS (INV-BIZ-09)', () => {
        for (const targetIndex of DELAYED_INDICES) {
            const effect = createDelayedEffect({
                decisionId: 'dec-003',
                domain: 'tarif', // tarif has baseDelay 0
                targetIndex,
                value: 5,
                currentTurn: 1,
            });

            expect(effect.appliesAtTurn).toBeGreaterThanOrEqual(2); // minimum 1T delay
        }
    });

    it('should use provided effectType', () => {
        const effect = createDelayedEffect({
            decisionId: 'dec-004',
            domain: 'rh',
            targetIndex: 'IERH',
            value: 5,
            currentTurn: 1,
            effectType: 'absolute',
        });

        expect(effect.effectType).toBe('absolute');
    });

    it('should include description if provided', () => {
        const effect = createDelayedEffect({
            decisionId: 'dec-005',
            domain: 'rh',
            targetIndex: 'IERH',
            value: 10,
            currentTurn: 1,
            description: 'Recrutement 10 ETP sinistres',
        });

        expect(effect.description).toBe('Recrutement 10 ETP sinistres');
    });

    it('should generate unique IDs', () => {
        const effect1 = createDelayedEffect({
            decisionId: 'dec-001',
            domain: 'rh',
            targetIndex: 'IERH',
            value: 10,
            currentTurn: 1,
        });
        const effect2 = createDelayedEffect({
            decisionId: 'dec-001',
            domain: 'rh',
            targetIndex: 'IERH',
            value: 10,
            currentTurn: 1,
        });

        expect(effect1.id).not.toBe(effect2.id);
    });
});

// ============================================
// DECAY TESTS
// ============================================

describe('applyDecay', () => {
    it('should apply decay formula correctly (TEST-QA-021-02)', () => {
        // Initial 10 with 20% decay after 3 turns
        // 10 × (1-0.2)³ = 10 × 0.8³ = 10 × 0.512 = 5.12
        const result = applyDecay(10, 0.2, 3);
        expect(result).toBeCloseTo(5.12, 2);
    });

    it('should return initial value when no turns elapsed', () => {
        const result = applyDecay(10, 0.2, 0);
        expect(result).toBe(10);
    });

    it('should return initial value for negative turns', () => {
        const result = applyDecay(10, 0.2, -1);
        expect(result).toBe(10);
    });

    it('should handle 0% decay rate (no decay)', () => {
        const result = applyDecay(10, 0, 5);
        expect(result).toBe(10);
    });

    it('should handle 100% decay rate (full decay)', () => {
        const result = applyDecay(10, 1.0, 1);
        expect(result).toBe(0);
    });

    it('should decay monotonically (PROP-02)', () => {
        const t0 = applyDecay(100, 0.15, 0);
        const t1 = applyDecay(100, 0.15, 1);
        const t2 = applyDecay(100, 0.15, 2);
        const t3 = applyDecay(100, 0.15, 3);

        expect(t1).toBeLessThan(t0);
        expect(t2).toBeLessThan(t1);
        expect(t3).toBeLessThan(t2);
    });
});

describe('getEffectiveValue', () => {
    it('should calculate effective value with decay', () => {
        const effect = createTestEffect({
            value: 10,
            decayRate: 0.2,
            createdAtTurn: 1,
        });

        // At turn 4, 3 turns elapsed: 10 × 0.8³ = 5.12
        const value = getEffectiveValue(effect, 4);
        expect(value).toBeCloseTo(5.12, 2);
    });

    it('should return full value at creation turn', () => {
        const effect = createTestEffect({
            value: 10,
            createdAtTurn: 1,
        });

        const value = getEffectiveValue(effect, 1);
        expect(value).toBe(10);
    });
});

// ============================================
// SEEDED RANDOM TESTS
// ============================================

describe('seededRandom', () => {
    it('should return same value for same seed (PROP-03)', () => {
        const r1 = seededRandom(12345);
        const r2 = seededRandom(12345);
        expect(r1).toBe(r2);
    });

    it('should return different values for different seeds', () => {
        const r1 = seededRandom(12345);
        const r2 = seededRandom(54321);
        expect(r1).not.toBe(r2);
    });

    it('should return value in [0, 1)', () => {
        for (let seed = 0; seed < 100; seed++) {
            const value = seededRandom(seed);
            expect(value).toBeGreaterThanOrEqual(0);
            expect(value).toBeLessThan(1);
        }
    });
});

// ============================================
// FILTERING TESTS
// ============================================

describe('getActiveEffects', () => {
    it('should return effects for current turn', () => {
        const queue = createTestQueue();
        const active = getActiveEffects(queue, 3);

        expect(active).toHaveLength(3); // eff-1, eff-2, eff-4
        expect(active.every((e) => e.appliesAtTurn === 3)).toBe(true);
    });

    it('should return empty array when no effects for turn', () => {
        const queue = createTestQueue();
        const active = getActiveEffects(queue, 4);

        expect(active).toHaveLength(0);
    });

    it('should not include already applied effects', () => {
        const queue: DelayedEffectsQueue = {
            pending: [
                createTestEffect({ id: 'eff-1', appliesAtTurn: 3, isApplied: true }),
                createTestEffect({ id: 'eff-2', appliesAtTurn: 3, isApplied: false }),
            ],
            applied: [],
        };

        const active = getActiveEffects(queue, 3);
        expect(active).toHaveLength(1);
        expect(active[0].id).toBe('eff-2');
    });
});

describe('getEffectsByTarget', () => {
    it('should filter effects by target index', () => {
        const queue = createTestQueue();
        const effects = getEffectsByTarget(queue, 'IERH');

        expect(effects).toHaveLength(3); // eff-1, eff-3, eff-4
        expect(effects.every((e) => e.targetIndex === 'IERH')).toBe(true);
    });

    it('should return empty array when no effects for target', () => {
        const queue = createTestQueue();
        const effects = getEffectsByTarget(queue, 'IMD');

        expect(effects).toHaveLength(0);
    });
});

describe('getEffectsByDomain', () => {
    it('should filter effects by domain', () => {
        const queue = createTestQueue();
        const effects = getEffectsByDomain(queue, 'rh');

        expect(effects).toHaveLength(3); // eff-1, eff-2, eff-3
        expect(effects.every((e) => e.domain === 'rh')).toBe(true);
    });
});

describe('getUpcomingEffects', () => {
    it('should return effects grouped by turn', () => {
        const queue = createTestQueue();
        const upcoming = getUpcomingEffects(queue, 2, 4);

        expect(upcoming.has(3)).toBe(true);
        expect(upcoming.has(5)).toBe(true);
        expect(upcoming.get(3)!.length).toBe(3);
        expect(upcoming.get(5)!.length).toBe(1);
    });
});

// ============================================
// QUEUE MANAGEMENT TESTS
// ============================================

describe('addEffectToQueue', () => {
    it('should add effect to queue', () => {
        const queue = createEmptyEffectsQueue();
        const effect = createTestEffect();

        const newQueue = addEffectToQueue(queue, effect);

        expect(newQueue.pending).toHaveLength(1);
        expect(newQueue.pending[0]).toEqual(effect);
    });

    it('should not mutate original queue', () => {
        const queue = createEmptyEffectsQueue();
        const effect = createTestEffect();

        addEffectToQueue(queue, effect);

        expect(queue.pending).toHaveLength(0);
    });
});

describe('markEffectsApplied', () => {
    it('should move effects to applied', () => {
        const queue = createTestQueue();

        const newQueue = markEffectsApplied(queue, ['eff-1', 'eff-2']);

        expect(newQueue.pending).toHaveLength(2); // eff-3, eff-4 remain
        expect(newQueue.applied).toHaveLength(2);
        expect(newQueue.applied.every((e) => e.isApplied)).toBe(true);
    });

    it('should not affect effects not in list', () => {
        const queue = createTestQueue();

        const newQueue = markEffectsApplied(queue, ['eff-1']);

        expect(newQueue.pending).toHaveLength(3);
        expect(newQueue.pending.find((e) => e.id === 'eff-1')).toBeUndefined();
    });
});

// ============================================
// INTEGRATION TEST
// ============================================

describe('Effect Pipeline Integration', () => {
    beforeEach(() => {
        resetEffectCounter();
    });

    it('should create, queue, filter, and process effects', () => {
        // 1. Create empty queue
        let queue = createEmptyEffectsQueue();

        // 2. Create and add effects
        const effect1 = createDelayedEffect({
            decisionId: 'dec-001',
            domain: 'rh',
            targetIndex: 'IERH',
            value: 10,
            currentTurn: 1,
        });
        queue = addEffectToQueue(queue, effect1);

        const effect2 = createDelayedEffect({
            decisionId: 'dec-002',
            domain: 'marketing',
            targetIndex: 'IAC',
            value: 5,
            currentTurn: 1,
        });
        queue = addEffectToQueue(queue, effect2);

        // 3. Check queue state
        expect(queue.pending).toHaveLength(2);

        // 4. Fast-forward to turn 2 - marketing effect should be active
        const activeT2 = getActiveEffects(queue, 2);
        expect(activeT2.length).toBe(1);
        expect(activeT2[0].domain).toBe('marketing');

        // 5. Mark marketing effect as applied
        queue = markEffectsApplied(queue, [activeT2[0].id]);
        expect(queue.pending).toHaveLength(1);
        expect(queue.applied).toHaveLength(1);

        // 6. Fast-forward to turn 3 - RH effect should be active
        const activeT3 = getActiveEffects(queue, 3);
        expect(activeT3.length).toBe(1);
        expect(activeT3[0].domain).toBe('rh');
    });
});
