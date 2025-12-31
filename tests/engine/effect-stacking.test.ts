/**
 * Effect Stacking Unit Tests
 *
 * @module tests/engine/effect-stacking.test
 * @description Unit tests for effect stacking and caps (US-021)
 *
 * References:
 * - docs/20_simulation/indices.md (INV-BIZ-08)
 * - docs/20_simulation/effets_retard.md
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    stackEffects,
    stackEffectsFromQueue,
    applyCap,
    applyCaps,
    calculateStackResult,
    calculateNetEffects,
    calculateNetEffect,
    hasCapTriggered,
    getCappedStacks,
    summarizeEffects,
} from '@/lib/engine/effect-stacking';
import {
    createEmptyEffectsQueue,
    RELATIVE_EFFECT_CAP,
    type DelayedEffect,
    type EffectStack,
    type DelayedEffectsQueue,
} from '@/lib/engine/effects-types';
import { addEffectToQueue, resetEffectCounter } from '@/lib/engine/delayed-effects';

// ============================================
// TEST HELPERS
// ============================================

/**
 * Creates a test effect with specified parameters
 */
function createTestEffect(params: {
    id?: string;
    targetIndex?: string;
    value?: number;
    domain?: string;
    createdAtTurn?: number;
    appliesAtTurn?: number;
    decayRate?: number;
}): DelayedEffect {
    return {
        id: params.id ?? 'test-effect',
        decisionId: 'dec-001',
        targetIndex: (params.targetIndex ?? 'IAC') as DelayedEffect['targetIndex'],
        effectType: 'relative',
        value: params.value ?? 10,
        createdAtTurn: params.createdAtTurn ?? 1,
        appliesAtTurn: params.appliesAtTurn ?? 3,
        decayRate: params.decayRate ?? 0.1,
        domain: (params.domain ?? 'rh') as DelayedEffect['domain'],
        description: 'Test effect',
        isApplied: false,
    };
}

/**
 * Creates a test stack with specified parameters
 */
function createTestStack(params: {
    targetIndex?: string;
    effects?: DelayedEffect[];
    totalDelta?: number;
}): EffectStack {
    return {
        targetIndex: (params.targetIndex ?? 'IAC') as EffectStack['targetIndex'],
        effects: params.effects ?? [],
        totalDelta: params.totalDelta ?? 0,
        cappedDelta: 0,
        capApplied: false,
    };
}

// ============================================
// STACK EFFECTS TESTS
// ============================================

describe('stackEffects', () => {
    it('should group effects by target index', () => {
        const effects: DelayedEffect[] = [
            createTestEffect({ id: 'e1', targetIndex: 'IAC', value: 10 }),
            createTestEffect({ id: 'e2', targetIndex: 'IAC', value: 20 }),
            createTestEffect({ id: 'e3', targetIndex: 'IERH', value: 15 }),
        ];

        const stacks = stackEffects(effects, 3);

        expect(stacks.get('IAC')!.effects).toHaveLength(2);
        expect(stacks.get('IERH')!.effects).toHaveLength(1);
        expect(stacks.get('IMD')!.effects).toHaveLength(0);
    });

    it('should calculate total delta with decay', () => {
        const effects: DelayedEffect[] = [
            createTestEffect({
                id: 'e1',
                targetIndex: 'IAC',
                value: 10,
                decayRate: 0.1,
                createdAtTurn: 1,
            }),
            createTestEffect({
                id: 'e2',
                targetIndex: 'IAC',
                value: 20,
                decayRate: 0.1,
                createdAtTurn: 1,
            }),
        ];

        // At turn 3, 2 turns elapsed: value × 0.9² = value × 0.81
        const stacks = stackEffects(effects, 3);
        const iacStack = stacks.get('IAC')!;

        // Total should be (10 + 20) × 0.81 = 24.3
        expect(iacStack.totalDelta).toBeCloseTo(24.3, 1);
    });

    it('should handle empty effects array', () => {
        const stacks = stackEffects([], 1);

        expect(stacks.size).toBe(7); // All 7 indices
        for (const stack of stacks.values()) {
            expect(stack.effects).toHaveLength(0);
            expect(stack.totalDelta).toBe(0);
        }
    });
});

