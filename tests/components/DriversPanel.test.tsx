/**
 * DriversPanel Integration Tests
 *
 * @module tests/components/DriversPanel.test
 * @description Integration tests for explainability panel (US-037)
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DriversPanel } from '@/components/game/explainability/DriversPanel';
import { DriverType, type Driver } from '@/lib/engine';

// Mock CSS module
vi.mock('@/components/game/explainability/DriversPanel.module.css', () => ({
    default: {
        panel: 'panel',
        header: 'header',
        title: 'title',
        variation: 'variation',
        positive: 'positive',
        negative: 'negative',
        neutral: 'neutral',
        list: 'list',
        empty: 'empty'
    }
}));

vi.mock('@/components/game/explainability/DriverCard.module.css', () => ({
    default: {
        card: 'card',
        iconWrapper: 'iconWrapper',
        icon: 'icon',
        content: 'content',
        label: 'label',
        contribution: 'contribution',
        value: 'value',
        trendUp: 'trendUp',
        trendDown: 'trendDown',
        trendNeutral: 'trendNeutral'
    }
}));

describe('DriversPanel Integration', () => {
    // Helper to create test drivers
    const createDriver = (overrides: Partial<Driver> = {}): Driver => ({
        sourceId: 'test-1',
        type: DriverType.DECISION,
        label: 'Test Driver',
        contribution: 5,
        contributionPercent: 50,
        direction: 'up',
        ...overrides
    });

    it('should display top 3 drivers with icons', () => {
        const drivers = [
            createDriver({ type: DriverType.DECISION, label: 'Decision 1', contribution: 5 }),
            createDriver({ type: DriverType.EVENT, label: 'Event 1', contribution: -4 }),
            createDriver({ type: DriverType.DELAYED_EFFECT, label: 'Effect 1', contribution: 3 }),
            createDriver({ type: DriverType.DECISION, label: 'Hidden Driver', contribution: 1 }) // Should limit to 3
        ];

        render(<DriversPanel drivers={drivers} indexName="IAC" variation={5} />);

        // Check for list items
        const items = screen.getAllByRole('listitem');
        expect(items).toHaveLength(3);

        // Check for icons
        expect(screen.getByText('📊')).toBeDefined(); // Decision
        expect(screen.getByText('🌍')).toBeDefined(); // Event
        expect(screen.getByText('⏳')).toBeDefined(); // Delayed Effect

        // Ensure 4th driver is NOT shown
        expect(screen.queryByText('Hidden Driver')).toBeNull();
    });

    it('should show contribution formatted correctly', () => {
        const drivers = [
            createDriver({ sourceId: 'd1', contribution: 5, contributionPercent: 50 }),
            createDriver({ sourceId: 'd2', contribution: -3, contributionPercent: -30 })
        ];

        render(<DriversPanel drivers={drivers} indexName="IAC" variation={2} />);

        // AC3: Expect percentages
        expect(screen.getByText('+50%')).toBeDefined();
        expect(screen.getByText('-30%')).toBeDefined();
    });

    it('should display index name and variation in title', () => {
        render(<DriversPanel drivers={[]} indexName="IAC" variation={8} />);

        const title = screen.getByRole('heading', { level: 3 });
        expect(title.textContent).toContain('Pourquoi IAC');
        expect(title.textContent).toContain('+8');
    });

    it('should display empty message when no drivers', () => {
        render(<DriversPanel drivers={[]} indexName="IAC" variation={2} />);

        expect(screen.getByText(/Variation mineure/)).toBeDefined();
    });
});
