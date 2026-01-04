/**
 * Market Types - Market View System
 *
 * @module lib/engine/market/market-types
 * @description Type definitions for market view (US-036)
 */

// ============================================
// MARKET ENTITIES
// ============================================

/**
 * Product type identifier
 */
export type ProductType = 'AUTO' | 'MRH';

/**
 * Valid product types array for iteration
 */
export const PRODUCT_TYPES: readonly ProductType[] = ['AUTO', 'MRH'] as const;

/**
 * Competitor basic information
 */
export interface Competitor {
    /** Unique identifier */
    id: string;
    /** Display name */
    name: string;
    /** Is this the player? */
    isPlayer: boolean;
    /** Current market share percentage [0-100] */
    marketShare: number;
    /** Current average price */
    price: number;
}

// ============================================
// MARKET DATA STRUCTURES
// ============================================

/**
 * Market share entry for visualization
 */
export interface MarketShareEntry {
    /** Name of the entity (Player or Competitor X) */
    name: string;
    /** Share percentage [0-100] */
    share: number;
    /** Is this the player? */
    isPlayer: boolean;
    /** Display color (hex) */
    color: string;
}

/**
 * Price trend data point for a specific turn
 */
export interface PriceTrendPoint {
    /** Turn number */
    turn: number;
    /** Player's price for this turn */
    playerPrice: number;
    /** Market average price for this turn */
    marketAvg: number;
}

/**
 * Full market data structure for the view
 */
export interface MarketData {
    /** Market shares distribution */
    shares: MarketShareEntry[];
    /** Price trends over time */
    trends: PriceTrendPoint[];
    /** Relative price gap vs market (e.g., -5 for 5% cheaper) */
    priceGap: number;
}

// ============================================
// CONSTANTS
// ============================================

/**
 * Competitor names for simulation
 */
export const COMPETITOR_NAMES = [
    'AssurTaux',
    'GlobalRisk',
    'SecurVite',
    'NeoSure',
    'TrustMutuelle',
] as const;

/**
 * Default market constants
 */
export const MARKET_CONSTANTS = {
    /** Minimum market share for any actor to exist */
    MIN_SHARE: 2.0,
    /** Base price reference (index 100) */
    BASE_PRICE_INDEX: 100,
    /** Number of turns for trend history */
    TREND_HISTORY_LENGTH: 4,
} as const;
