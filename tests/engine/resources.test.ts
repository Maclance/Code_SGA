/**
 * Resources Management Unit Tests
 *
 * @module tests/engine/resources.test
 * @description Unit tests for shared resources management (US-022)
 *
 * References:
 * - docs/000_projet/specs_fonctionnelles_mvp.md (US-022 DoD/QA)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    initializeResourcePool,
    consumeBudget,
    getRemainingBudget,
    resetBudgetForTurn,
    allocateEffectifs,
    getProductEffectifs,
    getDepartmentTotal,
    addDataITInvestment,
    getActiveInvestmentEffects,
    type ResourcePool,
    type ResourcePoolConfig,
    DEFAULT_RESOURCE_CONFIG,
    PRODUCT_IDS,
} from '@/lib/engine';

// ============================================
// TEST DATA HELPERS
// ============================================

/**
 * Create a default resource pool for testing
 */
function createTestPool(config?: Partial<ResourcePoolConfig>): ResourcePool {
    return initializeResourcePool(config);
}

// ============================================
// INITIALIZATION TESTS
// ============================================

describe('initializeResourcePool', () => {
    it('should create pool with default config', () => {
        const pool = initializeResourcePool();

        expect(pool.budgetTour.total).toBe(DEFAULT_RESOURCE_CONFIG.budgetTourInitial);
        expect(pool.budgetTour.consumed).toBe(0);
        expect(pool.budgetTour.remaining).toBe(DEFAULT_RESOURCE_CONFIG.budgetTourInitial);
        expect(pool.effectifs.sinistres.total).toBe(DEFAULT_RESOURCE_CONFIG.effectifsInitial.sinistres);
        expect(pool.capital.disponible).toBe(DEFAULT_RESOURCE_CONFIG.capitalInitial);
    });

    it('should create pool with custom config', () => {
        const pool = initializeResourcePool({
            budgetTourInitial: 2000,
            capitalInitial: 100000,
        });

        expect(pool.budgetTour.total).toBe(2000);
        expect(pool.capital.disponible).toBe(100000);
    });

    it('should distribute effectifs evenly between products', () => {
        const pool = initializeResourcePool({
            effectifsInitial: { sinistres: 100, distribution: 80, dataIT: 30, support: 40 },
        });

        // 100 / 2 = 50 each
        expect(pool.effectifs.sinistres.byProduct.auto).toBe(50);
        expect(pool.effectifs.sinistres.byProduct.mrh).toBe(50);
    });
});

// ============================================
// BUDGET MANAGEMENT TESTS
// ============================================

describe('consumeBudget', () => {
    /**
     * QA Test: test_consumeBudget_success
     * 1000 available, consume 500 → remaining=500
     */
    it('should consume budget successfully when sufficient', () => {
        const pool = createTestPool({ budgetTourInitial: 1000 });

        const result = consumeBudget(pool, 500);

        expect(result.success).toBe(true);
        expect(result.remaining).toBe(500);
        expect(result.pool).toBeDefined();
        expect(result.pool!.budgetTour.consumed).toBe(500);
        expect(result.pool!.budgetTour.remaining).toBe(500);
    });

    /**
     * QA Test: test_consumeBudget_insufficient
     * 100 available, request 500 → success=false, error message
     */
    it('should fail when budget is insufficient', () => {
        const pool = createTestPool({ budgetTourInitial: 100 });

        const result = consumeBudget(pool, 500);

        expect(result.success).toBe(false);
        expect(result.error).toBe('BUDGET_INSUFFICIENT');
        expect(result.message).toContain('insuffisant');
        expect(result.remaining).toBe(100); // unchanged
        expect(result.pool).toBeUndefined();
    });

    it('should reject negative amounts', () => {
        const pool = createTestPool({ budgetTourInitial: 1000 });

        const result = consumeBudget(pool, -100);

        expect(result.success).toBe(false);
        expect(result.error).toBe('INVALID_AMOUNT');
    });

    it('should consume exact remaining budget', () => {
        const pool = createTestPool({ budgetTourInitial: 500 });

        const result = consumeBudget(pool, 500);

        expect(result.success).toBe(true);
        expect(result.remaining).toBe(0);
    });

    it('should allow multiple consumptions', () => {
        let pool = createTestPool({ budgetTourInitial: 1000 });

        const result1 = consumeBudget(pool, 300);
        expect(result1.success).toBe(true);
        pool = result1.pool!;

        const result2 = consumeBudget(pool, 400);
        expect(result2.success).toBe(true);
        pool = result2.pool!;

        expect(pool.budgetTour.consumed).toBe(700);
        expect(pool.budgetTour.remaining).toBe(300);
    });
});

describe('getRemainingBudget', () => {
    it('should return remaining budget', () => {
        const pool = createTestPool({ budgetTourInitial: 1000 });

        expect(getRemainingBudget(pool)).toBe(1000);

        const result = consumeBudget(pool, 300);
        expect(getRemainingBudget(result.pool!)).toBe(700);
    });
});

describe('resetBudgetForTurn', () => {
    it('should reset budget to previous total', () => {
        let pool = createTestPool({ budgetTourInitial: 1000 });
        const result = consumeBudget(pool, 600);
        pool = result.pool!;

        const resetPool = resetBudgetForTurn(pool);

        expect(resetPool.budgetTour.total).toBe(1000);
        expect(resetPool.budgetTour.consumed).toBe(0);
        expect(resetPool.budgetTour.remaining).toBe(1000);
    });

    it('should reset to new budget amount', () => {
        const pool = createTestPool({ budgetTourInitial: 1000 });

        const resetPool = resetBudgetForTurn(pool, 1500);

        expect(resetPool.budgetTour.total).toBe(1500);
        expect(resetPool.budgetTour.remaining).toBe(1500);
    });
});

