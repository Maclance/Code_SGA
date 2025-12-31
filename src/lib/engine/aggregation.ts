/**
 * Aggregation Module
 *
 * @module lib/engine/aggregation
 * @description Multi-product aggregation and weighted calculations (US-022)
 *
 * References:
 * - docs/000_projet/specs_fonctionnelles_mvp.md (US-022)
 * - docs/20_simulation/indices.md (aggregation formulas)
 *
 * Formula:
 * Indice_Global = Σ(Poids_Produit × Indice_Produit) / Σ(Poids_Produit)
 * Poids_Produit = Primes_Produit / Primes_Totales
 */

import {
    type ProductId,
    type ProductMetrics,
    type AggregatedState,
    PRODUCT_IDS,
} from './resource-types';
import {
    type IndicesState,
    type PnLState,
    INDEX_IDS,
    DEFAULT_INDICES,
} from './types';
import { clamp, safeDiv } from './utils';

// ============================================
// WEIGHT CALCULATION
// ============================================

/**
 * Calculate aggregation weights based on premium share
 *
 * Products with 0 primes get weight 0.
 * Invariant: Σ(weights) = 1.0 (or all zeros if no primes)
 *
 * @param products - Map of product metrics
 * @returns Weights by product (sum ≈ 1.0)
 *
 * @example
 * // Auto 70M€, MRH 30M€ → weights.auto = 0.7, weights.mrh = 0.3
 * const weights = calculateWeights({
 *   auto: { primes: 70_000_000, ... },
 *   mrh: { primes: 30_000_000, ... }
 * });
 */
export function calculateWeights(
    products: Partial<Record<ProductId, ProductMetrics>>
): Record<ProductId, number> {
    // Calculate total primes
    const totalPrimes = Object.values(products).reduce(
        (sum, p) => sum + (p?.primes ?? 0),
        0
    );

    // Calculate weights
    const weights: Record<ProductId, number> = {
        auto: 0,
        mrh: 0,
    };

    for (const productId of PRODUCT_IDS) {
        const product = products[productId];
        if (product && totalPrimes > 0) {
            weights[productId] = product.primes / totalPrimes;
        }
    }

    console.log(
        `[aggregation] Weights calculated: auto=${weights.auto.toFixed(2)}, mrh=${weights.mrh.toFixed(2)}`
    );

    return weights;
}

/**
 * Validate that weights sum to 1.0 (within epsilon)
 *
 * @param weights - Weights to validate
 * @param epsilon - Tolerance for floating point (default: 0.0001)
 * @returns true if valid
 */
export function validateWeightsSum(
    weights: Record<ProductId, number>,
    epsilon: number = 0.0001
): boolean {
    const sum = Object.values(weights).reduce((s, w) => s + w, 0);
    return Math.abs(sum - 1.0) < epsilon || sum === 0; // 0 is valid if no products
}

// ============================================
// INDEX AGGREGATION
// ============================================

/**
 * Aggregate indices using weighted average
 *
 * @param products - Map of product metrics
 * @param weights - Pre-calculated weights
 * @returns Aggregated indices
 *
 * @example
 * // IAC_Global = 0.7 × IAC_Auto + 0.3 × IAC_MRH
 */
export function aggregateIndices(
    products: Partial<Record<ProductId, ProductMetrics>>,
    weights: Record<ProductId, number>
): IndicesState {
    // Initialize aggregated indices to 0
    const aggregated: IndicesState = {
        IAC: 0,
        IPQO: 0,
        IERH: 0,
        IRF: 0,
        IMD: 0,
        IS: 0,
        IPP: 0,
    };

    // Sum weighted indices
    for (const productId of PRODUCT_IDS) {
        const product = products[productId];
        const weight = weights[productId];

        if (product && weight > 0) {
            for (const indexId of INDEX_IDS) {
                aggregated[indexId] += product.indices[indexId] * weight;
            }
        }
    }

    // Clamp all indices to [0, 100]
    for (const indexId of INDEX_IDS) {
        aggregated[indexId] = clamp(aggregated[indexId], 0, 100);
    }

    return aggregated;
}

// ============================================
// P&L AGGREGATION
// ============================================

/**
 * Aggregate P&L from multiple products
 *
 * Simple sum for most fields, ratios recalculated.
 *
 * @param products - Map of product metrics
 * @returns Aggregated P&L
 */