describe('stackEffectsFromQueue', () => {
    it('should only stack active effects for current turn', () => {
        let queue = createEmptyEffectsQueue();
        queue = addEffectToQueue(queue, createTestEffect({ id: 'e1', appliesAtTurn: 3 }));
        queue = addEffectToQueue(queue, createTestEffect({ id: 'e2', appliesAtTurn: 3 }));
        queue = addEffectToQueue(queue, createTestEffect({ id: 'e3', appliesAtTurn: 5 }));

        const stacks = stackEffectsFromQueue(queue, 3);
        const iacStack = stacks.get('IAC')!;

        expect(iacStack.effects).toHaveLength(2);
    });
});

// ============================================
// CAP TESTS
// ============================================

describe('applyCap', () => {
    it('should not apply cap when under limit', () => {
        const stack = createTestStack({ totalDelta: 30 });

        const result = applyCap(stack);

        expect(result.cappedDelta).toBe(30);
        expect(result.capApplied).toBe(false);
    });

    it('should cap at +50% when effects exceed limit (TEST-QA-021-03)', () => {
        const stack = createTestStack({ totalDelta: 80, targetIndex: 'IAC' });

        const result = applyCap(stack);

        expect(result.cappedDelta).toBe(RELATIVE_EFFECT_CAP); // 50
        expect(result.capApplied).toBe(true);
    });

    it('should cap at -50% for negative effects', () => {
        const stack = createTestStack({ totalDelta: -80, targetIndex: 'IERH' });

        const result = applyCap(stack);

        expect(result.cappedDelta).toBe(-RELATIVE_EFFECT_CAP); // -50
        expect(result.capApplied).toBe(true);
    });

    it('should handle exactly at cap boundary', () => {
        const stack = createTestStack({ totalDelta: 50 });

        const result = applyCap(stack);

        expect(result.cappedDelta).toBe(50);
        expect(result.capApplied).toBe(false);
    });

    it('should preserve sign when capping', () => {
        const positiveStack = createTestStack({ totalDelta: 100 });
        const negativeStack = createTestStack({ totalDelta: -100 });

        const posResult = applyCap(positiveStack);
        const negResult = applyCap(negativeStack);

        expect(posResult.cappedDelta).toBe(50);
        expect(negResult.cappedDelta).toBe(-50);
    });
});

describe('applyCaps', () => {
    it('should apply caps to all stacks', () => {
        const stacks = new Map<DelayedEffect['targetIndex'], EffectStack>([
            ['IAC', createTestStack({ targetIndex: 'IAC', totalDelta: 80 })],
            ['IERH', createTestStack({ targetIndex: 'IERH', totalDelta: 30 })],
            ['IMD', createTestStack({ targetIndex: 'IMD', totalDelta: -70 })],
        ]);

        const result = applyCaps(stacks);

        expect(result.get('IAC')!.cappedDelta).toBe(50);
        expect(result.get('IAC')!.capApplied).toBe(true);
        expect(result.get('IERH')!.cappedDelta).toBe(30);
        expect(result.get('IERH')!.capApplied).toBe(false);
        expect(result.get('IMD')!.cappedDelta).toBe(-50);
        expect(result.get('IMD')!.capApplied).toBe(true);
    });
});

// ============================================
// PROPERTY TESTS
// ============================================

describe('Effect System Properties', () => {
    it('PROP-01: |cappedDelta| ≤ 50 for all stacks', () => {
        // Test with extreme values
        const testValues = [-1000, -100, -50, -10, 0, 10, 50, 100, 1000];

        for (const value of testValues) {
            const stack = createTestStack({ totalDelta: value });
            const result = applyCap(stack);

            expect(Math.abs(result.cappedDelta)).toBeLessThanOrEqual(RELATIVE_EFFECT_CAP);
        }
    });

    it('PROP-02: cap preserves direction (sign)', () => {
        for (let i = -100; i <= 100; i += 10) {
            const stack = createTestStack({ totalDelta: i });
            const result = applyCap(stack);

            if (i !== 0) {
                expect(Math.sign(result.cappedDelta)).toBe(Math.sign(i));
            }
        }
    });
});

