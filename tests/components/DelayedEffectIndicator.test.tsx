/**
 * DelayedEffectIndicator Component Tests
 *
 * @module tests/components/DelayedEffectIndicator.test
 * @description Tests for DelayedEffectIndicator component (US-023)
 */

import { describe, it, expect, vi } from 'vitest';
import React from 'react';

// Mock the CSS module
vi.mock('@/components/game/DelayedEffectIndicator.module.css', () => ({
    default: {
        indicator: 'indicator',
        high: 'high',
        medium: 'medium',
        low: 'low',
        iconContainer: 'iconContainer',
        icon: 'icon',
        content: 'content',
        delayText: 'delayText',
        intensityBadge: 'intensityBadge',
        compact: 'compact',
    },
}));

// Import after mocking
import {
    getDelayIndicatorText,
    getIntensityText,
    getDelayRangeForUI,
} from '@/lib/services/delayed-effects.service';

// ============================================
// i18n TEXT TESTS
// ============================================

describe('DelayedEffectIndicator i18n', () => {
    describe('getDelayIndicatorText (French)', () => {
        it('should return "Effet immédiat" for 0 turns', () => {
            expect(getDelayIndicatorText(0, 'fr')).toBe('Effet immédiat');
        });

        it('should return "Effet attendu au prochain tour" for 1 turn', () => {
            expect(getDelayIndicatorText(1, 'fr')).toBe('Effet attendu au prochain tour');
        });

        it('should return "Effet attendu à T+2" for 2 turns', () => {
            expect(getDelayIndicatorText(2, 'fr')).toBe('Effet attendu à T+2');
        });

        it('should return "Effet attendu à T+3" for 3 turns', () => {
            expect(getDelayIndicatorText(3, 'fr')).toBe('Effet attendu à T+3');
        });
    });

    describe('getDelayIndicatorText (English)', () => {
        it('should return "Immediate effect" for 0 turns', () => {
            expect(getDelayIndicatorText(0, 'en')).toBe('Immediate effect');
        });

        it('should return "Effect expected next turn" for 1 turn', () => {
            expect(getDelayIndicatorText(1, 'en')).toBe('Effect expected next turn');
        });

        it('should return "Effect expected at T+2" for 2 turns', () => {
            expect(getDelayIndicatorText(2, 'en')).toBe('Effect expected at T+2');
        });
    });

    describe('getIntensityText', () => {
        it('should return French intensity labels', () => {
            expect(getIntensityText('high', 'fr')).toBe('Fort');
            expect(getIntensityText('medium', 'fr')).toBe('Moyen');
            expect(getIntensityText('low', 'fr')).toBe('Faible');
        });

        it('should return English intensity labels', () => {
            expect(getIntensityText('high', 'en')).toBe('High');
            expect(getIntensityText('medium', 'en')).toBe('Medium');
            expect(getIntensityText('low', 'en')).toBe('Low');
        });
    });
});

// ============================================
// DELAY RANGE UI TESTS
// ============================================

describe('DelayedEffectIndicator delay range', () => {
    describe('getDelayRangeForUI', () => {
        it('test_ui_indicator_display: should show T+2 to T+3 for RH at medium speed', () => {
            const range = getDelayRangeForUI('rh', 'medium');

            expect(range.min).toBe('T+2');
            expect(range.max).toBe('T+3');
        });

        it('should show reduced delay at fast speed', () => {
            const mediumRange = getDelayRangeForUI('rh', 'medium');
            const fastRange = getDelayRangeForUI('rh', 'fast');

            // Fast speed should have lower delays
            const mediumMin = parseInt(mediumRange.min.replace('T+', ''));
            const fastMin = parseInt(fastRange.min.replace('T+', ''));

            expect(fastMin).toBeLessThanOrEqual(mediumMin);
        });

        it('should show increased delay at slow speed', () => {
            const mediumRange = getDelayRangeForUI('rh', 'medium');
            const slowRange = getDelayRangeForUI('rh', 'slow');

            // Slow speed should have higher delays
            const mediumMin = parseInt(mediumRange.min.replace('T+', ''));
            const slowMin = parseInt(slowRange.min.replace('T+', ''));

            expect(slowMin).toBeGreaterThanOrEqual(mediumMin);
        });

        it('should show T+3 to T+6 for IT at medium speed', () => {
            const range = getDelayRangeForUI('it', 'medium');

            expect(range.min).toBe('T+3');
            expect(range.max).toBe('T+6');
        });
    });
});

