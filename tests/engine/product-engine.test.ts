/**
 * Product Engine Unit Tests
 *
 * @module tests/engine/product-engine.test
 * @description Unit tests for per-product calculations and decision application (US-023)
 *
 * References:
 * - docs/000_projet/specs_fonctionnelles_mvp.md (US-023 DoD/QA)
 *
 * Test Coverage:
 * - calculateProductMetrics: Complete metrics calculation
 * - applyDecisionToProduct: Decision application with AC1/AC2 compliance
 * - Decision isolation: Product-specific decisions don't affect other products
 */

import { describe, it, expect } from 'vitest';
import {
    calculateProductMetrics,
    calculateRatioSP,
    calculateFrequence,
    calculateCoutMoyen,
    isProductAffected,
    applyRateChange,
    applyDecisionToProduct,
    applyDecisionsToProduct,
    isSharedDomain,
    type ProductInputs,
    type ProductMetrics,
    type ProductDecision,
    type CompanyVariables,
    DEFAULT_INDICES,
    PRODUCT_IDS,
} from '@/lib/engine';

// ============================================
// TEST DATA HELPERS
// ============================================

/**
 * Create default company variables for testing
 */
function createDefaultCompanyVariables(): CompanyVariables {
    return {
        // IAC variables
        competitivite_prix: 70,
        qualite_service_sinistres: 65,
        etendue_garanties: 60,
        force_distribution: 70,
        notoriete: 55,
        satisfaction_nps: 65,
        // IPQO variables
        ratio_charge_capacite: 1.0,
        delai_gestion: 35,
        taux_erreur: 0.03,
        qualite_presta: 70,
        stabilite_si: 65,
        competence_rh: 60,
        // IERH variables
        effectif_vs_besoin: 1.0,
        competences: 65,
        turnover: 0.12,
        climat_social: 70,
        // IRF variables
        solvency_ratio: 1.5,
        reassurance_level: 60,
        provisions_marge: 0.05,
        placements_securite: 0.75,
        // IMD variables
        qualite_donnees: 60,
        gouvernance: 55,
        outillage: 50,
        use_cases_ia: 2,
        dette_technique: 30,
        // IS variables
        adequation_provisions: 0.05,
        court_termisme_score: 70,
        conformite: 80,
        is_precedent: 70,
        // P&L variables
        primes_brutes: 100_000_000,
        primes_cedees: 10_000_000,
        sinistres_bruts: 70_000_000,
        recup_reassurance: 7_000_000,
        frais_acquisition: 15_000_000,
        frais_gestion: 10_000_000,
        produits_financiers: 3_000_000,
        resultat_marche: 5_000_000,
    };
}

/**
 * Create product inputs for testing
 */
function createProductInputs(overrides: Partial<ProductInputs> = {}): ProductInputs {
    return {
        nbContrats: 100000,
        primes: 50_000_000,
        sinistres: 35_000_000,
        stock_sinistres: 5000,
        companyVariables: createDefaultCompanyVariables(),
        ...overrides,
    };
}

/**
 * Create product metrics for testing
 */
