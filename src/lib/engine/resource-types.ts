/**
 * Resource Types - Shared Resources and Multi-Product Management
 *
 * @module lib/engine/resource-types
 * @description Type definitions for shared resources and multi-product aggregation (US-022)
 *
 * References:
 * - docs/000_projet/specs_fonctionnelles_mvp.md (US-022)
 * - docs/20_simulation/indices.md (IERH, IPQO)
 */

import type { IndicesState, PnLState } from './types';

// ============================================
// PRODUCT IDENTIFIER
// ============================================

/**
 * Product identifier for MVP (Auto and MRH)
 */
export type ProductId = 'auto' | 'mrh';

/**
 * All product IDs for iteration
 */
export const PRODUCT_IDS: readonly ProductId[] = ['auto', 'mrh'] as const;

// ============================================
// RESOURCE POOL
// ============================================

/**
 * Budget tracking for a single turn
 */
export interface BudgetTour {
    /** Total budget allocated for the turn (K€) */
    total: number;
    /** Budget consumed by decisions (K€) */
    consumed: number;
    /** Remaining budget (K€) */
    remaining: number;
}

/**
 * Effectifs distribution by department and product
 */
export interface EffectifsPool {
    /** Claims processing personnel */
    sinistres: {
        total: number;
        byProduct: Record<ProductId, number>;
    };
    /** Distribution/sales personnel */
    distribution: {
        total: number;
        byProduct: Record<ProductId, number>;
    };
    /** IT and Data personnel (shared across all products) */
    dataIT: number;
    /** Support personnel (shared across all products) */
    support: number;
}

/**
 * Pending effect from investment (IT/Data)
 */
export interface PendingInvestmentEffect {
    /** Investment amount (K€) */
    amount: number;
    /** Turn when investment was made */
    turnInvested: number;
    /** Turn when effect becomes active */
    turnActive: number;
    /** Target index affected */
    targetIndex: keyof IndicesState;
    /** Effect magnitude */
    effectValue: number;
}

/**
 * Investment tracking
 */
export interface InvestissementsPool {
    /** IT/Data investments */
    dataIT: {
        /** Total invested (K€) */
        total: number;
        /** Pending effects not yet active */
        pendingEffects: PendingInvestmentEffect[];
    };
}

/**
 * Capital and financial reserves
 */
export interface CapitalPool {
    /** Available capital (K€) */
    disponible: number;
    /** Reinsurance buffer (K€) */
    reassuranceBuffer: number;
}

/**
 * Complete resource pool for a game session
 * 
 * @example
 * const pool: ResourcePool = {
 *   budgetTour: { total: 1000, consumed: 0, remaining: 1000 },
 *   effectifs: { sinistres: { total: 100, byProduct: { auto: 60, mrh: 40 } }, ... },
 *   investissements: { dataIT: { total: 0, pendingEffects: [] } },
 *   capital: { disponible: 50000, reassuranceBuffer: 10000 }
 * };
 */
export interface ResourcePool {
    /** Turn budget tracking */
    budgetTour: BudgetTour;
    /** Personnel distribution */
    effectifs: EffectifsPool;
    /** Investment tracking */
    investissements: InvestissementsPool;
    /** Capital and reserves */
    capital: CapitalPool;
}

// ============================================
// PRODUCT METRICS
// ============================================

/**
 * Complete metrics for a single product
 * 
 * Includes both financial metrics and calculated indices.
 */
export interface ProductMetrics {
    /** Product identifier */
    productId: ProductId;
    /** Premiums collected (€) */
    primes: number;
    /** Claims paid (€) */
    sinistres: number;
    /** Pending claims stock (count) */
    stock_sinistres: number;
    /** Claims frequency (%) */
    frequence: number;
    /** Average claim cost (€) */
    cout_moyen: number;
    /** S/P ratio (sinistres/primes) */
    ratio_sp: number;
    /** Number of contracts */
    nbContrats: number;
    /** Calculated indices for this product */
    indices: IndicesState;
}

// ============================================
// AGGREGATED STATE
// ============================================

/**
 * Complete aggregated state for multi-product simulation
 * 
 * Contains per-product metrics, global aggregated indices,
 * and the weights used for aggregation.
 */
export interface AggregatedState {
    /** Metrics by product */
    products: Record<ProductId, ProductMetrics>;
    /** Global aggregated values */
    global: {
        /** Aggregated indices (weighted average) */
        indices: IndicesState;
        /** Global P&L */
        pnl: PnLState;
    };
    /** Weights used for aggregation (by premium share) */
    weights: Record<ProductId, number>;
}

// ============================================
// RESOURCE OPERATION RESULTS
// ============================================

/**
 * Result of a budget consumption operation
 */
export interface BudgetConsumeResult {
    /** Whether the operation succeeded */
    success: boolean;
    /** Updated pool (only if success) */
    pool?: ResourcePool;
    /** Error code if failed */
    error?: 'BUDGET_INSUFFICIENT' | 'INVALID_AMOUNT';
    /** Error message for display */
    message?: string;
    /** Remaining budget after operation */
    remaining: number;
}

/**
 * Effectif department type
 */
export type EffectifDepartment = 'sinistres' | 'distribution';

/**
 * Result of an effectif allocation operation
 */
export interface EffectifAllocateResult {
    /** Whether the operation succeeded */
    success: boolean;
    /** Updated pool (only if success) */
    pool?: ResourcePool;
    /** Error code if failed */
    error?: 'EFFECTIF_INSUFFICIENT' | 'INVALID_DEPARTMENT';
    /** Error message for display */
    message?: string;
}

// ============================================
// CONFIGURATION
// ============================================

/**
 * Initial resource configuration for session setup
 */
export interface ResourcePoolConfig {
    /** Initial turn budget (K€) */
    budgetTourInitial: number;
    /** Initial effectifs */
    effectifsInitial: {
        sinistres: number;
        distribution: number;
        dataIT: number;
        support: number;
    };
    /** Initial capital (K€) */
    capitalInitial: number;
    /** Initial reinsurance buffer (K€) */
    reassuranceBufferInitial: number;
}

/**
 * Default resource configuration
 */
export const DEFAULT_RESOURCE_CONFIG: ResourcePoolConfig = {
    budgetTourInitial: 1000, // 1M€
    effectifsInitial: {
        sinistres: 100,
        distribution: 80,
        dataIT: 30,
        support: 40,
    },
    capitalInitial: 50000, // 50M€
    reassuranceBufferInitial: 10000, // 10M€
} as const;
