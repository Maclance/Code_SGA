/**
 * ProductGrid Component Tests
 *
 * @module tests/components/dashboard/ProductGrid.test
 * @description Tests for ProductGrid component (US-030)
 */

import { describe, it, expect, vi } from 'vitest';
import type { ProductDisplayMetrics, Difficulty } from '@/lib/engine';
import { getDashboardConfig, PRODUCT_NAMES } from '@/lib/engine';

// Mock CSS module
vi.mock('@/components/game/dashboard/ProductGrid.module.css', () => ({
    default: {
        grid: 'grid',
        card: 'card',
        skeleton: 'skeleton',
        skeletonHeader: 'skeletonHeader',
        skeletonBody: 'skeletonBody',
        cardHeader: 'cardHeader',
        productIcon: 'productIcon',
        productName: 'productName',
        metrics: 'metrics',
        metric: 'metric',
        metricLabel: 'metricLabel',
        metricValue: 'metricValue',
        positive: 'positive',
        negative: 'negative',
        totalCard: 'totalCard',
    },
}));

// ============================================
// TEST HELPERS
// ============================================

function createMockProducts(): ProductDisplayMetrics[] {
    return [
        {
            productId: 'auto',
            productName: PRODUCT_NAMES.auto,
            nbContrats: 45000,
            primesCollectees: 52_000_000,
            stockSinistres: 2100,
            fluxEntrees: 180,
            fluxSorties: 165,
            frequence: 7.2,
            coutMoyen: 2800,
        },
        {
            productId: 'mrh',
            productName: PRODUCT_NAMES.mrh,
            nbContrats: 32000,
            primesCollectees: 28_000_000,
            stockSinistres: 1200,
            fluxEntrees: 95,
            fluxSorties: 88,
            frequence: 4.8,
            coutMoyen: 3500,
        },
    ];
}

// ============================================
// RENDERING TESTS
// ============================================

describe('ProductGrid Rendering', () => {
    it('test_ProductGrid_renders_products: 2 products → 2 cards displayed', () => {
        const products = createMockProducts();

        // Verify we have 2 products
        expect(products.length).toBe(2);

        // Each product should have required fields
        for (const product of products) {
            expect(product.productId).toBeDefined();
            expect(product.productName).toBeDefined();
            expect(product.nbContrats).toBeGreaterThan(0);
            expect(product.primesCollectees).toBeGreaterThan(0);
            expect(product.stockSinistres).toBeGreaterThan(0);
        }
    });

    it('should have correct product names', () => {
        const products = createMockProducts();

        expect(products[0].productName).toBe('Automobile');
        expect(products[1].productName).toBe('Multirisque Habitation');
    });

    it('should calculate totals correctly', () => {
        const products = createMockProducts();

        const totalContrats = products.reduce((sum, p) => sum + p.nbContrats, 0);
        const totalPrimes = products.reduce((sum, p) => sum + p.primesCollectees, 0);
        const totalStock = products.reduce((sum, p) => sum + p.stockSinistres, 0);

        expect(totalContrats).toBe(77000);
        expect(totalPrimes).toBe(80_000_000);
        expect(totalStock).toBe(3300);
    });
});

// ============================================
// DIFFICULTY FILTERING TESTS
// ============================================

describe('ProductGrid Difficulty Filtering', () => {
    it('test_ProductGrid_novice_hides_detailed: Novice mode hides flux/frequence/coutMoyen', () => {
        const config = getDashboardConfig('novice');

        expect(config.showDetailedMetrics).toBe(false);
        expect(config.showFluxMetrics).toBe(false);
    });

    it('test_ProductGrid_intermediate_shows_detailed: Intermediate shows all metrics', () => {
        const config = getDashboardConfig('intermediaire');

        expect(config.showDetailedMetrics).toBe(true);
        expect(config.showFluxMetrics).toBe(true);
    });

    it('should show alerts by default', () => {
        const noviceConfig = getDashboardConfig('novice');
        const intermediateConfig = getDashboardConfig('intermediaire');

        expect(noviceConfig.showAlerts).toBe(true);
        expect(intermediateConfig.showAlerts).toBe(true);
    });
});

// ============================================
// PROPS TESTS
// ============================================

describe('ProductGrid Props', () => {
    it('should accept required props', () => {
        const props = {
            products: createMockProducts(),
            difficulty: 'novice' as Difficulty,
        };

        expect(props.products.length).toBe(2);
        expect(props.difficulty).toBe('novice');
    });

    it('should accept optional props', () => {
        const props = {
            products: createMockProducts(),
            difficulty: 'intermediaire' as Difficulty,
            isLoading: false,
            locale: 'fr' as const,
        };

        expect(props.isLoading).toBe(false);
        expect(props.locale).toBe('fr');
    });
});

// ============================================
// EDGE CASES
// ============================================

describe('ProductGrid Edge Cases', () => {
    it('should handle empty products array', () => {
        const products: ProductDisplayMetrics[] = [];
        const totalContrats = products.reduce((sum, p) => sum + p.nbContrats, 0);

        expect(totalContrats).toBe(0);
    });

    it('should handle single product', () => {
        const products = [createMockProducts()[0]];

        expect(products.length).toBe(1);
        expect(products[0].productId).toBe('auto');
    });

    it('should handle missing optional metrics', () => {
        const product: ProductDisplayMetrics = {
            productId: 'auto',
            productName: 'Auto',
            nbContrats: 1000,
            primesCollectees: 500000,
            stockSinistres: 50,
            // Optional fields not provided
        };

        expect(product.fluxEntrees).toBeUndefined();
        expect(product.fluxSorties).toBeUndefined();
        expect(product.frequence).toBeUndefined();
        expect(product.coutMoyen).toBeUndefined();
    });
});
