/**
 * Aggregation Unit Tests
 *
 * @module tests/engine/aggregation.test
 * @description Unit tests for multi-product aggregation (US-022)
 *
 * References:
 * - docs/000_projet/specs_fonctionnelles_mvp.md (US-022 DoD/QA)
 */

import { describe, it, expect } from 'vitest';
import {
    calculateWeights,
    validateWeightsSum,
    aggregateIndices,
    aggregatePnL,
    calculateAggregatedState,
    getDominantProduct,
    isBalancedPortfolio,
    createEmptyAggregatedState,
    type ProductMetrics,
    type ProductId,
    type IndicesState,
    INDEX_IDS,
    PRODUCT_IDS,
    DEFAULT_INDICES,
} from '@/lib/engine';

// ============================================
// TEST DATA HELPERS
// ============================================

/**
 * Create default product metrics for testing
 */
function createProductMetrics(
    productId: ProductId,
    overrides: Partial<ProductMetrics> = {}
): ProductMetrics {
    return {
        productId,
        primes: productId === 'auto' ? 70_000_000 : 30_000_000,
        sinistres: productId === 'auto' ? 49_000_000 : 21_000_000,
        stock_sinistres: productId === 'auto' ? 8000 : 4000,
        frequence: 0.08,
        cout_moyen: 2500,
        ratio_sp: 0.7,
        nbContrats: productId === 'auto' ? 150000 : 100000,
        indices: { ...DEFAULT_INDICES },
        ...overrides,
    };
}

/**
 * Create product metrics with specific indices
 */
function createProductWithIndices(
    productId: ProductId,
    primes: number,
    indices: Partial<IndicesState>
): ProductMetrics {
    return {
        ...createProductMetrics(productId, { primes }),
        indices: { ...DEFAULT_INDICES, ...indices },
    };
}

// ============================================
// WEIGHT CALCULATION TESTS
// ============================================

describe('calculateWeights', () => {
    /**
     * QA Test: test_calculateWeights
     * Auto 70M€, MRH 30M€ → weights.auto=0.7, weights.mrh=0.3
     */
    it('should calculate weights based on premium share', () => {
        const products = {
            auto: createProductMetrics('auto', { primes: 70_000_000 }),
            mrh: createProductMetrics('mrh', { primes: 30_000_000 }),
        };

        const weights = calculateWeights(products);

        expect(weights.auto).toBeCloseTo(0.7, 2);
        expect(weights.mrh).toBeCloseTo(0.3, 2);
    });

    it('should handle equal premiums', () => {
        const products = {
            auto: createProductMetrics('auto', { primes: 50_000_000 }),
            mrh: createProductMetrics('mrh', { primes: 50_000_000 }),
        };

        const weights = calculateWeights(products);

        expect(weights.auto).toBeCloseTo(0.5, 2);
        expect(weights.mrh).toBeCloseTo(0.5, 2);
    });

    it('should give weight 0 to products with 0 primes', () => {
        const products = {
            auto: createProductMetrics('auto', { primes: 100_000_000 }),
            mrh: createProductMetrics('mrh', { primes: 0 }),
        };

        const weights = calculateWeights(products);

        expect(weights.auto).toBe(1.0);
        expect(weights.mrh).toBe(0);
    });

    it('should handle single product', () => {
        const products = {
            auto: createProductMetrics('auto', { primes: 100_000_000 }),
        };

        const weights = calculateWeights(products);

        expect(weights.auto).toBe(1.0);
        expect(weights.mrh).toBe(0);
    });
});

describe('validateWeightsSum', () => {
    it('should return true when sum is 1.0', () => {
        const weights = { auto: 0.7, mrh: 0.3 };
        expect(validateWeightsSum(weights)).toBe(true);
    });

    it('should return true for empty weights (sum = 0)', () => {
        const weights = { auto: 0, mrh: 0 };
        expect(validateWeightsSum(weights)).toBe(true);
    });

    it('should return false when sum differs from 1.0', () => {
        const weights = { auto: 0.6, mrh: 0.3 }; // sum = 0.9
        expect(validateWeightsSum(weights)).toBe(false);
    });
});

// ============================================
// AGGREGATION TESTS
// ============================================

