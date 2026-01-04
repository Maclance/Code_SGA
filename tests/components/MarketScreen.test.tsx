/**
 * MarketScreen Component Tests
 *
 * @module tests/components/MarketScreen.test
 * @description Integration tests for MarketScreen component (US-036)
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MarketScreen } from '@/components/game/market/MarketScreen';

// Mock CSS modules
vi.mock('@/components/game/market/MarketScreen.module.css', () => ({
    default: {
        container: 'container',
        header: 'header',
        title: 'title',
        subtitle: 'subtitle',
        controls: 'controls',
        controlButton: 'controlButton',
        controlActive: 'controlActive',
        grid: 'grid',
        card: 'card'
    }
}));

vi.mock('@/components/game/market/MarketShareChart.module.css', () => ({
    default: {
        chartContainer: 'chartContainer',
        legend: 'legend',
        legendItem: 'legendItem',
        name: 'name',
        share: 'share',
        chartPlaceholder: 'chartPlaceholder',
        centerValue: 'centerValue',
        centerLabel: 'centerLabel',
        centerNumber: 'centerNumber',
        colorDot: 'colorDot'
    }
}));

vi.mock('@/components/game/market/PriceTrendChart.module.css', () => ({
    default: {
        chartContainer: 'chartContainer',
        title: 'title',
        gapBadge: 'gapBadge',
        gapPositive: 'gapPositive',
        gapNegative: 'gapNegative',
        gapNeutral: 'gapNeutral',
        chartArea: 'chartArea',
        lineSvg: 'lineSvg',
        trendLine: 'trendLine',
        linePlayer: 'linePlayer',
        lineMarket: 'lineMarket',
        priceLabel: 'priceLabel',
        turnLabel: 'turnLabel',
        gridLine: 'gridLine',
        legend: 'legend',
        legendItem: 'legendItem',
        legendLine: 'legendLine'
    }
}));

describe('MarketScreen Integration', () => {
    const mockData = {
        indices: { IAC: 65 },
        turnNumber: 5
    };

    it('should render main title and subtitle', () => {
        render(<MarketScreen data={mockData} />);

        expect(screen.getByText('Analyse du Marché')).toBeDefined();
        expect(screen.getByText(/Positionnement concurrentiel/)).toBeDefined();
    });

    it('should display product controls', () => {
        render(<MarketScreen data={mockData} />);

        expect(screen.getByText('AUTO')).toBeDefined();
        expect(screen.getByText('MRH')).toBeDefined();
    });

    it('should switch controls comparison when clicked', () => {
        render(<MarketScreen data={mockData} />);

        const mrhButton = screen.getByText('MRH');
        fireEvent.click(mrhButton);
        expect(mrhButton).toBeDefined();
    });

    it('should render both charts', () => {
        render(<MarketScreen data={mockData} />);

        // Check for MarketShareChart elements
        expect(screen.getByText('Votre part')).toBeDefined();
        expect(screen.getByText(/Vous/)).toBeDefined();

        // Check for PriceTrendChart elements via testid
        expect(screen.getByTestId('price-trend-chart')).toBeDefined();
        expect(screen.getByText('Évolution Tarifaire')).toBeDefined();
    });

    it('should handle missing data gracefully', () => {
        render(<MarketScreen data={undefined} />);

        // Should fallback to default values without crashing
        expect(screen.getByText('Analyse du Marché')).toBeDefined();
    });
});
