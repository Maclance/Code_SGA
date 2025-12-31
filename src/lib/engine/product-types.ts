/**
 * Product Types - Multi-Product Type Definitions
 *
 * @module lib/engine/product-types
 * @description Type definitions for multi-product calculations and aggregation (US-023)
 *
 * Re-exports product-related types from resource-types.ts for cleaner imports
 * and to satisfy the DoD requirement for a dedicated product-types module.
 *
 * References:
 * - docs/000_projet/specs_fonctionnelles_mvp.md (US-023)
 * - docs/20_simulation/indices.md (aggregation formulas)
 */

// ============================================
// RE-EXPORTS FROM RESOURCE-TYPES
// ============================================

export type {
    /** Product identifier for MVP (Auto and MRH) */
    ProductId,
    /** Complete metrics for a single product */
    ProductMetrics,
    /** Complete aggregated state for multi-product simulation */
    AggregatedState,
} from './resource-types';

export {
    /** All product IDs for iteration */
    PRODUCT_IDS,
} from './resource-types';

// ============================================
// DECISION TYPES FOR PRODUCT ENGINE
// ============================================

import type { ProductId } from './resource-types';
import type { IndexId } from './types';

/**
 * Decision domain types
 * 
 * - Shared domains (RH, IT) affect all products (AC1)
 * - Product-specific domains only affect targeted product (AC2)
 */
export type DecisionDomain =
    | 'tarif'           // Product-specific: pricing
    | 'distribution'    // Product-specific: sales channels
    | 'sinistres'       // Product-specific: claims management
    | 'rh'              // Shared: human resources
    | 'it'              // Shared: IT/data investments
    | 'reassurance'     // Product-specific: reinsurance
    | 'prevention'      // Product-specific: risk prevention
    | 'provisions';     // Product-specific: reserves

/**
 * Shared decision domains that affect all products
 */
export const SHARED_DOMAINS: readonly DecisionDomain[] = ['rh', 'it'] as const;

/**
 * Check if a domain is shared across all products
 * 
 * @param domain - Decision domain to check
 * @returns true if the domain affects all products
 */
export function isSharedDomain(domain: DecisionDomain): boolean {
    return SHARED_DOMAINS.includes(domain);
}

/**
 * Product decision structure
 * 
 * Encapsulates a decision that can be applied to one or all products.
 */
export interface ProductDecision {
    /** Unique decision identifier */
    id: string;
    /** Decision domain (determines if shared or product-specific) */
    domain: DecisionDomain;
    /** Target product (null = shared decision affecting all products) */
    targetProduct: ProductId | null;
    /** Effect type */
    effectType: 'absolute' | 'relative';
    /** Target index to modify */
    targetIndex: IndexId | 'primes' | 'sinistres';
    /** Effect value (absolute or percentage) */
    value: number;
    /** Turn when decision was made */
    turn: number;
    /** Delay in turns before effect activates (0 = immediate) */
    delay: number;
}

/**
 * Result of applying a decision to a product
 */
export interface DecisionApplicationResult {
    /** Whether the decision was applied */
    applied: boolean;
    /** Updated metrics (only if applied) */
    updatedMetrics?: import('./resource-types').ProductMetrics;
    /** Reason if not applied */
    reason?: 'not_targeted' | 'delayed' | 'invalid_domain';
}