describe('aggregateIndices', () => {
    /**
     * QA Test: test_aggregation_multi_products
     * 2 products → indices globaux = moyenne pondérée
     */
    it('should calculate weighted average of indices', () => {
        const products = {
            auto: createProductWithIndices('auto', 70_000_000, { IAC: 80 }),
            mrh: createProductWithIndices('mrh', 30_000_000, { IAC: 50 }),
        };
        const weights = { auto: 0.7, mrh: 0.3 };

        const aggregated = aggregateIndices(products, weights);

        // IAC = 0.7 × 80 + 0.3 × 50 = 56 + 15 = 71
        expect(aggregated.IAC).toBeCloseTo(71, 0);
    });

    it('should aggregate all 7 indices', () => {
        const products = {
            auto: createProductWithIndices('auto', 50_000_000, {
                IAC: 70, IPQO: 65, IERH: 60, IRF: 75, IMD: 50, IS: 70, IPP: 55,
            }),
            mrh: createProductWithIndices('mrh', 50_000_000, {
                IAC: 60, IPQO: 55, IERH: 50, IRF: 65, IMD: 40, IS: 60, IPP: 45,
            }),
        };
        const weights = { auto: 0.5, mrh: 0.5 };

        const aggregated = aggregateIndices(products, weights);

        // Average = (auto + mrh) / 2
        expect(aggregated.IAC).toBeCloseTo(65, 0);
        expect(aggregated.IPQO).toBeCloseTo(60, 0);
        expect(aggregated.IERH).toBeCloseTo(55, 0);
    });

    it('should clamp results to [0, 100]', () => {
        const products = {
            auto: createProductWithIndices('auto', 50_000_000, { IAC: 110 }), // Out of bounds
            mrh: createProductWithIndices('mrh', 50_000_000, { IAC: 100 }),
        };
        const weights = { auto: 0.5, mrh: 0.5 };

        const aggregated = aggregateIndices(products, weights);

        expect(aggregated.IAC).toBeLessThanOrEqual(100);
    });
});

describe('calculateAggregatedState', () => {
    /**
     * QA Test: test_aggregation_single_product
     * 1 product → global = product (pas de calcul)
     */
    it('should return product directly for single product (no aggregation)', () => {
        const autoMetrics = createProductWithIndices('auto', 100_000_000, { IAC: 75 });
        const products = { auto: autoMetrics };

        const state = calculateAggregatedState(products);

        expect(state.global.indices.IAC).toBe(75);
        expect(state.weights.auto).toBe(1.0);
        expect(state.weights.mrh).toBe(0);
    });

    it('should aggregate multiple products', () => {
        const products = {
            auto: createProductWithIndices('auto', 70_000_000, { IAC: 80 }),
            mrh: createProductWithIndices('mrh', 30_000_000, { IAC: 50 }),
        };

        const state = calculateAggregatedState(products);

        expect(state.weights.auto).toBeCloseTo(0.7, 2);
        expect(state.weights.mrh).toBeCloseTo(0.3, 2);
        expect(state.global.indices.IAC).toBeCloseTo(71, 0);
    });

    it('should include P&L in aggregation', () => {
        const products = {
            auto: createProductMetrics('auto', { primes: 70_000_000, sinistres: 49_000_000 }),
            mrh: createProductMetrics('mrh', { primes: 30_000_000, sinistres: 21_000_000 }),
        };

        const state = calculateAggregatedState(products);

        expect(state.global.pnl.primes.brutes).toBe(100_000_000);
        expect(state.global.pnl.sinistres.bruts).toBe(70_000_000);
    });
});

// ============================================
// UTILITY TESTS
// ============================================

describe('getDominantProduct', () => {
    it('should return product with highest weight', () => {
        expect(getDominantProduct({ auto: 0.7, mrh: 0.3 })).toBe('auto');
        expect(getDominantProduct({ auto: 0.3, mrh: 0.7 })).toBe('mrh');
    });

    it('should return auto when weights are equal', () => {
        expect(getDominantProduct({ auto: 0.5, mrh: 0.5 })).toBe('auto');
    });
});

