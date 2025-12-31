/**
 * Resources Management Module
 *
 * @module lib/engine/resources
 * @description Functions for managing shared resources across products (US-022)
 *
 * References:
 * - docs/000_projet/specs_fonctionnelles_mvp.md (US-022)
 */

import {
    type ResourcePool,
    type ResourcePoolConfig,
    type BudgetConsumeResult,
    type EffectifAllocateResult,
    type EffectifDepartment,
    type ProductId,
    DEFAULT_RESOURCE_CONFIG,
    PRODUCT_IDS,
} from './resource-types';

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize a resource pool from configuration
 *
 * @param config - Resource configuration (optional, uses defaults)
 * @returns Initialized resource pool
 *
 * @example
 * const pool = initializeResourcePool();
 * // pool.budgetTour.total = 1000
 * // pool.effectifs.sinistres.total = 100
 */
export function initializeResourcePool(
    config: Partial<ResourcePoolConfig> = {}
): ResourcePool {
    const mergedConfig = { ...DEFAULT_RESOURCE_CONFIG, ...config };

    // Distribute effectifs evenly between products by default
    const distributeEvenly = (total: number): Record<ProductId, number> => {
        const perProduct = Math.floor(total / PRODUCT_IDS.length);
        const remainder = total % PRODUCT_IDS.length;
        return {
            auto: perProduct + (remainder > 0 ? 1 : 0),
            mrh: perProduct,
        };
    };

    return {
        budgetTour: {
            total: mergedConfig.budgetTourInitial,
            consumed: 0,
            remaining: mergedConfig.budgetTourInitial,
        },
        effectifs: {
            sinistres: {
                total: mergedConfig.effectifsInitial.sinistres,
                byProduct: distributeEvenly(mergedConfig.effectifsInitial.sinistres),
            },
            distribution: {
                total: mergedConfig.effectifsInitial.distribution,
                byProduct: distributeEvenly(mergedConfig.effectifsInitial.distribution),
            },
            dataIT: mergedConfig.effectifsInitial.dataIT,
            support: mergedConfig.effectifsInitial.support,
        },
        investissements: {
            dataIT: {
                total: 0,
                pendingEffects: [],
            },
        },
        capital: {
            disponible: mergedConfig.capitalInitial,
            reassuranceBuffer: mergedConfig.reassuranceBufferInitial,
        },
    };
}

// ============================================
// BUDGET MANAGEMENT
// ============================================

/**
 * Consume budget from the resource pool
 *
 * Guards against negative budget (AC1).
 *
 * @param pool - Current resource pool
 * @param amount - Amount to consume (K€)
 * @returns Result with success status and updated pool
 *
 * @example
 * const result = consumeBudget(pool, 500);
 * if (result.success) {
 *   pool = result.pool!;
 *   console.log(`Remaining: ${result.remaining}`);
 * } else {
 *   console.error(result.message);
 * }
 */
export function consumeBudget(
    pool: ResourcePool,
    amount: number
): BudgetConsumeResult {
    // Validate amount
    if (amount < 0) {
        return {
            success: false,
            error: 'INVALID_AMOUNT',
            message: `Invalid amount: ${amount}. Amount must be positive.`,
            remaining: pool.budgetTour.remaining,
        };
    }

    // Guard: check sufficient budget
    if (pool.budgetTour.remaining < amount) {
        console.warn(
            `[resources] Budget insuffisant: demandé ${amount}K€, disponible ${pool.budgetTour.remaining}K€`
        );
        return {
            success: false,
            error: 'BUDGET_INSUFFICIENT',
            message: `Budget insuffisant: ${amount}K€ demandé, ${pool.budgetTour.remaining}K€ disponible`,
            remaining: pool.budgetTour.remaining,
        };
    }

    // Create updated pool (immutable update)
    const updatedPool: ResourcePool = {
        ...pool,
        budgetTour: {
            ...pool.budgetTour,
            consumed: pool.budgetTour.consumed + amount,
            remaining: pool.budgetTour.remaining - amount,
        },
    };

    console.log(
        `[resources] Budget consommé: ${amount}K€, reste ${updatedPool.budgetTour.remaining}K€`
    );

    return {
        success: true,
        pool: updatedPool,
        remaining: updatedPool.budgetTour.remaining,
    };
}

/**
 * Get remaining budget from pool
 *
 * @param pool - Resource pool
 * @returns Remaining budget (K€)
 */
export function getRemainingBudget(pool: ResourcePool): number {
    return pool.budgetTour.remaining;
}

/**
 * Reset budget for a new turn
 *
 * @param pool - Current resource pool
 * @param newBudget - New budget for the turn (optional, uses previous total)
 * @returns Updated pool with reset budget
 */
