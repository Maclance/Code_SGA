/**
 * Effect Persistence Unit Tests
 *
 * @module tests/engine/effect-persistence.test
 * @description Unit tests for effect persistence system (US-024)
 *
 * References:
 * - docs/20_simulation/effets_retard.md (section persistance)
 * - docs/000_projet/specs_fonctionnelles_mvp.md (US-024)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    calculateDecayedEffect,
    createPersistentEffect,
    updatePersistentEffect,
    getEffectStatus,
    getActiveEffects,
    getEffectsByIndex,
    isEffectViableForCompensation,
    resetPersistentEffectCounter,
    DEPLETION_THRESHOLD,
    type PersistentEffect,
    type CreatePersistentEffectParams,
} from '@/lib/engine/effect-persistence';

// ============================================
// TEST HELPERS
// ============================================

function createTestEffect(overrides: Partial<PersistentEffect> = {}): PersistentEffect {
    return {
        id: 'peff-test-1',
        decisionId: 'dec-001',
        originalValue: 10,
        currentValue: 10,
        createdAtTurn: 1,
        lastCalculatedTurn: 1,
        decayRate: 0.2,
        targetIndex: 'IERH',
        status: 'active',
        description: 'Test effect',
        ...overrides,
    };
}

// ============================================
// DECAY CALCULATION TESTS (TEST-QA-024-01)
// ============================================

describe('calculateDecayedEffect', () => {
    it('should apply decay formula correctly: 10 × 0.8³ = 5.12 (TEST-QA-024-01)', () => {
        // Given: Initial effect 10 with decay 0.2, 3 turns elapsed
        // Formula: 10 × (1-0.2)³ = 10 × 0.8³ = 10 × 0.512 = 5.12
        const result = calculateDecayedEffect(10, 0.2, 3);
        expect(result).toBeCloseTo(5.12, 2);
    });

    it('should return original value when no turns elapsed', () => {
        const result = calculateDecayedEffect(10, 0.2, 0);
        expect(result).toBe(10);
    });

    it('should return original value for negative turns', () => {
        const result = calculateDecayedEffect(10, 0.2, -1);
        expect(result).toBe(10);
    });

    it('should handle 0% decay rate (no decay)', () => {
        const result = calculateDecayedEffect(10, 0, 5);
        expect(result).toBe(10);
    });

    it('should handle 100% decay rate (full decay)', () => {
        const result = calculateDecayedEffect(10, 1.0, 1);
        expect(result).toBe(0);
    });

    it('should clamp decay rate to [0, 1]', () => {
        // Values outside range should be clamped
        const result1 = calculateDecayedEffect(10, -0.5, 2);
        expect(result1).toBe(10); // No decay

        const result2 = calculateDecayedEffect(10, 1.5, 1);
        expect(result2).toBe(0); // Full decay
    });
});

// ============================================
// DEPLETION TESTS (TEST-QA-024-02)
// ============================================

describe('depleted effect detection', () => {
    it('should mark effect as depleted when value < 0.5 (TEST-QA-024-02)', () => {
        // Given: Initial effect 2 with decay 0.2, after 5 turns
        // 2 × 0.8^5 = 2 × 0.32768 = 0.655 (still active at t=5)
        // 2 × 0.8^6 = 2 × 0.262 = 0.524 (still active at t=6)
        // 2 × 0.8^7 = 2 × 0.209 = 0.419 (depleted at t=7)
        const value = calculateDecayedEffect(2, 0.2, 7);
        expect(value).toBeLessThan(DEPLETION_THRESHOLD);

        const status = getEffectStatus(value);
        expect(status).toBe('depleted');
    });

    it('should keep effect active when value >= 0.5', () => {
        const value = calculateDecayedEffect(10, 0.2, 5);
        // 10 × 0.8^5 = 10 × 0.32768 = 3.2768 (still active)
        expect(value).toBeGreaterThanOrEqual(DEPLETION_THRESHOLD);

        const status = getEffectStatus(value);
        expect(status).toBe('active');
    });

    it('should preserve compensated status regardless of value', () => {
        const status = getEffectStatus(0.1, 'compensated');
        expect(status).toBe('compensated');
    });
});

// ============================================
// MONOTONICITY PROPERTY (PROP-01)
// ============================================

describe('monotonicity property', () => {
    it('should decay monotonically: effect(t+1) ≤ effect(t) for decay > 0 (PROP-01)', () => {
        const t0 = calculateDecayedEffect(100, 0.15, 0);
        const t1 = calculateDecayedEffect(100, 0.15, 1);
        const t2 = calculateDecayedEffect(100, 0.15, 2);
        const t3 = calculateDecayedEffect(100, 0.15, 3);
        const t4 = calculateDecayedEffect(100, 0.15, 4);
        const t5 = calculateDecayedEffect(100, 0.15, 5);

        expect(t1).toBeLessThanOrEqual(t0);
        expect(t2).toBeLessThanOrEqual(t1);
        expect(t3).toBeLessThanOrEqual(t2);
        expect(t4).toBeLessThanOrEqual(t3);
        expect(t5).toBeLessThanOrEqual(t4);
    });

    it('should converge to 0 as turns increase', () => {
        const t100 = calculateDecayedEffect(1000, 0.2, 100);
        expect(t100).toBeCloseTo(0, 5);
    });
});

// ============================================
// CREATE PERSISTENT EFFECT TESTS
// ============================================

describe('createPersistentEffect', () => {
    beforeEach(() => {
        resetPersistentEffectCounter();
    });

    it('should create effect with correct initial values', () => {
        const params: CreatePersistentEffectParams = {
            decisionId: 'dec-001',
            value: 10,
            targetIndex: 'IERH',
            decayRate: 0.2,
            currentTurn: 3,
            description: 'Test RH decision',
        };

        const effect = createPersistentEffect(params);

        expect(effect.decisionId).toBe('dec-001');
        expect(effect.originalValue).toBe(10);
        expect(effect.currentValue).toBe(10);
        expect(effect.createdAtTurn).toBe(3);
        expect(effect.lastCalculatedTurn).toBe(3);
        expect(effect.decayRate).toBe(0.2);
        expect(effect.targetIndex).toBe('IERH');
        expect(effect.status).toBe('active');
        expect(effect.description).toBe('Test RH decision');
    });

    it('should generate unique IDs', () => {
        const effect1 = createPersistentEffect({
            decisionId: 'dec-001',
            value: 10,
            targetIndex: 'IERH',
            decayRate: 0.2,
            currentTurn: 1,
        });

        const effect2 = createPersistentEffect({
            decisionId: 'dec-001',
            value: 10,
            targetIndex: 'IERH',
            decayRate: 0.2,
            currentTurn: 1,
        });

        expect(effect1.id).not.toBe(effect2.id);
    });
});

// ============================================
// UPDATE PERSISTENT EFFECT TESTS
// ============================================

describe('updatePersistentEffect', () => {
    it('should update currentValue with decay', () => {
        const effect = createTestEffect({
            originalValue: 10,
            currentValue: 10,
            createdAtTurn: 1,
            lastCalculatedTurn: 1,
            decayRate: 0.2,
        });

        // Update to turn 4 (3 turns elapsed)
        const updated = updatePersistentEffect(effect, 4);

        // 10 × 0.8³ = 5.12
        expect(updated.currentValue).toBeCloseTo(5.12, 2);
        expect(updated.lastCalculatedTurn).toBe(4);
        expect(updated.status).toBe('active');
    });

    it('should mark as depleted when below threshold', () => {
        const effect = createTestEffect({
            originalValue: 2,
            currentValue: 2,
            createdAtTurn: 1,
            lastCalculatedTurn: 1,
            decayRate: 0.2,
        });

        // Update to turn 8 (7 turns elapsed)
        // 2 × 0.8^7 = 2 × 0.209 = 0.419 < 0.5
        const updated = updatePersistentEffect(effect, 8);

        expect(updated.currentValue).toBeLessThan(DEPLETION_THRESHOLD);
        expect(updated.status).toBe('depleted');
    });

    it('should not decay compensated effects', () => {
        const effect = createTestEffect({
            status: 'compensated',
            currentValue: 5,
        });

        const updated = updatePersistentEffect(effect, 10);

        expect(updated.currentValue).toBe(5);
        expect(updated.status).toBe('compensated');
    });

    it('should not decay already depleted effects', () => {
        const effect = createTestEffect({
            status: 'depleted',
            currentValue: 0.3,
        });

        const updated = updatePersistentEffect(effect, 10);

        expect(updated.status).toBe('depleted');
    });
});

// ============================================
// FILTERING TESTS
// ============================================

describe('getActiveEffects', () => {
    it('should filter only active effects', () => {
        const effects = [
            createTestEffect({ id: 'e1', status: 'active' }),
            createTestEffect({ id: 'e2', status: 'depleted' }),
            createTestEffect({ id: 'e3', status: 'active' }),
            createTestEffect({ id: 'e4', status: 'compensated' }),
        ];

        const active = getActiveEffects(effects);

        expect(active).toHaveLength(2);
        expect(active.every((e) => e.status === 'active')).toBe(true);
    });
});

describe('getEffectsByIndex', () => {
    it('should filter by target index', () => {
        const effects = [
            createTestEffect({ id: 'e1', targetIndex: 'IERH' }),
            createTestEffect({ id: 'e2', targetIndex: 'IAC' }),
            createTestEffect({ id: 'e3', targetIndex: 'IERH' }),
        ];

        const ierhEffects = getEffectsByIndex(effects, 'IERH');

        expect(ierhEffects).toHaveLength(2);
        expect(ierhEffects.every((e) => e.targetIndex === 'IERH')).toBe(true);
    });
});

describe('isEffectViableForCompensation', () => {
    it('should return true for active effects above threshold', () => {
        const effect = createTestEffect({
            status: 'active',
            currentValue: 5,
        });

        expect(isEffectViableForCompensation(effect)).toBe(true);
    });

    it('should return false for depleted effects', () => {
        const effect = createTestEffect({
            status: 'depleted',
            currentValue: 0.3,
        });

        expect(isEffectViableForCompensation(effect)).toBe(false);
    });

    it('should return false for compensated effects', () => {
        const effect = createTestEffect({
            status: 'compensated',
            currentValue: 5,
        });

        expect(isEffectViableForCompensation(effect)).toBe(false);
    });

    it('should return false for active effects below threshold', () => {
        const effect = createTestEffect({
            status: 'active',
            currentValue: 0.3,
        });

        expect(isEffectViableForCompensation(effect)).toBe(false);
    });
});

// ============================================
// INTEGRATION TEST
// ============================================

describe('Effect Decay Integration', () => {
    beforeEach(() => {
        resetPersistentEffectCounter();
    });

    it('should decay effect over 5 turns correctly (TEST-INT-024-01)', () => {
        // Create effect at turn 1
        const effect = createPersistentEffect({
            decisionId: 'dec-int-001',
            value: 10,
            targetIndex: 'IERH',
            decayRate: 0.2,
            currentTurn: 1,
        });

        // Track values across turns
        const values: number[] = [effect.currentValue];

        let current = effect;
        for (let turn = 2; turn <= 6; turn++) {
            current = updatePersistentEffect(current, turn);
            values.push(current.currentValue);
        }

        // Verify decay at each turn
        // t=1: 10, t=2: 8, t=3: 6.4, t=4: 5.12, t=5: 4.096, t=6: 3.2768
        expect(values[0]).toBeCloseTo(10, 1);
        expect(values[1]).toBeCloseTo(8, 1);
        expect(values[2]).toBeCloseTo(6.4, 1);
        expect(values[3]).toBeCloseTo(5.12, 1);
        expect(values[4]).toBeCloseTo(4.096, 1);
        expect(values[5]).toBeCloseTo(3.2768, 1);

        // All should still be active
        expect(current.status).toBe('active');
    });
});