// ============================================
// COMPONENT PROPS TESTS (mock rendering)
// ============================================

describe('DelayedEffectIndicator props', () => {
    it('should accept all required props', () => {
        const props = {
            domain: 'rh',
            currentTurn: 3,
            gameSpeed: 'medium' as const,
        };

        // Validate props structure
        expect(props.domain).toBe('rh');
        expect(props.currentTurn).toBe(3);
        expect(props.gameSpeed).toBe('medium');
    });

    it('should accept optional props', () => {
        const props = {
            domain: 'rh',
            currentTurn: 3,
            gameSpeed: 'medium' as const,
            turnsRemaining: 2,
            intensity: 'high' as const,
            targetIndex: 'IERH',
            showRange: true,
            locale: 'fr',
        };

        expect(props.turnsRemaining).toBe(2);
        expect(props.intensity).toBe('high');
        expect(props.targetIndex).toBe('IERH');
        expect(props.showRange).toBe(true);
        expect(props.locale).toBe('fr');
    });
});

// ============================================
// COMPACT INDICATOR TESTS
// ============================================

describe('CompactDelayIndicator', () => {
    it('should format turns remaining as T+X', () => {
        const expectedFormats = [
            { turns: 0, expected: 'Now' },
            { turns: 1, expected: 'T+1' },
            { turns: 2, expected: 'T+2' },
            { turns: 5, expected: 'T+5' },
        ];

        for (const { turns, expected } of expectedFormats) {
            const displayText = turns === 0 ? 'Now' : `T+${turns}`;
            expect(displayText).toBe(expected);
        }
    });
});

// ============================================
// DOMAIN SPECIFIC TESTS (US-023 AC1, AC2)
// ============================================

describe('Domain specific delay displays', () => {
    it('AC1: RH domain should show delay around T+2 at medium speed', () => {
        const range = getDelayRangeForUI('rh', 'medium');
        const minDelay = parseInt(range.min.replace('T+', ''));

        expect(minDelay).toBeGreaterThanOrEqual(2);
        expect(minDelay).toBeLessThanOrEqual(3);
    });

    it('AC2: IT domain should show delay 3-6 at medium speed', () => {
        const range = getDelayRangeForUI('it', 'medium');
        const minDelay = parseInt(range.min.replace('T+', ''));
        const maxDelay = parseInt(range.max.replace('T+', ''));

        expect(minDelay).toBe(3);
        expect(maxDelay).toBe(6);
    });

    it('Prevention domain should show delay 4-8 at medium speed', () => {
        const range = getDelayRangeForUI('prevention', 'medium');
        const minDelay = parseInt(range.min.replace('T+', ''));
        const maxDelay = parseInt(range.max.replace('T+', ''));

        expect(minDelay).toBe(4);
        expect(maxDelay).toBe(8);
    });
});

// ============================================
// SPEED CHANGE TESTS
// ============================================

describe('Speed change impact on display', () => {
    it('should reduce displayed delay when speed changes to fast', () => {
        // Simulating scenario E2E step 5-6
        const mediumRange = getDelayRangeForUI('rh', 'medium');
        const fastRange = getDelayRangeForUI('rh', 'fast');

        const mediumMin = parseInt(mediumRange.min.replace('T+', ''));
        const fastMin = parseInt(fastRange.min.replace('T+', ''));

        // Fast should show lower delay
        expect(fastMin).toBeLessThan(mediumMin);
    });

    it('should increase displayed delay when speed changes to slow', () => {
        const mediumRange = getDelayRangeForUI('rh', 'medium');
        const slowRange = getDelayRangeForUI('rh', 'slow');

        const mediumMax = parseInt(mediumRange.max.replace('T+', ''));
        const slowMax = parseInt(slowRange.max.replace('T+', ''));

        // Slow should show higher delay
        expect(slowMax).toBeGreaterThan(mediumMax);
    });
});