export function resetBudgetForTurn(
    pool: ResourcePool,
    newBudget?: number
): ResourcePool {
    const budget = newBudget ?? pool.budgetTour.total;
    return {
        ...pool,
        budgetTour: {
            total: budget,
            consumed: 0,
            remaining: budget,
        },
    };
}

// ============================================
// EFFECTIFS MANAGEMENT
// ============================================

/**
 * Allocate effectifs to a product
 *
 * @param pool - Current resource pool
 * @param department - Department to allocate from (sinistres/distribution)
 * @param productId - Target product
 * @param count - Number of ETP to allocate
 * @returns Result with success status and updated pool
 *
 * @example
 * const result = allocateEffectifs(pool, 'sinistres', 'auto', 10);
 * if (result.success) {
 *   pool = result.pool!;
 * }
 */
export function allocateEffectifs(
    pool: ResourcePool,
    department: EffectifDepartment,
    productId: ProductId,
    count: number
): EffectifAllocateResult {
    // Validate department
    if (!['sinistres', 'distribution'].includes(department)) {
        return {
            success: false,
            error: 'INVALID_DEPARTMENT',
            message: `Invalid department: ${department}`,
        };
    }

    const deptPool = pool.effectifs[department];

    // Check if there's enough unallocated effectifs
    const currentAllocated = Object.values(deptPool.byProduct).reduce(
        (sum, val) => sum + val,
        0
    );
    const available = deptPool.total - currentAllocated;

    if (count > available + deptPool.byProduct[productId]) {
        console.warn(
            `[resources] Effectifs insuffisants ${department}: demandé ${count}, disponible ${available}`
        );
        return {
            success: false,
            error: 'EFFECTIF_INSUFFICIENT',
            message: `Effectifs insuffisants: ${count} demandé pour ${department}, ${available} disponible`,
        };
    }

    // Calculate new allocation (this sets the absolute value, not adds)
    const newByProduct = {
        ...deptPool.byProduct,
        [productId]: count,
    };

    // Create updated pool
    const updatedPool: ResourcePool = {
        ...pool,
        effectifs: {
            ...pool.effectifs,
            [department]: {
                ...deptPool,
                byProduct: newByProduct,
            },
        },
    };

    console.log(
        `[resources] Effectifs ${department} alloués: ${productId}=${count} ETP`
    );

    return {
        success: true,
        pool: updatedPool,
    };
}

/**
 * Get effectifs allocated to a product for a department
 *
 * @param pool - Resource pool
 * @param department - Department
 * @param productId - Product
 * @returns Number of ETP allocated
 */
export function getProductEffectifs(
    pool: ResourcePool,
    department: EffectifDepartment,
    productId: ProductId
): number {
    return pool.effectifs[department].byProduct[productId];
}

/**
 * Get total effectifs for a department
 *
 * @param pool - Resource pool
 * @param department - Department
 * @returns Total ETP in department
 */
export function getDepartmentTotal(
    pool: ResourcePool,
    department: EffectifDepartment
): number {
    return pool.effectifs[department].total;
}

// ============================================
// INVESTMENT MANAGEMENT
// ============================================

/**
 * Add an IT/Data investment
 *
 * @param pool - Current resource pool
 * @param amount - Investment amount (K€)
 * @param currentTurn - Current turn number
 * @param delayTurns - Delay before effect activates (default: 3)
 * @param targetIndex - Target index to affect (default: IMD)
 * @param effectValue - Effect magnitude (default: calculated from amount)
 * @returns Updated pool
 */
export function addDataITInvestment(
    pool: ResourcePool,
    amount: number,
    currentTurn: number,
    delayTurns: number = 3,
    targetIndex: keyof import('./types').IndicesState = 'IMD',
    effectValue?: number
): ResourcePool {
    const calculatedEffect = effectValue ?? amount * 0.01; // 1 point per 100K€

    const pendingEffect = {
        amount,
        turnInvested: currentTurn,
        turnActive: currentTurn + delayTurns,
        targetIndex,
        effectValue: calculatedEffect,
    };

    return {
        ...pool,
        investissements: {
            ...pool.investissements,
            dataIT: {
                total: pool.investissements.dataIT.total + amount,
                pendingEffects: [
                    ...pool.investissements.dataIT.pendingEffects,
                    pendingEffect,
                ],
            },
        },
    };
}

/**
 * Get active investment effects for current turn
 *
 * @param pool - Resource pool
 * @param currentTurn - Current turn number
 * @returns Array of active effects
 */
export function getActiveInvestmentEffects(
    pool: ResourcePool,
    currentTurn: number
): import('./resource-types').PendingInvestmentEffect[] {
    return pool.investissements.dataIT.pendingEffects.filter(
        (effect) => effect.turnActive <= currentTurn
    );
}
