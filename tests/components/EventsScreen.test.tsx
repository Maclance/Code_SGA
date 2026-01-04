/**
 * EventsScreen Component Tests
 *
 * @module tests/components/EventsScreen.test
 * @description Integration tests for EventsScreen component (US-033)
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EventsScreen } from '@/components/game/events/EventsScreen';
import type { GameEvent } from '@/lib/engine';

// Mock CSS modules
vi.mock('@/components/game/events/EventsScreen.module.css', () => ({
    default: {
        screen: 'screen',
        header: 'header',
        title: 'title',
        count: 'count',
        eventsList: 'eventsList',
        eventItem: 'eventItem',
        emptyState: 'emptyState',
        emptyIcon: 'emptyIcon',
        emptyTitle: 'emptyTitle',
        emptyText: 'emptyText',
        footer: 'footer',
        continueButton: 'continueButton',
    },
}));

vi.mock('@/components/game/events/EventCard.module.css', () => ({
    default: {
        card: 'card',
        header: 'header',
        typeInfo: 'typeInfo',
        typeIcon: 'typeIcon',
        typeLabel: 'typeLabel',
        badges: 'badges',
        categoryBadge: 'categoryBadge',
        severityBadge: 'severityBadge',
        title: 'title',
        narrative: 'narrative',
        footer: 'footer',
        impactBadge: 'impactBadge',
        duration: 'duration',
        details: 'details',
        detailsTitle: 'detailsTitle',
        impactsList: 'impactsList',
        impactItem: 'impactItem',
    },
}));

vi.mock('@/components/game/events/NewsFlashBanner.module.css', () => ({
    default: {
        banner: 'banner',
        flashHeader: 'flashHeader',
        flashIcon: 'flashIcon',
        flashLabel: 'flashLabel',
        content: 'content',
        typeIcon: 'typeIcon',
        eventInfo: 'eventInfo',
        title: 'title',
        narrative: 'narrative',
        dismissButton: 'dismissButton',
    },
}));

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
        timestamp: '2026-01-02T12:00:00Z',
        turnTriggered: 1,
        ...overrides,
    };
}

// ============================================
// AC4: CHRONOLOGICAL SORTING
// ============================================

describe('EventsScreen - Chronological Sorting', () => {
    it('should display events sorted by timestamp descending', () => {
        const events: GameEvent[] = [
            createTestEvent({
                id: 'evt-1',
                name: 'Ancien',
                timestamp: '2026-01-01T10:00:00Z',
            }),
            createTestEvent({
                id: 'evt-2',
                name: 'Récent',
                timestamp: '2026-01-02T10:00:00Z',
            }),
        ];

        render(<EventsScreen events={events} currentTurn={1} />);

        const cards = screen.getAllByRole('article');
        expect(cards).toHaveLength(2);

        // Most recent event should come first
        expect(cards[0].textContent).toContain('Récent');
        expect(cards[1].textContent).toContain('Ancien');
    });

    it('should handle events with same timestamp gracefully', () => {
        const events: GameEvent[] = [
            createTestEvent({
                id: 'evt-1',
                name: 'Event A',
                timestamp: '2026-01-01T10:00:00Z',
            }),
            createTestEvent({
                id: 'evt-2',
                name: 'Event B',
                timestamp: '2026-01-01T10:00:00Z',
            }),
        ];

        render(<EventsScreen events={events} currentTurn={1} />);

        const cards = screen.getAllByRole('article');
        expect(cards).toHaveLength(2);
    });
});

// ============================================
// NEWS FLASH BANNER
// ============================================

describe('EventsScreen - NewsFlash Banner', () => {
    it('should show NewsFlashBanner for critical events', () => {
        const events: GameEvent[] = [
            createTestEvent({
                id: 'evt-1',
                type: 'company',
                category: 'CYBER',
                severity: 'critical',
                name: 'Cyberattaque majeure',
            }),
        ];

        render(<EventsScreen events={events} currentTurn={1} showFlash />);

        // NewsFlashBanner has "FLASH INFO" label and aria-live="assertive"
        const flashLabel = screen.getByText('FLASH INFO');
        expect(flashLabel).toBeDefined();
        // Event name appears in both banner and card, so use getAllByText
        const eventTitles = screen.getAllByText('Cyberattaque majeure');
        expect(eventTitles.length).toBeGreaterThanOrEqual(1);
    });

    it('should not show NewsFlashBanner when showFlash is false', () => {
        const events: GameEvent[] = [
            createTestEvent({
                id: 'evt-1',
                severity: 'critical',
                name: 'Critical Event',
            }),
        ];

        render(<EventsScreen events={events} currentTurn={1} showFlash={false} />);

        // NewsFlashBanner should not appear - check for "FLASH INFO" label
        expect(screen.queryByText('FLASH INFO')).toBeNull();
    });

    it('should not show NewsFlashBanner for non-critical events', () => {
        const events: GameEvent[] = [
            createTestEvent({
                id: 'evt-1',
                severity: 'high',
                name: 'High Severity Event',
            }),
        ];

        render(<EventsScreen events={events} currentTurn={1} showFlash />);

        // NewsFlashBanner only appears for critical events - check for "FLASH INFO" label
        expect(screen.queryByText('FLASH INFO')).toBeNull();
    });
});

// ============================================
// AC1: EVENT TYPE DISPLAY
// ============================================

describe('EventsScreen - Event Type Display', () => {
    it('should display market event type icon (🌍)', () => {
        const events: GameEvent[] = [
            createTestEvent({ type: 'market', name: 'Market Event' }),
        ];

        render(<EventsScreen events={events} currentTurn={1} />);

        expect(screen.getByText('🌍')).toBeDefined();
        expect(screen.getByText('Événement Marché')).toBeDefined();
    });

    it('should display company event type icon (🏢)', () => {
        const events: GameEvent[] = [
            createTestEvent({ type: 'company', name: 'Company Event' }),
        ];

        render(<EventsScreen events={events} currentTurn={1} />);

        expect(screen.getByText('🏢')).toBeDefined();
        expect(screen.getByText('Événement Compagnie')).toBeDefined();
    });
});

// ============================================
// EMPTY STATE
// ============================================

describe('EventsScreen - Empty State', () => {
    it('should display empty message when no events', () => {
        render(<EventsScreen events={[]} currentTurn={1} />);

        expect(screen.getByText(/Pas d'événement majeur/)).toBeDefined();
        expect(screen.getByText(/bons auspices/)).toBeDefined();
    });

    it('should display event count when events are present', () => {
        const events: GameEvent[] = [
            createTestEvent({ id: 'evt-1' }),
            createTestEvent({ id: 'evt-2' }),
            createTestEvent({ id: 'evt-3' }),
        ];

        render(<EventsScreen events={events} currentTurn={1} />);

        expect(screen.getByText('3 événements')).toBeDefined();
    });

    it('should use singular form for single event', () => {
        const events: GameEvent[] = [createTestEvent({ id: 'evt-1' })];

        render(<EventsScreen events={events} currentTurn={1} />);

        expect(screen.getByText('1 événement')).toBeDefined();
    });
});

// ============================================
// AC2: IMPACT AND DURATION DISPLAY
// ============================================

describe('EventsScreen - Impact and Duration', () => {
    it('should display impact badge on event card', () => {
        const events: GameEvent[] = [
            createTestEvent({
                id: 'evt-1',
                impacts: [{ target: 'IPP', value: -5, type: 'absolute' }],
            }),
        ];

        render(<EventsScreen events={events} currentTurn={1} />);

        // Impact badge should show negative indicator
        expect(screen.getByText('❌')).toBeDefined();
    });

    it('should display duration on event card', () => {
        const events: GameEvent[] = [
            createTestEvent({
                id: 'evt-1',
                duration: 3,
                turnTriggered: 1,
            }),
        ];

        render(<EventsScreen events={events} currentTurn={1} />);

        expect(screen.getByText('3 tours restants')).toBeDefined();
    });
});

// ============================================
// ACCESSIBILITY
// ============================================

describe('EventsScreen - Accessibility', () => {
    it('should have accessible title', () => {
        render(<EventsScreen events={[]} currentTurn={1} />);

        const title = screen.getByRole('heading', { level: 1 });
        expect(title).toBeDefined();
        expect(title.id).toBe('events-title');
    });

    it('should have role="list" on events container when events exist', () => {
        const events: GameEvent[] = [createTestEvent()];

        render(<EventsScreen events={events} currentTurn={1} />);

        expect(screen.getByRole('list')).toBeDefined();
    });

    it('should have role="article" on each event card', () => {
        const events: GameEvent[] = [
            createTestEvent({ id: 'evt-1' }),
            createTestEvent({ id: 'evt-2' }),
        ];

        render(<EventsScreen events={events} currentTurn={1} />);

        const articles = screen.getAllByRole('article');
        expect(articles).toHaveLength(2);
    });
});

// ============================================
// CONTINUE BUTTON
// ============================================

describe('EventsScreen - Continue Button', () => {
    it('should display continue button when onContinue provided', () => {
        const onContinue = vi.fn();

        render(
            <EventsScreen
                events={[]}
                currentTurn={1}
                onContinue={onContinue}
            />
        );

        const button = screen.getByRole('button', { name: /Prendre des décisions/ });
        expect(button).toBeDefined();
    });

    it('should not display continue button when onContinue not provided', () => {
        render(<EventsScreen events={[]} currentTurn={1} />);

        expect(screen.queryByRole('button', { name: /Prendre des décisions/ })).toBeNull();
    });
});