export function aggregatePnL(
    products: Partial<Record<ProductId, ProductMetrics>>
): PnLState {
    let totalPrimes = 0;
    let totalSinistres = 0;

    for (const product of Object.values(products)) {
        if (product) {
            totalPrimes += product.primes;
            totalSinistres += product.sinistres;
        }
    }

    // Estimate frais as 25% of primes (standard industry ratio)
    const totalFrais = totalPrimes * 0.25;
    const fraisAcquisition = totalFrais * 0.6; // 60% acquisition
    const fraisGestion = totalFrais * 0.4; // 40% gestion

    // Estimate financial products as 3% of primes
    const produits_financiers = totalPrimes * 0.03;

    // Calculate results
    const resultat_technique_brut = totalPrimes - totalSinistres - totalFrais;
    const resultat_technique_net = resultat_technique_brut; // Simplified (no reinsurance calc here)
    const resultat_total = resultat_technique_net + produits_financiers;

    // Calculate ratios
    const ratio_combine_brut = safeDiv(
        (totalSinistres + totalFrais) * 100,
        totalPrimes,
        100
    );
    const ratio_combine_net = ratio_combine_brut; // Simplified

    return {
        primes: {
            brutes: totalPrimes,
            nettes: totalPrimes * 0.9, // 10% cession
        },
        sinistres: {
            bruts: totalSinistres,
            nets: totalSinistres * 0.9, // 10% recovered
        },
        frais: {
            acquisition: fraisAcquisition,
            gestion: fraisGestion,
            total: totalFrais,
        },
        reassurance: {
            primesCedees: totalPrimes * 0.1,
            recuperations: totalSinistres * 0.1,
            solde: totalPrimes * 0.1 - totalSinistres * 0.1,
        },
        produits_financiers,
        resultat_technique_brut,
        resultat_technique_net,
        resultat_total,
        ratio_combine_brut,
        ratio_combine_net,
    };
}

// ============================================
// COMPLETE AGGREGATION
// ============================================

/**
 * Calculate complete aggregated state for multi-product simulation
 *
 * Handles single-product case (no aggregation needed).
 *
 * @param products - Map of product metrics
 * @returns Complete aggregated state
 *
 * @example
 * const state = calculateAggregatedState({
 *   auto: autoMetrics,
 *   mrh: mrhMetrics
 * });
 * // state.global.indices = weighted average
 * // state.weights = { auto: 0.7, mrh: 0.3 }
 */
export function calculateAggregatedState(
    products: Partial<Record<ProductId, ProductMetrics>>
): AggregatedState {
    const activeProducts = Object.entries(products).filter(
        ([, p]) => p !== undefined
    ) as [ProductId, ProductMetrics][];

    // Single product case: no aggregation needed
    if (activeProducts.length === 1) {
        const [productId, product] = activeProducts[0];
        console.log(
            `[aggregation] Single product (${productId}): skipping aggregation`
        );

        return {
            products: { [productId]: product } as Record<ProductId, ProductMetrics>,
            global: {
                indices: product.indices,
                pnl: aggregatePnL({ [productId]: product }),
            },
            weights: {
                auto: productId === 'auto' ? 1.0 : 0,
                mrh: productId === 'mrh' ? 1.0 : 0,
            },
        };
    }

    // Multi-product case: weighted aggregation
    const weights = calculateWeights(products);
    const aggregatedIndices = aggregateIndices(products, weights);
    const aggregatedPnL = aggregatePnL(products);

    console.log(
        `[aggregation] Multi-product aggregation complete: ${activeProducts.length} products`
    );

    return {
        products: products as Record<ProductId, ProductMetrics>,
        global: {
            indices: aggregatedIndices,
            pnl: aggregatedPnL,
        },
        weights,
    };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get the dominant product (highest weight)
 *
 * @param weights - Product weights
 * @returns Product ID with highest weight
 */
export function getDominantProduct(
    weights: Record<ProductId, number>
): ProductId {
    return weights.auto >= weights.mrh ? 'auto' : 'mrh';
}

/**
 * Check if products have equal weights (balanced portfolio)
 *
 * @param weights - Product weights
 * @param tolerance - Tolerance for equality (default: 0.05)
 * @returns true if roughly balanced
 */
export function isBalancedPortfolio(
    weights: Record<ProductId, number>,
    tolerance: number = 0.05
): boolean {
    const diff = Math.abs(weights.auto - weights.mrh);
    return diff < tolerance;
}

/**
 * Create empty aggregated state (for initialization)
 */
export function createEmptyAggregatedState(): AggregatedState {
    const emptyMetrics: ProductMetrics = {
        productId: 'auto',
        primes: 0,
        sinistres: 0,
        stock_sinistres: 0,
        frequence: 0,
        cout_moyen: 0,
        ratio_sp: 0,
        nbContrats: 0,
        indices: { ...DEFAULT_INDICES },
    };

    return {
        products: {
            auto: { ...emptyMetrics, productId: 'auto' },
            mrh: { ...emptyMetrics, productId: 'mrh' },
        },
        global: {
            indices: { ...DEFAULT_INDICES },
            pnl: {
                primes: { brutes: 0, nettes: 0 },
                sinistres: { bruts: 0, nets: 0 },
                frais: { acquisition: 0, gestion: 0, total: 0 },
                reassurance: { primesCedees: 0, recuperations: 0, solde: 0 },
                produits_financiers: 0,
                resultat_technique_brut: 0,
                resultat_technique_net: 0,
                resultat_total: 0,
                ratio_combine_brut: 0,
                ratio_combine_net: 0,
            },
        },
        weights: { auto: 0.5, mrh: 0.5 },
    };
}