// ============================================
// NET EFFECT CALCULATION TESTS
// ============================================

describe('calculateStackResult', () => {
    beforeEach(() => {
        resetEffectCounter();
    });

    it('should include contribution details', () => {
        const effects: DelayedEffect[] = [
            createTestEffect({ id: 'e1', value: 10, domain: 'rh', createdAtTurn: 3 }),
            createTestEffect({ id: 'e2', value: 20, domain: 'marketing', createdAtTurn: 3 }),
        ];

        const stack: EffectStack = {
            targetIndex: 'IAC',
            effects,
            totalDelta: 30,
            cappedDelta: 30,
            capApplied: false,
        };

        const result = calculateStackResult(stack, 3);

        expect(result.targetIndex).toBe('IAC');
        expect(result.netDelta).toBe(30);
        expect(result.effectCount).toBe(2);
        expect(result.contributions).toHaveLength(2);
        expect(result.contributions[0].domain).toBe('rh');
        expect(result.contributions[1].domain).toBe('marketing');
    });
});

describe('calculateNetEffects', () => {
    beforeEach(() => {
        resetEffectCounter();
    });

    it('should calculate net effects from queue', () => {
        let queue = createEmptyEffectsQueue();
        queue = addEffectToQueue(queue, createTestEffect({
            id: 'e1',
            targetIndex: 'IAC',
            value: 30,
            appliesAtTurn: 3,
            createdAtTurn: 3,
            decayRate: 0,
        }));
        queue = addEffectToQueue(queue, createTestEffect({
            id: 'e2',
            targetIndex: 'IAC',
            value: 40,
            appliesAtTurn: 3,
            createdAtTurn: 3,
            decayRate: 0,
        }));

        const results = calculateNetEffects(queue, 3);

        // Should have one result for IAC with capped value
        expect(results).toHaveLength(1);
        expect(results[0].targetIndex).toBe('IAC');
        expect(results[0].netDelta).toBe(50); // Capped from 70
        expect(results[0].capApplied).toBe(true);
    });
});

describe('calculateNetEffect', () => {
    beforeEach(() => {
        resetEffectCounter();
    });

    it('should return net delta for specific index', () => {
        let queue = createEmptyEffectsQueue();
        queue = addEffectToQueue(queue, createTestEffect({
            id: 'e1',
            targetIndex: 'IERH',
            value: 25,
            appliesAtTurn: 3,
            createdAtTurn: 3,
            decayRate: 0,
        }));

        const delta = calculateNetEffect(queue, 3, 'IERH');

        expect(delta).toBe(25);
    });

    it('should return 0 when no effects for index', () => {
        const queue = createEmptyEffectsQueue();

        const delta = calculateNetEffect(queue, 3, 'IMD');

        expect(delta).toBe(0);
    });
});

// ============================================
// HELPER FUNCTIONS TESTS
// ============================================

describe('hasCapTriggered', () => {
    it('should return true if any cap triggered', () => {
        const stacks = new Map<DelayedEffect['targetIndex'], EffectStack>();
        stacks.set('IAC', { ...createTestStack({ targetIndex: 'IAC' }), capApplied: false });
        stacks.set('IERH', { ...createTestStack({ targetIndex: 'IERH' }), capApplied: true });

        expect(hasCapTriggered(stacks)).toBe(true);
    });

    it('should return false if no caps triggered', () => {
        const stacks = new Map<DelayedEffect['targetIndex'], EffectStack>();
        stacks.set('IAC', { ...createTestStack({ targetIndex: 'IAC' }), capApplied: false });
        stacks.set('IERH', { ...createTestStack({ targetIndex: 'IERH' }), capApplied: false });

        expect(hasCapTriggered(stacks)).toBe(false);
    });
});