// ============================================
// EFFECTIFS MANAGEMENT TESTS
// ============================================

describe('allocateEffectifs', () => {
    it('should allocate effectifs to a product', () => {
        const pool = createTestPool();
        const initial = pool.effectifs.sinistres.byProduct.auto;

        // Can reallocate as long as new value + other product <= total
        // Initial: auto=50, mrh=50, total=100
        // Allocating 40 to auto should succeed (40 + 50 = 90 <= 100)
        const result = allocateEffectifs(pool, 'sinistres', 'auto', 40);

        expect(result.success).toBe(true);
        expect(result.pool).toBeDefined();
        expect(result.pool!.effectifs.sinistres.byProduct.auto).toBe(40);
    });

    it('should fail for invalid department', () => {
        const pool = createTestPool();

        const result = allocateEffectifs(pool, 'invalid' as any, 'auto', 10);

        expect(result.success).toBe(false);
        expect(result.error).toBe('INVALID_DEPARTMENT');
    });

    it('should allocate to distribution department', () => {
        const pool = createTestPool();

        const result = allocateEffectifs(pool, 'distribution', 'mrh', 30);

        expect(result.success).toBe(true);
        expect(result.pool!.effectifs.distribution.byProduct.mrh).toBe(30);
    });
});

describe('getProductEffectifs', () => {
    it('should return allocated effectifs for product', () => {
        const pool = createTestPool();

        // Get initial effectifs (should be 50 based on even distribution)
        const effectifs = getProductEffectifs(pool, 'sinistres', 'auto');

        expect(effectifs).toBe(50);
    });
});

describe('getDepartmentTotal', () => {
    it('should return total for department', () => {
        const pool = createTestPool({
            effectifsInitial: { sinistres: 100, distribution: 80, dataIT: 30, support: 40 },
        });

        expect(getDepartmentTotal(pool, 'sinistres')).toBe(100);
        expect(getDepartmentTotal(pool, 'distribution')).toBe(80);
    });
});

// ============================================
// INVESTMENT TESTS
// ============================================

describe('addDataITInvestment', () => {
    it('should add investment with pending effect', () => {
        const pool = createTestPool();

        const updatedPool = addDataITInvestment(pool, 200, 1, 3);

        expect(updatedPool.investissements.dataIT.total).toBe(200);
        expect(updatedPool.investissements.dataIT.pendingEffects).toHaveLength(1);

        const effect = updatedPool.investissements.dataIT.pendingEffects[0];
        expect(effect.amount).toBe(200);
        expect(effect.turnInvested).toBe(1);
        expect(effect.turnActive).toBe(4); // 1 + 3
        expect(effect.targetIndex).toBe('IMD');
    });

    it('should accumulate multiple investments', () => {
        let pool = createTestPool();

        pool = addDataITInvestment(pool, 100, 1, 3);
        pool = addDataITInvestment(pool, 150, 2, 3);

        expect(pool.investissements.dataIT.total).toBe(250);
        expect(pool.investissements.dataIT.pendingEffects).toHaveLength(2);
    });
});

describe('getActiveInvestmentEffects', () => {
    it('should return only active effects', () => {
        let pool = createTestPool();

        pool = addDataITInvestment(pool, 100, 1, 2); // Active at turn 3
        pool = addDataITInvestment(pool, 150, 2, 3); // Active at turn 5

        const activeAtTurn3 = getActiveInvestmentEffects(pool, 3);
        expect(activeAtTurn3).toHaveLength(1);
        expect(activeAtTurn3[0].amount).toBe(100);

        const activeAtTurn5 = getActiveInvestmentEffects(pool, 5);
        expect(activeAtTurn5).toHaveLength(2);
    });

    it('should return empty array if no active effects', () => {
        let pool = createTestPool();
        pool = addDataITInvestment(pool, 100, 1, 5); // Active at turn 6

        const active = getActiveInvestmentEffects(pool, 3);
        expect(active).toHaveLength(0);
    });
});

// ============================================
// PROPERTY TESTS
// ============================================

describe('Resource Properties', () => {
    it('should never have negative remaining budget', () => {
        const pool = createTestPool({ budgetTourInitial: 100 });

        // Try to consume more than available
        const result = consumeBudget(pool, 150);

        expect(result.success).toBe(false);
        expect(pool.budgetTour.remaining).toBeGreaterThanOrEqual(0);
    });

    it('should maintain budget invariant: consumed + remaining = total', () => {
        let pool = createTestPool({ budgetTourInitial: 1000 });

        for (let i = 0; i < 5; i++) {
            const result = consumeBudget(pool, 100);
            if (result.success) {
                pool = result.pool!;
                expect(pool.budgetTour.consumed + pool.budgetTour.remaining)
                    .toBe(pool.budgetTour.total);
            }
        }
    });

    it('should be deterministic (same operations → same result)', () => {
        const operations = [
            { type: 'consume', amount: 200 },
            { type: 'consume', amount: 300 },
            { type: 'allocate', dept: 'sinistres', product: 'auto', count: 60 },
        ];

        const runOperations = () => {
            let pool = createTestPool({ budgetTourInitial: 1000 });
            for (const op of operations) {
                if (op.type === 'consume') {
                    const result = consumeBudget(pool, op.amount!);
                    if (result.success) pool = result.pool!;
                } else if (op.type === 'allocate') {
                    const result = allocateEffectifs(
                        pool,
                        op.dept as any,
                        op.product as any,
                        op.count!
                    );
                    if (result.success) pool = result.pool!;
                }
            }
            return pool;
        };

        const result1 = runOperations();
        const result2 = runOperations();

        expect(result1.budgetTour).toEqual(result2.budgetTour);
        expect(result1.effectifs).toEqual(result2.effectifs);
    });
});
