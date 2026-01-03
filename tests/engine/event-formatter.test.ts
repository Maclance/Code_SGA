/**
 * Event Formatter Unit Tests
 *
 * @module tests/engine/event-formatter.test
 * @description Unit tests for event narrative formatting (US-033)
 */

import { describe, it, expect } from 'vitest';
import {
    EventTypeEnum,
    formatEventNarrative,
    formatImpactBadge,
    formatSingleImpact,
    getRemainingDuration,
    formatDuration,
    isEventActive,
    getEventNarrative,
} from '@/lib/engine/events/event-formatter';
import type { GameEvent, EventImpact } from '@/lib/engine/events/event-types';

// ============================================
// TEST HELPERS
// ============================================

function createTestEvent(overrides: Partial<GameEvent> = {}): GameEvent {
    return {
        id: 'EVT-TEST-01',
        type: 'market',
        category: 'CLIMAT',
        name: 'Test Event',
        severity: 'medium',
        impacts: [],
        duration: 2,
        timestamp: '2026-01-01T12:00:00Z',
        turnTriggered: 1,
        ...overrides,
    };
}

// ============================================
// AC3: NARRATIVE FORMATTING (≥50 characters)
// ============================================

describe('EventFormatter - Narrative Generation', () => {
    it('should format climate event with dramatic narrative', () => {
        const event = {
            type: EventTypeEnum.CLIMATE_EPISODE,
            severity: 'high' as const,
            impactMRH: 15,
            impactAuto: 5,
        };

        const narrative = formatEventNarrative(event);

        expect(narrative.length).toBeGreaterThan(50);
        expect(narrative.toLowerCase()).toContain('tempête');
    });

    it('should format inflation event with economic context', () => {
        const event = {
            type: EventTypeEnum.INFLATION,
            severity: 'medium' as const,
            rate: 8,
            duration: 'persistent',
        };

        const narrative = formatEventNarrative(event);

        expect(narrative.length).toBeGreaterThan(50);
        expect(narrative.toLowerCase()).toContain('inflation');
    });

    it('should format disruptor event with competitive angle', () => {
        const event = {
            type: EventTypeEnum.DISRUPTOR,
            severity: 'medium' as const,
            priceImpact: -5,
            duration: 3,
        };

        const narrative = formatEventNarrative(event);

        expect(narrative.length).toBeGreaterThan(50);
        expect(narrative.toLowerCase()).toContain('concurrent');
    });

    it('should format cyber attack event with security narrative', () => {
        const event = {
            type: EventTypeEnum.CYBER_ATTACK,
            severity: 'critical' as const,
        };

        const narrative = formatEventNarrative(event);

        expect(narrative.length).toBeGreaterThan(50);
        expect(narrative.toLowerCase()).toMatch(/ransomware|attaque|compromis/);
    });

    it('should handle unknown event type with fallback narrative', () => {
        const event = {
            type: 'UNKNOWN_TYPE' as EventTypeEnum,
            severity: 'medium' as const,
        };

        const narrative = formatEventNarrative(event);

        expect(narrative.length).toBeGreaterThan(0);
        expect(narrative).toContain('événement');
    });

    it('should vary narrative based on severity level', () => {
        const lowSeverity = formatEventNarrative({
            type: EventTypeEnum.CLIMATE_EPISODE,
            severity: 'low',
        });

        const criticalSeverity = formatEventNarrative({
            type: EventTypeEnum.CLIMATE_EPISODE,
            severity: 'critical',
        });

        expect(lowSeverity).not.toEqual(criticalSeverity);
        expect(criticalSeverity.toLowerCase()).toContain('catastrophe');
    });
});

// ============================================
// IMPACT BADGE FORMATTING
// ============================================

