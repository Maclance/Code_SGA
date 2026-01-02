/**
 * Compensation Unit Tests
 *
 * @module tests/engine/compensation.test
 * @description Unit tests for compensation system (US-024)
 *
 * References:
 * - docs/20_simulation/effets_retard.md (section compensation)
 * - docs/000_projet/specs_fonctionnelles_mvp.md (US-024)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    calculateCompensationCost,
    getCompensationMultiplier,
    createCompensationOption,
    applyCompensation,
    formatCompensationCost,
    formatViabilityStatus,
    COMPENSATION_COST_RATE,
    COMPENSATION_COST_CAP,
    type CompensationOption,
} from '@/lib/engine/compensation';
import {
    createPersistentEffect,
    resetPersistentEffectCounter,
    type PersistentEffect,
} from '@/lib/engine/effect-persistence';

// ============================================
// TEST HELPERS
// ============================================

function createTestEffect(overrides: Partial<PersistentEffect> = {}): PersistentEffect {
    return {
        id: 'peff-test-1',
        decisionId: 'dec-001',
        originalValue: 10,
        currentValue: 5,
        createdAtTurn: 1,
        lastCalculatedTurn: 4,
        decayRate: 0.2,
        targetIndex: 'IERH',
        status: 'active',
        description: 'Test effect',
        ...overrides,
    };
}

// ============================================
// COST CALCULATION TESTS (TEST-QA-024-03)
// ============================================

describe('calculateCompensationCost', () => {
    it('should calculate cost correctly: 100 × (1 + 0.2×3) = 160 (TEST-QA-024-03)', () => {
        // Given: Base cost 100, 3 turns elapsed
        // Formula: 100 × (1 + 0.2 × 3) = 100 × 1.6 = 160
        const cost = calculateCompensationCost(100, 3);
        expect(cost).toBe(160);
    });

    it('should return base cost when no turns elapsed', () => {
        const cost = calculateCompensationCost(100, 0);
        expect(cost).toBe(100);
    });

    it('should cap cost at 3× base (PROP-02)', () => {
        // 15 turns: 100 × (1 + 0.2 × 15) = 100 × 4 → capped to 300
        const cost = calculateCompensationCost(100, 15);
        expect(cost).toBe(300);
    });

    it('should handle negative turns gracefully', () => {
        const cost = calculateCompensationCost(100, -5);
        expect(cost).toBe(100);
    });

    it('should handle zero base cost', () => {
        const cost = calculateCompensationCost(0, 5);
        expect(cost).toBe(0);
    });
});

// ============================================
// MULTIPLIER TESTS
// ============================================

describe('getCompensationMultiplier', () => {
    it('should return 1.0 for 0 turns', () => {
        expect(getCompensationMultiplier(0)).toBe(1.0);
    });

    it('should return 1.2 for 1 turn', () => {
        expect(getCompensationMultiplier(1)).toBeCloseTo(1.2, 2);
    });

    it('should return 1.6 for 3 turns', () => {
        expect(getCompensationMultiplier(3)).toBeCloseTo(1.6, 2);
    });

    it('should cap at 3.0', () => {
        expect(getCompensationMultiplier(20)).toBe(COMPENSATION_COST_CAP);
    });

    it('should be monotonically increasing', () => {
        const m0 = getCompensationMultiplier(0);
        const m1 = getCompensationMultiplier(1);
        const m2 = getCompensationMultiplier(2);
        const m3 = getCompensationMultiplier(3);

        expect(m1).toBeGreaterThan(m0);
        expect(m2).toBeGreaterThan(m1);
        expect(m3).toBeGreaterThan(m2);
    });
});

// ============================================
// COST CAP PROPERTY (PROP-02)
// ============================================

describe('cost cap property', () => {
    it('should never exceed 3× base cost (PROP-02)', () => {
        for (let turns = 0; turns <= 50; turns++) {
            const cost = calculateCompensationCost(100, turns);
            expect(cost).toBeLessThanOrEqual(100 * COMPENSATION_COST_CAP);
        }
    });

    it('should reach cap at 10 turns', () => {
        // 1 + 0.2 × 10 = 3.0 (exactly at cap)
        const cost = calculateCompensationCost(100, 10);
        expect(cost).toBe(300);
    });
});

// ============================================
// CREATE COMPENSATION OPTION TESTS
// ============================================

describe('createCompensationOption', () => {
    beforeEach(() => {
        resetPersistentEffectCounter();
    });

    it('should create option with correct values', () => {
        const effect = createTestEffect({
            createdAtTurn: 1,
            currentValue: 5,
        });

        const option = createCompensationOption({
            effect,
            baseCost: 100,
            currentTurn: 4, // 3 turns elapsed
        });

        expect(option.originalDecisionId).toBe('dec-001');
        expect(option.effectId).toBe('peff-test-1');
        expect(option.baseCost).toBe(100);
        expect(option.currentCost).toBe(160); // 100 × 1.6
        expect(option.costMultiplier).toBe(1.6);
        expect(option.turnsElapsed).toBe(3);
        expect(option.effectToReverse).toBe(5);
        expect(option.targetIndex).toBe('IERH');
        expect(option.isViable).toBe(true);
    });

    it('should mark as not viable when effect < 0.5', () => {
        const effect = createTestEffect({
            currentValue: 0.3,
            status: 'active',
        });

        const option = createCompensationOption({
            effect,
            baseCost: 100,
            currentTurn: 4,
        });

        expect(option.isViable).toBe(false);
    });

    it('should mark as not viable when effect is depleted', () => {
        const effect = createTestEffect({
            currentValue: 0.3,
            status: 'depleted',
        });

        const option = createCompensationOption({
            effect,
            baseCost: 100,
            currentTurn: 4,
        });

        expect(option.isViable).toBe(false);
    });
});

// ============================================
// APPLY COMPENSATION TESTS (TEST-INT-024-02)
// ============================================

describe('applyCompensation', () => {
    it('should mark effect as compensated (TEST-INT-024-02)', () => {
        const effect = createTestEffect({
            status: 'active',
            currentValue: 5,
        });

        const option = createCompensationOption({
            effect,
            baseCost: 100,
            currentTurn: 4,
        });

        const result = applyCompensation(effect, option);

        expect(result.success).toBe(true);
        expect(result.updatedEffect.status).toBe('compensated');
        expect(result.updatedEffect.currentValue).toBe(0);
        expect(result.costCharged).toBe(160);
    });

    it('should fail when not viable', () => {
        const effect = createTestEffect({
            status: 'active',
            currentValue: 0.3,
        });

        const option = createCompensationOption({
            effect,
            baseCost: 100,
            currentTurn: 4,
        });

        const result = applyCompensation(effect, option);

        expect(result.success).toBe(false);
        expect(result.updatedEffect.status).toBe('active');
        expect(result.costCharged).toBe(0);
        expect(result.error).toBeDefined();
    });

    it('should fail when effect already compensated', () => {
        const effect = createTestEffect({
            status: 'compensated',
            currentValue: 5,
        });

        const option: CompensationOption = {
            originalDecisionId: effect.decisionId,
            effectId: effect.id,
            baseCost: 100,
            currentCost: 160,
            costMultiplier: 1.6,
            turnsElapsed: 3,
            effectToReverse: 5,
            targetIndex: 'IERH',
            isViable: true, // Manually set for test
        };

        const result = applyCompensation(effect, option);

        expect(result.success).toBe(false);
        expect(result.error).toContain('not active');
    });

    it('should fail when effect ID mismatch', () => {
        const effect = createTestEffect({ id: 'peff-1' });
        const option: CompensationOption = {
            originalDecisionId: 'dec-001',
            effectId: 'peff-2', // Different ID
            baseCost: 100,
            currentCost: 160,
            costMultiplier: 1.6,
            turnsElapsed: 3,
            effectToReverse: 5,
            targetIndex: 'IERH',
            isViable: true,
        };

        const result = applyCompensation(effect, option);

        expect(result.success).toBe(false);
        expect(result.error).toContain('mismatch');
    });
});

// ============================================
// CONSERVATION PROPERTY (PROP-03)
// ============================================

describe('conservation property', () => {
    it('should neutralize effect completely when compensated (PROP-03)', () => {
        const effect = createTestEffect({
            status: 'active',
            currentValue: 10,
            originalValue: 15,
        });

        const option = createCompensationOption({
            effect,
            baseCost: 100,
            currentTurn: 4,
        });

        const result = applyCompensation(effect, option);

        // Effect should be completely neutralized
        expect(result.updatedEffect.currentValue).toBe(0);
        expect(result.updatedEffect.status).toBe('compensated');
    });
});

// ============================================
// FORMATTING TESTS
// ============================================

describe('formatCompensationCost', () => {
    it('should format cost with increase percentage', () => {
        const option: CompensationOption = {
            originalDecisionId: 'dec-001',
            effectId: 'peff-001',
            baseCost: 100,
            currentCost: 160,
            costMultiplier: 1.6,
            turnsElapsed: 3,
            effectToReverse: 5,
            targetIndex: 'IERH',
            isViable: true,
        };

        const formatted = formatCompensationCost(option);
        expect(formatted).toBe('160 € (+60%)');
    });

    it('should format base cost without percentage', () => {
        const option: CompensationOption = {
            originalDecisionId: 'dec-001',
            effectId: 'peff-001',
            baseCost: 100,
            currentCost: 100,
            costMultiplier: 1.0,
            turnsElapsed: 0,
            effectToReverse: 5,
            targetIndex: 'IERH',
            isViable: true,
        };

        const formatted = formatCompensationCost(option);
        expect(formatted).toBe('100 €');
    });
});

describe('formatViabilityStatus', () => {
    it('should return French text for viable', () => {
        const option: CompensationOption = {
            originalDecisionId: 'dec-001',
            effectId: 'peff-001',
            baseCost: 100,
            currentCost: 160,
            costMultiplier: 1.6,
            turnsElapsed: 3,
            effectToReverse: 5,
            targetIndex: 'IERH',
            isViable: true,
        };

        expect(formatViabilityStatus(option, 'fr')).toBe('Compensation possible');
    });

    it('should return French text for not viable', () => {
        const option: CompensationOption = {
            originalDecisionId: 'dec-001',
            effectId: 'peff-001',
            baseCost: 100,
            currentCost: 160,
            costMultiplier: 1.6,
            turnsElapsed: 3,
            effectToReverse: 0.3,
            targetIndex: 'IERH',
            isViable: false,
        };

        expect(formatViabilityStatus(option, 'fr')).toBe('Effet trop atténué');
    });
});

// ============================================
// INTEGRATION TEST
// ============================================

describe('Compensation Application Integration', () => {
    beforeEach(() => {
        resetPersistentEffectCounter();
    });

    it('should complete full compensation flow', () => {
        // 1. Create effect
        const effect = createPersistentEffect({
            decisionId: 'dec-int-002',
            value: 10,
            targetIndex: 'IERH',
            decayRate: 0.2,
            currentTurn: 1,
            description: 'Negative RH decision',
        });

        // 2. Create compensation option at turn 4
        const option = createCompensationOption({
            effect: { ...effect, currentValue: 5.12, lastCalculatedTurn: 4 },
            baseCost: 100,
            currentTurn: 4,
        });

        // 3. Verify option
        expect(option.turnsElapsed).toBe(3);
        expect(option.costMultiplier).toBe(1.6);
        expect(option.currentCost).toBe(160);
        expect(option.isViable).toBe(true);

        // 4. Apply compensation
        const result = applyCompensation(
            { ...effect, currentValue: 5.12, lastCalculatedTurn: 4 },
            option
        );

        // 5. Verify result
        expect(result.success).toBe(true);
        expect(result.updatedEffect.status).toBe('compensated');
        expect(result.costCharged).toBe(160);
    });
});
