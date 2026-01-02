/**
 * Delay Config Tests
 *
 * @module tests/engine/delay-config.test
 * @description Unit tests for delay configuration and calculations (US-023)
 *
 * Test Coverage:
 * - getDelayForDomain calculations by domain and speed
 * - Speed multiplier proportionality
 * - Delay bounds validation
 * - getPendingEffectsForUI transformation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    DELAY_CONFIGS,
    getDelayConfig,
    getDelayForDomain,
    getDelayRange,
    getDecayRate,
    toFrenchSpeed,
    toEnglishSpeed,
    isValidGameSpeed,
    isValidGameSpeedFR,
    type GameSpeed,
} from '@/lib/engine/config/delay-config';
import {
    getPendingEffectsForUI,
    getEffectIntensity,
    calculateDelayForDecision,
    getDelayRangeForUI,
} from '@/lib/services/delayed-effects.service';
import { createEmptyEffectsQueue, type DelayedEffect, type DelayedEffectsQueue } from '@/lib/engine/effects-types';

// ============================================
// TEST DATA
// ============================================

function createMockEffect(overrides: Partial<DelayedEffect> = {}): DelayedEffect {
    return {
        id: 'eff-test-001',
        decisionId: 'dec-001',
        targetIndex: 'IERH',
        effectType: 'relative',
        value: 10,
        createdAtTurn: 1,
        appliesAtTurn: 3,
        decayRate: 0.2,
        domain: 'rh',
        description: 'Test effect',
        isApplied: false,
        ...overrides,
    };
}

// ============================================
// DELAY CONFIG TESTS
// ============================================

describe('DelayConfig', () => {
    describe('DELAY_CONFIGS', () => {
        it('should have all required domains configured', () => {
            const expectedDomains = ['rh', 'it', 'prevention', 'reputation', 'marketing', 'tarif'];

            for (const domain of expectedDomains) {
                expect(DELAY_CONFIGS[domain]).toBeDefined();
                expect(DELAY_CONFIGS[domain].domain).toBe(domain);
            }
        });

        it('should have valid baseDelay values for all domains', () => {
            for (const [domain, config] of Object.entries(DELAY_CONFIGS)) {
                expect(config.baseDelay.min).toBeGreaterThanOrEqual(0);
                expect(config.baseDelay.max).toBeGreaterThanOrEqual(config.baseDelay.min);
            }
        });

        it('should have valid speed multipliers for all domains', () => {
            const expectedSpeeds: GameSpeed[] = ['fast', 'medium', 'slow'];

            for (const [domain, config] of Object.entries(DELAY_CONFIGS)) {
                for (const speed of expectedSpeeds) {
                    expect(config.speedMultiplier[speed]).toBeGreaterThan(0);
                }
            }
        });

        it('should have decay rates in valid range [0, 1]', () => {
            for (const [domain, config] of Object.entries(DELAY_CONFIGS)) {
                expect(config.decayRate).toBeGreaterThanOrEqual(0);
                expect(config.decayRate).toBeLessThanOrEqual(1);
            }
        });
    });

    describe('getDelayConfig', () => {
        it('should return config for known domain', () => {
            const config = getDelayConfig('rh');

            expect(config.domain).toBe('rh');
            expect(config.baseDelay).toEqual({ min: 2, max: 3 });
        });

        it('should be case-insensitive', () => {
            const config1 = getDelayConfig('RH');
            const config2 = getDelayConfig('rh');
            const config3 = getDelayConfig('Rh');

            expect(config1.domain).toBe('rh');
            expect(config2.domain).toBe('rh');
            expect(config3.domain).toBe('rh');
        });

        it('should return default config for unknown domain', () => {
            const config = getDelayConfig('unknown_domain');

            expect(config.domain).toBe('unknown_domain');
            expect(config.baseDelay.min).toBeGreaterThanOrEqual(1);
        });
    });
});

// ============================================
// DELAY CALCULATION TESTS (US-023 AC1, AC2)
// ============================================

describe('getDelayForDomain', () => {
    describe('RH domain (AC1: delay ~2T at medium speed)', () => {
        it('test_getDelayForDomain_rh_medium: should return delay in [2,3] range', () => {
            const minDelay = getDelayForDomain('rh', 'medium', false);
            const maxDelay = getDelayForDomain('rh', 'medium', true);

            expect(minDelay).toBeGreaterThanOrEqual(2);
            expect(minDelay).toBeLessThanOrEqual(3);
            expect(maxDelay).toBeGreaterThanOrEqual(2);
            expect(maxDelay).toBeLessThanOrEqual(3);
        });

        it('should return minimum delay of 1 at fast speed', () => {
            const delay = getDelayForDomain('rh', 'fast', false);

            // 2 × 0.5 = 1
            expect(delay).toBeGreaterThanOrEqual(1);
            expect(delay).toBeLessThanOrEqual(2);
        });

        it('should return delay of 4-6 at slow speed', () => {
            const minDelay = getDelayForDomain('rh', 'slow', false);
            const maxDelay = getDelayForDomain('rh', 'slow', true);

            // 2 × 2 = 4, 3 × 2 = 6
            expect(minDelay).toBe(4);
            expect(maxDelay).toBe(6);
        });
    });

    describe('IT domain (AC2: delay 3-6T)', () => {
        it('test_getDelayForDomain_it_fast: should return delay in [1.5,3] range (rounded)', () => {
            const minDelay = getDelayForDomain('it', 'fast', false);
            const maxDelay = getDelayForDomain('it', 'fast', true);

            // 3 × 0.5 = 1.5 → 2 (ceil), 6 × 0.5 = 3
            expect(minDelay).toBeGreaterThanOrEqual(1);
            expect(minDelay).toBeLessThanOrEqual(3);
            expect(maxDelay).toBeGreaterThanOrEqual(2);
            expect(maxDelay).toBeLessThanOrEqual(4);
        });

        it('should return delay in [3,6] range at medium speed', () => {
            const minDelay = getDelayForDomain('it', 'medium', false);
            const maxDelay = getDelayForDomain('it', 'medium', true);

            expect(minDelay).toBe(3);
            expect(maxDelay).toBe(6);
        });
    });

    describe('Prevention domain', () => {
        it('should return delay in [4,8] range at medium speed', () => {
            const minDelay = getDelayForDomain('prevention', 'medium', false);
            const maxDelay = getDelayForDomain('prevention', 'medium', true);

            expect(minDelay).toBe(4);
            expect(maxDelay).toBe(8);
        });
    });

    describe('Tarif domain', () => {
        it('should allow delay of 0 for immediate effects', () => {
            const minDelay = getDelayForDomain('tarif', 'medium', false);

            expect(minDelay).toBe(0);
        });

        it('should have max delay of 1 at medium speed', () => {
            const maxDelay = getDelayForDomain('tarif', 'medium', true);

            expect(maxDelay).toBe(1);
        });
    });

    describe('Speed multiplier proportionality', () => {
        it('PROP: delay(slow) = 2 × delay(medium) for RH', () => {
            const mediumDelay = getDelayForDomain('rh', 'medium', false);
            const slowDelay = getDelayForDomain('rh', 'slow', false);

            // Accounting for ceiling
            expect(slowDelay).toBe(mediumDelay * 2);
        });

        it('PROP: delay(fast) = 0.5 × delay(medium) for IT', () => {
            const mediumDelay = getDelayForDomain('it', 'medium', false);
            const fastDelay = getDelayForDomain('it', 'fast', false);

            // 3 × 0.5 = 1.5 → 2 (ceil), but min is 1
            expect(fastDelay).toBeLessThanOrEqual(mediumDelay);
            expect(fastDelay).toBeGreaterThanOrEqual(Math.ceil(mediumDelay * 0.5));
        });
    });

    describe('Delay bounds', () => {
        it('PROP: delay >= baseDelay.min for all domains (at medium speed)', () => {
            for (const [domain, config] of Object.entries(DELAY_CONFIGS)) {
                const delay = getDelayForDomain(domain, 'medium', false);
                const expectedMin = domain === 'tarif' ? 0 : Math.max(1, config.baseDelay.min);

                expect(delay).toBeGreaterThanOrEqual(expectedMin);
            }
        });
    });

    describe('Stability', () => {
        it('PROP: getDelayForDomain returns same result for same params', () => {
            const calls = Array.from({ length: 5 }, () =>
                getDelayForDomain('rh', 'medium', false)
            );

            expect(new Set(calls).size).toBe(1);
        });
    });
});

// ============================================
// DELAY RANGE TESTS
// ============================================

describe('getDelayRange', () => {
    it('should return min and max delays for RH at medium', () => {
        const range = getDelayRange('rh', 'medium');

        expect(range.min).toBe(2);
        expect(range.max).toBe(3);
    });

    it('should return adjusted range for fast speed', () => {
        const range = getDelayRange('it', 'fast');

        expect(range.min).toBeLessThanOrEqual(range.max);
        expect(range.min).toBeGreaterThanOrEqual(1);
    });
});

// ============================================
// UI SERVICE TESTS
// ============================================

describe('getPendingEffectsForUI', () => {
    let queue: DelayedEffectsQueue;

    beforeEach(() => {
        queue = createEmptyEffectsQueue();
    });

    it('test_getPendingEffectsForUI: should return 3 DelayedEffectDisplay for 3 pending effects', () => {
        // Add 3 effects
        queue.pending = [
            createMockEffect({ id: 'eff-1', appliesAtTurn: 3 }),
            createMockEffect({ id: 'eff-2', appliesAtTurn: 4 }),
            createMockEffect({ id: 'eff-3', appliesAtTurn: 5 }),
        ];

        const displays = getPendingEffectsForUI(queue, 2);

        expect(displays).toHaveLength(3);
        expect(displays[0].effectId).toBe('eff-1');
        expect(displays[1].effectId).toBe('eff-2');
        expect(displays[2].effectId).toBe('eff-3');
    });

    it('should filter out applied effects', () => {
        queue.pending = [
            createMockEffect({ id: 'eff-1', isApplied: true }),
            createMockEffect({ id: 'eff-2', isApplied: false }),
        ];

        const displays = getPendingEffectsForUI(queue, 1);

        expect(displays).toHaveLength(1);
        expect(displays[0].effectId).toBe('eff-2');
    });

    it('should sort by expected turn', () => {
        queue.pending = [
            createMockEffect({ id: 'eff-1', appliesAtTurn: 5 }),
            createMockEffect({ id: 'eff-2', appliesAtTurn: 3 }),
            createMockEffect({ id: 'eff-3', appliesAtTurn: 4 }),
        ];

        const displays = getPendingEffectsForUI(queue, 2);

        expect(displays[0].expectedTurn).toBe(3);
        expect(displays[1].expectedTurn).toBe(4);
        expect(displays[2].expectedTurn).toBe(5);
    });

    it('should calculate turnsRemaining correctly', () => {
        queue.pending = [
            createMockEffect({ id: 'eff-1', appliesAtTurn: 5 }),
        ];

        const displays = getPendingEffectsForUI(queue, 2);

        expect(displays[0].turnsRemaining).toBe(3);
    });

    it('should return empty array for empty queue', () => {
        const displays = getPendingEffectsForUI(queue, 1);

        expect(displays).toHaveLength(0);
    });
});

describe('getEffectIntensity', () => {
    it('should return "high" for fresh effect', () => {
        const effect = createMockEffect({ createdAtTurn: 1 });

        const intensity = getEffectIntensity(effect, 1);

        expect(intensity).toBe('high');
    });

    it('should return "medium" for partially decayed effect', () => {
        const effect = createMockEffect({
            createdAtTurn: 1,
            decayRate: 0.2,
        });

        // After 2 turns: 0.8^2 = 0.64 (64% remaining)
        const intensity = getEffectIntensity(effect, 3);

        expect(intensity).toBe('medium');
    });

    it('should return "low" for heavily decayed effect', () => {
        const effect = createMockEffect({
            createdAtTurn: 1,
            decayRate: 0.3,
        });

        // After 4 turns: 0.7^4 ≈ 0.24 (24% remaining)
        const intensity = getEffectIntensity(effect, 5);

        expect(intensity).toBe('low');
    });
});

describe('getDelayRangeForUI', () => {
    it('should return formatted T+X strings', () => {
        const range = getDelayRangeForUI('rh', 'medium');

        expect(range.min).toBe('T+2');
        expect(range.max).toBe('T+3');
    });
});

// ============================================
// SPEED CONVERSION TESTS
// ============================================

describe('Speed conversion', () => {
    it('should convert English to French speed', () => {
        expect(toFrenchSpeed('fast')).toBe('rapide');
        expect(toFrenchSpeed('medium')).toBe('moyenne');
        expect(toFrenchSpeed('slow')).toBe('lente');
    });

    it('should convert French to English speed', () => {
        expect(toEnglishSpeed('rapide')).toBe('fast');
        expect(toEnglishSpeed('moyenne')).toBe('medium');
        expect(toEnglishSpeed('lente')).toBe('slow');
    });

    it('should validate English speed', () => {
        expect(isValidGameSpeed('fast')).toBe(true);
        expect(isValidGameSpeed('medium')).toBe(true);
        expect(isValidGameSpeed('slow')).toBe(true);
        expect(isValidGameSpeed('invalid')).toBe(false);
    });

    it('should validate French speed', () => {
        expect(isValidGameSpeedFR('rapide')).toBe(true);
        expect(isValidGameSpeedFR('moyenne')).toBe(true);
        expect(isValidGameSpeedFR('lente')).toBe(true);
        expect(isValidGameSpeedFR('invalid')).toBe(false);
    });
});

// ============================================
// DECAY RATE TESTS
// ============================================

describe('getDecayRate', () => {
    it('should return correct decay rate for RH (0.2)', () => {
        expect(getDecayRate('rh')).toBe(0.2);
    });

    it('should return correct decay rate for IT (0.15)', () => {
        expect(getDecayRate('it')).toBe(0.15);
    });

    it('should return correct decay rate for prevention (0.1)', () => {
        expect(getDecayRate('prevention')).toBe(0.1);
    });
});

// ============================================
// INTEGRATION TESTS
// ============================================

describe('Integration: Delay calculation with service', () => {
    it('test_delay_service_with_engine: RH effect should have correct delay', () => {
        const delay = calculateDelayForDecision('rh', 'medium', false);

        expect(delay).toBeGreaterThanOrEqual(2);
        expect(delay).toBeLessThanOrEqual(3);
    });

    it('should adjust delay when speed changes', () => {
        const mediumDelay = calculateDelayForDecision('rh', 'medium');
        const fastDelay = calculateDelayForDecision('rh', 'fast');
        const slowDelay = calculateDelayForDecision('rh', 'slow');

        expect(fastDelay).toBeLessThanOrEqual(mediumDelay);
        expect(slowDelay).toBeGreaterThanOrEqual(mediumDelay);
    });
});