describe('getCappedStacks', () => {
    it('should return only stacks with caps triggered', () => {
        const stacks = new Map<DelayedEffect['targetIndex'], EffectStack>([
            ['IAC', { ...createTestStack({ targetIndex: 'IAC' }), capApplied: true }],
            ['IERH', { ...createTestStack({ targetIndex: 'IERH' }), capApplied: false }],
            ['IMD', { ...createTestStack({ targetIndex: 'IMD' }), capApplied: true }],
        ]);

        const capped = getCappedStacks(stacks);

        expect(capped).toHaveLength(2);
        expect(capped.map((s) => s.targetIndex)).toContain('IAC');
        expect(capped.map((s) => s.targetIndex)).toContain('IMD');
    });
});

describe('summarizeEffects', () => {
    it('should format summary for UI', () => {
        const results = [
            {
                targetIndex: 'IAC' as const,
                netDelta: 15.5,
                effectCount: 2,
                capApplied: false,
                contributions: [],
            },
            {
                targetIndex: 'IERH' as const,
                netDelta: -50,
                effectCount: 3,
                capApplied: true,
                contributions: [],
            },
        ];

        const summary = summarizeEffects(results);

        expect(summary).toContain('IAC +15.5');
        expect(summary).toContain('IERH -50.0 (cap)');
    });

    it('should return message when no effects', () => {
        const summary = summarizeEffects([]);
        expect(summary).toBe('Aucun effet appliqué ce tour');
    });
});

// ============================================
// INTEGRATION TESTS
// ============================================

describe('Multiple Effects Same Target Integration', () => {
    beforeEach(() => {
        resetEffectCounter();
    });

    it('should stack and cap multiple effects on same index', () => {
        // Create 3 effects on IAC that exceed cap
        let queue = createEmptyEffectsQueue();

        queue = addEffectToQueue(queue, createTestEffect({
            id: 'e1',
            targetIndex: 'IAC',
            value: 25,
            appliesAtTurn: 5,
            createdAtTurn: 5,
            decayRate: 0,
        }));
        queue = addEffectToQueue(queue, createTestEffect({
            id: 'e2',
            targetIndex: 'IAC',
            value: 25,
            appliesAtTurn: 5,
            createdAtTurn: 5,
            decayRate: 0,
        }));
        queue = addEffectToQueue(queue, createTestEffect({
            id: 'e3',
            targetIndex: 'IAC',
            value: 25,
            appliesAtTurn: 5,
            createdAtTurn: 5,
            decayRate: 0,
        }));

        const results = calculateNetEffects(queue, 5);

        expect(results).toHaveLength(1);
        expect(results[0].targetIndex).toBe('IAC');
        expect(results[0].netDelta).toBe(50); // Capped from 75
        expect(results[0].capApplied).toBe(true);
        expect(results[0].effectCount).toBe(3);
    });

    it('should handle effects on multiple indices simultaneously', () => {
        let queue = createEmptyEffectsQueue();

        queue = addEffectToQueue(queue, createTestEffect({
            id: 'e1',
            targetIndex: 'IAC',
            value: 30,
            appliesAtTurn: 5,
            createdAtTurn: 5,
            decayRate: 0,
        }));
        queue = addEffectToQueue(queue, createTestEffect({
            id: 'e2',
            targetIndex: 'IERH',
            value: 20,
            appliesAtTurn: 5,
            createdAtTurn: 5,
            decayRate: 0,
        }));
        queue = addEffectToQueue(queue, createTestEffect({
            id: 'e3',
            targetIndex: 'IMD',
            value: -60,
            appliesAtTurn: 5,
            createdAtTurn: 5,
            decayRate: 0,
        }));

        const results = calculateNetEffects(queue, 5);

        expect(results).toHaveLength(3);

        const iac = results.find((r) => r.targetIndex === 'IAC')!;
        const ierh = results.find((r) => r.targetIndex === 'IERH')!;
        const imd = results.find((r) => r.targetIndex === 'IMD')!;

        expect(iac.netDelta).toBe(30);
        expect(iac.capApplied).toBe(false);

        expect(ierh.netDelta).toBe(20);
        expect(ierh.capApplied).toBe(false);

        expect(imd.netDelta).toBe(-50); // Capped from -60
        expect(imd.capApplied).toBe(true);
    });
});