describe('isBalancedPortfolio', () => {
    it('should return true for equal weights', () => {
        expect(isBalancedPortfolio({ auto: 0.5, mrh: 0.5 })).toBe(true);
    });

    it('should return false for unbalanced portfolio', () => {
        expect(isBalancedPortfolio({ auto: 0.7, mrh: 0.3 })).toBe(false);
    });

    it('should respect tolerance parameter', () => {
        expect(isBalancedPortfolio({ auto: 0.52, mrh: 0.48 }, 0.05)).toBe(true);
        expect(isBalancedPortfolio({ auto: 0.52, mrh: 0.48 }, 0.01)).toBe(false);
    });
});

describe('createEmptyAggregatedState', () => {
    it('should create state with default indices', () => {
        const state = createEmptyAggregatedState();

        expect(state.products.auto).toBeDefined();
        expect(state.products.mrh).toBeDefined();
        expect(state.global.indices).toEqual(DEFAULT_INDICES);
    });
});

// ============================================
// PROPERTY TESTS
// ============================================

describe('Aggregation Properties', () => {
    /**
     * Property 1: Σ(weights) = 1.0
     */
    it('should satisfy Σ(weights) = 1.0', () => {
        const testCases = [
            { auto: 70_000_000, mrh: 30_000_000 },
            { auto: 50_000_000, mrh: 50_000_000 },
            { auto: 90_000_000, mrh: 10_000_000 },
            { auto: 100_000_000, mrh: 0 },
        ];

        for (const { auto, mrh } of testCases) {
            const products = {
                auto: createProductMetrics('auto', { primes: auto }),
                mrh: createProductMetrics('mrh', { primes: mrh }),
            };

            const weights = calculateWeights(products);
            const sum = weights.auto + weights.mrh;

            // Sum should be 1.0 or 0 (if all primes are 0)
            expect(sum).toBeCloseTo(mrh === 0 && auto === 0 ? 0 : 1.0, 5);
        }
    });

    /**
     * Property 2: Isolation - modifier tarif Auto ne change pas metrics MRH
     */
    it('should maintain isolation between products', () => {
        const mrhMetrics = createProductMetrics('mrh', { primes: 30_000_000 });
        const autoMetrics1 = createProductMetrics('auto', { primes: 70_000_000 });
        const autoMetrics2 = createProductMetrics('auto', { primes: 60_000_000 }); // Changed

        const state1 = calculateAggregatedState({ auto: autoMetrics1, mrh: mrhMetrics });
        const state2 = calculateAggregatedState({ auto: autoMetrics2, mrh: mrhMetrics });

        // MRH metrics should be identical in both states
        expect(state1.products.mrh).toEqual(state2.products.mrh);
    });

    /**
     * Property 3: Stability - calculateAggregatedState(products) 2× → même résultat
     */
    it('should be deterministic (same input → same output)', () => {
        const products = {
            auto: createProductWithIndices('auto', 70_000_000, { IAC: 80, IPP: 65 }),
            mrh: createProductWithIndices('mrh', 30_000_000, { IAC: 50, IPP: 55 }),
        };

        const state1 = calculateAggregatedState(products);
        const state2 = calculateAggregatedState(products);

        expect(state1.global.indices).toEqual(state2.global.indices);
        expect(state1.weights).toEqual(state2.weights);
    });

    /**
     * All aggregated indices should be in [0, 100]
     */
    it('should have all aggregated indices in [0, 100]', () => {
        const products = {
            auto: createProductMetrics('auto'),
            mrh: createProductMetrics('mrh'),
        };

        const state = calculateAggregatedState(products);

        for (const indexId of INDEX_IDS) {
            expect(state.global.indices[indexId]).toBeGreaterThanOrEqual(0);
            expect(state.global.indices[indexId]).toBeLessThanOrEqual(100);
        }
    });
});

// ============================================
// EDGE CASES
// ============================================

describe('Edge Cases', () => {
    it('should handle empty products', () => {
        const state = createEmptyAggregatedState();

        expect(state.global.pnl.primes.brutes).toBe(0);
        expect(state.global.pnl.resultat_total).toBe(0);
    });

    it('should handle product with all zeros', () => {
        const products = {
            auto: createProductMetrics('auto', {
                primes: 0,
                sinistres: 0,
                stock_sinistres: 0,
                nbContrats: 0,
            }),
        };

        const state = calculateAggregatedState(products);

        // Should not throw, weights should be 1.0 (only product, even with 0 primes)
        expect(state.weights.auto).toBe(1.0);
    });
});
