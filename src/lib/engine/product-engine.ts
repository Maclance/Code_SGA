/**
 * Product Engine Module
 *
 * @module lib/engine/product-engine
 * @description Per-product calculations and metrics (US-022)
 *
 * References:
 * - docs/000_projet/specs_fonctionnelles_mvp.md (US-022)
 * - docs/20_simulation/indices.md (formulas)
 */

import { type ProductId, type ProductMetrics } from './resource-types';
import { type IndicesState, type CompanyVariables } from './types';
import { calculateAllIndices } from './indices';
import { clamp, safeDiv } from './utils';

// ============================================
// PRODUCT INPUT TYPES
// ============================================

/**
 * Input data for product metrics calculation
 */
export interface ProductInputs {
    /** Number of contracts */
    nbContrats: number;
    /** Premiums collected (€) */
    primes: number;
    /** Claims paid (€) */
    sinistres: number;
    /** Pending claims stock (count) */
    stock_sinistres: number;
    /** Company variables for indices calculation */
    companyVariables: CompanyVariables;
}

// ============================================
// METRICS CALCULATIONS
// ============================================

/**
 * Calculate S/P ratio (sinistres / primes)
 *
 * @param sinistres - Claims paid (€)
 * @param primes - Premiums collected (€)
 * @returns S/P ratio (0 if primes = 0)
 */
export function calculateRatioSP(sinistres: number, primes: number): number {
    return safeDiv(sinistres, primes, 0);
}

/**
 * Calculate claims frequency
 *
 * @param claimsCount - Number of claims
 * @param contractsCount - Number of contracts
 * @returns Frequency as percentage (0-1)
 */
export function calculateFrequence(
    claimsCount: number,
    contractsCount: number
): number {
    return safeDiv(claimsCount, contractsCount, 0);
}

/**
 * Calculate average claim cost
 *
 * @param totalClaims - Total claims amount (€)
 * @param claimsCount - Number of claims
 * @returns Average cost (€)
 */
export function calculateCoutMoyen(
    totalClaims: number,
    claimsCount: number
): number {
    return safeDiv(totalClaims, claimsCount, 0);
}

// ============================================
// PRODUCT METRICS CALCULATION
// ============================================

/**
 * Calculate complete metrics for a single product
 *
 * Product-specific decisions only affect this product's metrics (AC4).
 *
 * @param productId - Product identifier
 * @param inputs - Product input data
 * @returns Complete product metrics
 *
 * @example
 * const metrics = calculateProductMetrics('auto', {
 *   nbContrats: 100000,
 *   primes: 50_000_000,
 *   sinistres: 35_000_000,
 *   stock_sinistres: 5000,
 *   companyVariables: defaultVars
 * });
 */
export function calculateProductMetrics(
    productId: ProductId,
    inputs: ProductInputs
): ProductMetrics {
    const { nbContrats, primes, sinistres, stock_sinistres, companyVariables } =
        inputs;

    // Calculate derived metrics
    const ratio_sp = calculateRatioSP(sinistres, primes);

    // Estimate frequency and cout_moyen from stock
    // Frequency = claims per contract (estimate from stock turnover)
    const estimatedClaimsCount = stock_sinistres * 4; // Assume 4 turns per year
    const frequence = calculateFrequence(estimatedClaimsCount, nbContrats);

    // Average cost = total / count
    const cout_moyen = calculateCoutMoyen(sinistres, estimatedClaimsCount);

    // Calculate indices for this product
    const indices = calculateAllIndices(companyVariables);

    return {
        productId,
        primes,
        sinistres,
        stock_sinistres,
        frequence,
        cout_moyen,
        ratio_sp,
        nbContrats,
        indices,
    };
}

// ============================================
// PRODUCT COMPARISON
// ============================================

/**
 * Check if a decision affects a specific product
 *
 * @param decisionProductId - Product targeted by decision (null = shared)
 * @param targetProductId - Product to check
 * @returns true if the product is affected
 */
export function isProductAffected(
    decisionProductId: ProductId | null,
    targetProductId: ProductId
): boolean {
    // Shared decisions affect all products
    if (decisionProductId === null) {
        return true;
    }
    // Product-specific decisions only affect that product
    return decisionProductId === targetProductId;
}

/**
 * Apply a rate change to product premiums
 *
 * Product-specific decisions ensure isolation (AC4).
 *
 * @param currentPrimes - Current premiums
 * @param rateChange - Rate change as decimal (e.g., -0.05 for -5%)
 * @returns Updated premiums
 */
export function applyRateChange(
    currentPrimes: number,
    rateChange: number
): number {
    const multiplier = 1 + clamp(rateChange, -0.5, 0.5); // Cap at ±50%
    return currentPrimes * multiplier;
}

// ============================================
// DEFAULT PRODUCT CONFIGURATION
// ============================================

/**
 * Default initial values for Auto product
 */
export const DEFAULT_AUTO_INPUTS: ProductInputs = {
    nbContrats: 150000,
    primes: 70_000_000, // 70M€
    sinistres: 49_000_000, // 49M€ (70% S/P)
    stock_sinistres: 8000,
    companyVariables: {} as CompanyVariables, // To be provided
};

/**
 * Default initial values for MRH product
 */
export const DEFAULT_MRH_INPUTS: ProductInputs = {
    nbContrats: 100000,
    primes: 30_000_000, // 30M€
    sinistres: 21_000_000, // 21M€ (70% S/P)
    stock_sinistres: 4000,
    companyVariables: {} as CompanyVariables, // To be provided
};