function createProductMetricsForTest(
    productId: 'auto' | 'mrh',
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
 * Create a product decision for testing
 */
function createDecision(overrides: Partial<ProductDecision> = {}): ProductDecision {
    return {
        id: 'dec-001',
        domain: 'tarif',
        targetProduct: 'auto',
        effectType: 'relative',
        targetIndex: 'primes',
        value: -0.05,
        turn: 1,
        delay: 0,
        ...overrides,
    };
}

// ============================================
// BASIC CALCULATION TESTS
// ============================================

describe('calculateRatioSP', () => {
    it('should calculate S/P ratio correctly', () => {
        expect(calculateRatioSP(70_000_000, 100_000_000)).toBeCloseTo(0.7, 2);
        expect(calculateRatioSP(50_000_000, 100_000_000)).toBeCloseTo(0.5, 2);
    });

    it('should return 0 when primes is 0', () => {
        expect(calculateRatioSP(50_000_000, 0)).toBe(0);
    });

    it('should handle edge case of both zeros', () => {
        expect(calculateRatioSP(0, 0)).toBe(0);
    });
});

describe('calculateFrequence', () => {
    it('should calculate frequency correctly', () => {
        expect(calculateFrequence(8000, 100000)).toBeCloseTo(0.08, 3);
    });

    it('should return 0 when contracts is 0', () => {
        expect(calculateFrequence(8000, 0)).toBe(0);
    });
});

describe('calculateCoutMoyen', () => {
    it('should calculate average cost correctly', () => {
        expect(calculateCoutMoyen(35_000_000, 14000)).toBeCloseTo(2500, 0);
    });

    it('should return 0 when claims count is 0', () => {
        expect(calculateCoutMoyen(35_000_000, 0)).toBe(0);
    });
});

// ============================================
// PRODUCT METRICS TESTS
// ============================================

describe('calculateProductMetrics', () => {
    it('should calculate all product metrics', () => {
        const inputs = createProductInputs({
            primes: 100_000_000,
            sinistres: 70_000_000,
            nbContrats: 150000,
            stock_sinistres: 8000,
        });

        const metrics = calculateProductMetrics('auto', inputs);

        expect(metrics.productId).toBe('auto');
        expect(metrics.primes).toBe(100_000_000);
        expect(metrics.sinistres).toBe(70_000_000);
        expect(metrics.ratio_sp).toBeCloseTo(0.7, 2);
        expect(metrics.nbContrats).toBe(150000);
    });

    it('should calculate indices for the product', () => {
        const inputs = createProductInputs();
        const metrics = calculateProductMetrics('mrh', inputs);

        // All 7 indices should exist
        expect(metrics.indices.IAC).toBeDefined();
        expect(metrics.indices.IPQO).toBeDefined();
        expect(metrics.indices.IERH).toBeDefined();
        expect(metrics.indices.IRF).toBeDefined();
        expect(metrics.indices.IMD).toBeDefined();
        expect(metrics.indices.IS).toBeDefined();
        expect(metrics.indices.IPP).toBeDefined();
    });

    it('should handle zero premiums correctly', () => {
        const inputs = createProductInputs({ primes: 0 });
        const metrics = calculateProductMetrics('auto', inputs);

        expect(metrics.primes).toBe(0);
        expect(metrics.ratio_sp).toBe(0); // Guard against division by zero
    });
});

// ============================================
// PRODUCT AFFECTED TESTS
// ============================================

describe('isProductAffected', () => {
    it('should return true for shared decisions (null target)', () => {
        expect(isProductAffected(null, 'auto')).toBe(true);
        expect(isProductAffected(null, 'mrh')).toBe(true);
    });

    it('should return true when target matches product', () => {
        expect(isProductAffected('auto', 'auto')).toBe(true);
        expect(isProductAffected('mrh', 'mrh')).toBe(true);
    });

    it('should return false when target does not match', () => {
        expect(isProductAffected('auto', 'mrh')).toBe(false);
        expect(isProductAffected('mrh', 'auto')).toBe(false);
    });
});

// ============================================
// RATE CHANGE TESTS
// ============================================

describe('applyRateChange', () => {
    it('should apply positive rate change', () => {
        expect(applyRateChange(100_000_000, 0.05)).toBe(105_000_000);
    });

    it('should apply negative rate change', () => {
        expect(applyRateChange(100_000_000, -0.05)).toBe(95_000_000);
    });

    it('should cap rate change at ±50%', () => {
        expect(applyRateChange(100_000_000, 0.7)).toBe(150_000_000); // Capped at +50%
        expect(applyRateChange(100_000_000, -0.7)).toBe(50_000_000); // Capped at -50%
    });
});

// ============================================
// SHARED DOMAIN TESTS
// ============================================

describe('isSharedDomain', () => {
    it('should return true for RH domain', () => {
        expect(isSharedDomain('rh')).toBe(true);
    });

    it('should return true for IT domain', () => {
        expect(isSharedDomain('it')).toBe(true);
    });

    it('should return false for product-specific domains', () => {
        expect(isSharedDomain('tarif')).toBe(false);
        expect(isSharedDomain('distribution')).toBe(false);
        expect(isSharedDomain('sinistres')).toBe(false);
        expect(isSharedDomain('reassurance')).toBe(false);
        expect(isSharedDomain('prevention')).toBe(false);
        expect(isSharedDomain('provisions')).toBe(false);
    });
});

// ============================================
// DECISION APPLICATION TESTS (AC1, AC2)
// ============================================

describe('applyDecisionToProduct', () => {
    describe('AC2: Product-specific decisions', () => {
        /**
         * QA Test: test_decision_isolation
         * Modifier tarif Auto → metrics MRH inchangées
         */
        it('should apply tariff decision only to targeted product', () => {
            const autoMetrics = createProductMetricsForTest('auto');
            const mrhMetrics = createProductMetricsForTest('mrh');

            const decision = createDecision({
                domain: 'tarif',
                targetProduct: 'auto',
                targetIndex: 'primes',
                value: -0.05, // -5%
            });

            const autoResult = applyDecisionToProduct(autoMetrics, decision, 1);
            const mrhResult = applyDecisionToProduct(mrhMetrics, decision, 1);

            // Auto should be affected
            expect(autoResult.applied).toBe(true);
            expect(autoResult.updatedMetrics?.primes).toBeCloseTo(66_500_000, 0); // 70M * 0.95

            // MRH should NOT be affected
            expect(mrhResult.applied).toBe(false);
            expect(mrhResult.reason).toBe('not_targeted');
        });

        it('should update S/P ratio when primes change', () => {
            const metrics = createProductMetricsForTest('auto', {
                primes: 100_000_000,
                sinistres: 70_000_000,
                ratio_sp: 0.7,
            });

            const decision = createDecision({
                targetProduct: 'auto',
                targetIndex: 'primes',
                value: 0.10, // +10%
            });

            const result = applyDecisionToProduct(metrics, decision, 1);

            expect(result.applied).toBe(true);
            expect(result.updatedMetrics?.primes).toBeCloseTo(110_000_000, 0);
            // New S/P ratio = 70M / 110M ≈ 0.636
            expect(result.updatedMetrics?.ratio_sp).toBeCloseTo(0.636, 2);
        });
    });

    describe('AC1: Shared decisions (RH/IT)', () => {
        /**
         * Shared decisions should affect all products
         */
        it('should apply RH decision to all products', () => {
            const autoMetrics = createProductMetricsForTest('auto');
            const mrhMetrics = createProductMetricsForTest('mrh');

            const decision = createDecision({
                domain: 'rh',
                targetProduct: null, // Shared
                targetIndex: 'IERH',
                effectType: 'absolute',
                value: 5,
            });

            const autoResult = applyDecisionToProduct(autoMetrics, decision, 1);
            const mrhResult = applyDecisionToProduct(mrhMetrics, decision, 1);

            // Both should be affected
            expect(autoResult.applied).toBe(true);
            expect(mrhResult.applied).toBe(true);

            // IERH should increase by 5 for both
            expect(autoResult.updatedMetrics?.indices.IERH).toBe(65); // 60 + 5
            expect(mrhResult.updatedMetrics?.indices.IERH).toBe(65);
        });

        it('should apply IT decision to all products', () => {
            const autoMetrics = createProductMetricsForTest('auto');
            const mrhMetrics = createProductMetricsForTest('mrh');

            const decision = createDecision({
                domain: 'it',
                targetProduct: null,
                targetIndex: 'IMD',
                effectType: 'absolute',
                value: 10,
            });

            const autoResult = applyDecisionToProduct(autoMetrics, decision, 1);
            const mrhResult = applyDecisionToProduct(mrhMetrics, decision, 1);

            expect(autoResult.applied).toBe(true);
            expect(mrhResult.applied).toBe(true);
            expect(autoResult.updatedMetrics?.indices.IMD).toBe(55); // 45 + 10
            expect(mrhResult.updatedMetrics?.indices.IMD).toBe(55);
        });
    });

    describe('Delayed decisions', () => {
        it('should not apply decision before delay expires', () => {
            const metrics = createProductMetricsForTest('auto');

            const decision = createDecision({
                turn: 1,
                delay: 2, // Effect at turn 3
            });

            const result = applyDecisionToProduct(metrics, decision, 2); // Current turn 2

            expect(result.applied).toBe(false);
            expect(result.reason).toBe('delayed');
        });

        it('should apply decision when delay has expired', () => {
            const metrics = createProductMetricsForTest('auto');

            const decision = createDecision({
                turn: 1,
                delay: 2, // Effect at turn 3
            });

            const result = applyDecisionToProduct(metrics, decision, 3); // Current turn 3

            expect(result.applied).toBe(true);
        });
    });

    describe('Index modifications', () => {
        it('should apply absolute effect to index', () => {
            const metrics = createProductMetricsForTest('auto');

            const decision = createDecision({
                targetProduct: 'auto',
                targetIndex: 'IAC',
                effectType: 'absolute',
                value: 10,
            });

            const result = applyDecisionToProduct(metrics, decision, 1);

            expect(result.updatedMetrics?.indices.IAC).toBe(70); // 60 + 10
        });

        it('should apply relative effect to index', () => {
            const metrics = createProductMetricsForTest('auto');

            const decision = createDecision({
                targetProduct: 'auto',
                targetIndex: 'IPQO',
                effectType: 'relative',
                value: 0.10, // +10%
            });

            const result = applyDecisionToProduct(metrics, decision, 1);

            expect(result.updatedMetrics?.indices.IPQO).toBe(66); // 60 * 1.10
        });

        it('should clamp index to [0, 100]', () => {
            const metrics = createProductMetricsForTest('auto', {
                indices: { ...DEFAULT_INDICES, IAC: 95 },
            });

            const decision = createDecision({
                targetProduct: 'auto',
                targetIndex: 'IAC',
                effectType: 'absolute',
                value: 20, // Would go to 115
            });

            const result = applyDecisionToProduct(metrics, decision, 1);

            expect(result.updatedMetrics?.indices.IAC).toBe(100); // Clamped
        });
    });
});

// ============================================
// MULTIPLE DECISIONS TESTS
// ============================================

describe('applyDecisionsToProduct', () => {
    it('should apply multiple decisions sequentially', () => {
        const metrics = createProductMetricsForTest('auto', {
            primes: 100_000_000,
        });

        const decisions: ProductDecision[] = [
            createDecision({
                id: 'dec-001',
                targetProduct: 'auto',
                targetIndex: 'primes',
                effectType: 'relative',
                value: 0.10, // +10%
            }),
            createDecision({
                id: 'dec-002',
                targetProduct: 'auto',
                targetIndex: 'primes',
                effectType: 'relative',
                value: -0.05, // -5%
            }),
        ];

        const result = applyDecisionsToProduct(metrics, decisions, 1);

        // 100M * 1.10 * 0.95 = 104.5M
        expect(result.primes).toBeCloseTo(104_500_000, 0);
    });

    it('should skip decisions that do not apply', () => {
        const mrhMetrics = createProductMetricsForTest('mrh', {
            primes: 30_000_000,
        });

        const decisions: ProductDecision[] = [
            createDecision({
                id: 'dec-001',
                targetProduct: 'auto', // Targets auto, not mrh
                targetIndex: 'primes',
                value: 0.10,
            }),
            createDecision({
                id: 'dec-002',
                domain: 'it', // Shared
                targetProduct: null,
                targetIndex: 'IMD',
                effectType: 'absolute',
                value: 5,
            }),
        ];

        const result = applyDecisionsToProduct(mrhMetrics, decisions, 1);

        // Primes unchanged (auto decision skipped)
        expect(result.primes).toBe(30_000_000);
        // IMD changed (IT decision applied)
        expect(result.indices.IMD).toBe(50); // 45 + 5
    });
});

// ============================================
// PROPERTY TESTS
// ============================================

describe('Product Engine Properties', () => {
    /**
     * Property: Isolation
     * Modifying one product's metrics should not affect another
     */
    it('should maintain product isolation', () => {
        const autoMetrics = createProductMetricsForTest('auto');
        const mrhMetricsBefore = createProductMetricsForTest('mrh');

        const decision = createDecision({
            targetProduct: 'auto',
            targetIndex: 'primes',
            value: -0.20,
        });

        // Apply to auto
        applyDecisionToProduct(autoMetrics, decision, 1);

        // MRH should remain unchanged
        const mrhMetricsAfter = createProductMetricsForTest('mrh');
        expect(mrhMetricsBefore).toEqual(mrhMetricsAfter);
    });

    /**
     * Property: Determinism
     * Same input should always produce same output
     */
    it('should be deterministic', () => {
        const metrics = createProductMetricsForTest('auto');
        const decision = createDecision();

        const result1 = applyDecisionToProduct(metrics, decision, 1);
        const result2 = applyDecisionToProduct(metrics, decision, 1);

        expect(result1.updatedMetrics).toEqual(result2.updatedMetrics);
    });

    /**
     * Property: Non-mutation
     * Original metrics should not be mutated
     */
    it('should not mutate original metrics', () => {
        const metrics = createProductMetricsForTest('auto');
        const originalPrimes = metrics.primes;

        const decision = createDecision({
            targetIndex: 'primes',
            value: 0.10,
        });

        applyDecisionToProduct(metrics, decision, 1);

        expect(metrics.primes).toBe(originalPrimes);
    });
});

// ============================================
// EDGE CASES
// ============================================

describe('Edge Cases', () => {
    it('should handle zero value decisions', () => {
        const metrics = createProductMetricsForTest('auto');

        const decision = createDecision({
            targetIndex: 'primes',
            value: 0,
        });

        const result = applyDecisionToProduct(metrics, decision, 1);

        expect(result.applied).toBe(true);
        expect(result.updatedMetrics?.primes).toBe(metrics.primes);
    });

    it('should handle all product IDs', () => {
        for (const productId of PRODUCT_IDS) {
            const metrics = createProductMetricsForTest(productId);
            const decision = createDecision({
                targetProduct: productId,
            });

            const result = applyDecisionToProduct(metrics, decision, 1);

            expect(result.applied).toBe(true);
        }
    });
});