describe('EventFormatter - Impact Badge', () => {
    it('should return negative badge for negative impacts', () => {
        const impacts: EventImpact[] = [
            { target: 'IPP', value: -5, type: 'absolute' },
            { target: 'IRF', value: -3, type: 'absolute' },
        ];

        const badge = formatImpactBadge(impacts);

        expect(badge.type).toBe('negative');
        expect(badge.icon).toBe('❌');
        expect(badge.label).toContain('-8');
    });

    it('should return positive badge for positive impacts', () => {
        const impacts: EventImpact[] = [
            { target: 'IAC', value: 5, type: 'absolute' },
        ];

        const badge = formatImpactBadge(impacts);

        expect(badge.type).toBe('positive');
        expect(badge.icon).toBe('✅');
        expect(badge.label).toContain('+5');
    });

    it('should return neutral badge for balanced or empty impacts', () => {
        const emptyBadge = formatImpactBadge([]);
        expect(emptyBadge.type).toBe('neutral');
        expect(emptyBadge.icon).toBe('⚪');

        const balancedBadge = formatImpactBadge([
            { target: 'IAC', value: 5, type: 'absolute' },
            { target: 'IRF', value: -5, type: 'absolute' },
        ]);
        expect(balancedBadge.type).toBe('neutral');
    });
});

// ============================================
// SINGLE IMPACT FORMATTING
// ============================================

describe('EventFormatter - Single Impact', () => {
    it('should format absolute impact correctly', () => {
        const impact: EventImpact = { target: 'IPP', value: -5, type: 'absolute' };
        const formatted = formatSingleImpact(impact);

        expect(formatted).toBe('IPP: -5');
    });

    it('should format relative impact with percentage', () => {
        const impact: EventImpact = { target: 'IAC', value: 10, type: 'relative' };
        const formatted = formatSingleImpact(impact);

        expect(formatted).toBe('IAC: +10%');
    });

    it('should add plus sign for positive values', () => {
        const impact: EventImpact = { target: 'IERH', value: 3, type: 'absolute' };
        const formatted = formatSingleImpact(impact);

        expect(formatted).toBe('IERH: +3');
    });
});

// ============================================
// DURATION HELPERS
// ============================================

describe('EventFormatter - Duration Helpers', () => {
    it('should calculate remaining duration correctly', () => {
        const event = createTestEvent({ duration: 4, turnTriggered: 2 });

        expect(getRemainingDuration(event, 2)).toBe(4);
        expect(getRemainingDuration(event, 3)).toBe(3);
        expect(getRemainingDuration(event, 5)).toBe(1);
        expect(getRemainingDuration(event, 6)).toBe(0);
        expect(getRemainingDuration(event, 10)).toBe(0);
    });

    it('should format duration text in French', () => {
        expect(formatDuration(0)).toBe('Se termine ce tour');
        expect(formatDuration(1)).toBe('1 tour restant');
        expect(formatDuration(3)).toBe('3 tours restants');
    });

    it('should check if event is still active', () => {
        const event = createTestEvent({ duration: 2, turnTriggered: 1 });

        expect(isEventActive(event, 1)).toBe(true);
        expect(isEventActive(event, 2)).toBe(true);
        expect(isEventActive(event, 3)).toBe(false);
    });
});

// ============================================
// GET EVENT NARRATIVE
// ============================================

describe('EventFormatter - getEventNarrative', () => {
    it('should use existing narrative if present and long enough', () => {
        const customNarrative = 'Ceci est un narratif personnalisé de plus de cinquante caractères pour le test.';
        const event = createTestEvent({ narrative: customNarrative });

        const result = getEventNarrative(event);

        expect(result).toBe(customNarrative);
    });

    it('should generate narrative based on category if none provided', () => {
        const event = createTestEvent({ category: 'CYBER' });

        const result = getEventNarrative(event);

        expect(result.length).toBeGreaterThan(50);
    });

    it('should map categories to appropriate event types', () => {
        const climateEvent = createTestEvent({ category: 'CLIMAT', severity: 'high' });
        const climateNarrative = getEventNarrative(climateEvent);
        expect(climateNarrative.toLowerCase()).toMatch(/tempête|climatique|intempéries/);

        const economicEvent = createTestEvent({ category: 'ECONOMIQUE', severity: 'medium' });
        const economicNarrative = getEventNarrative(economicEvent);
        expect(economicNarrative.toLowerCase()).toMatch(/inflation|coût|marges/);
    });
});
