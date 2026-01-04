/**
 * Market Calculator - Market Logic Engine
 *
 * @module lib/engine/market/market-calculator
 * @description Calculation logic for market shares and price trends (US-036)
 */

import {
    Competitor,
    MarketData,
    MarketShareEntry,
    PriceTrendPoint,
    COMPETITOR_NAMES,
    MARKET_CONSTANTS,
    ProductType
} from './market-types';

// ============================================
// HELPER TYPES (Internal)
// ============================================

// Minimal interface for TurnState to avoid circular deps or full type requirement
interface MinimalTurnState {
    turnNumber: number;
    indices: {
        IAC: number;
    };
    /* eslint-disable @typescript-eslint/no-explicit-any */
    products?: any; // We might need strict product types later
}

// ============================================
// MARKET SHARE CALCULATION
// ============================================

/**
 * Calculate market shares based on Player IAC
 * Ensures total shares sum strictly to 100%
 *
 * Logic:
 * - Player share is proportional to IAC (Attractiveness)
 * - Remaining share is distributed among 3-5 competitors
 *
 * @param playerIAC Current player IAC [0-100]
 * @returns Array of market share entries
 */
export function calculateMarketShares(playerIAC: number): MarketShareEntry[] {
    // 1. Calculate Player Share
    // Baseline: IAC 50 -> 15% share. IAC 100 -> 30% share.
    // Range: [5%, 35%] typically
    const rawPlayerShare = Math.max(5, Math.min(35, (playerIAC / 100) * 30));

    // Round to 1 decimal
    let playerShare = Math.round(rawPlayerShare * 10) / 10;

    // 2. Generate Competitors
    // We deterministically generate 4 competitors for stability
    const competitorsCount = 4;
    const remainingShare = 100 - playerShare;

    const shares: MarketShareEntry[] = [];

    // Add Player first
    shares.push({
        name: 'Vous',
        share: playerShare,
        isPlayer: true,
        color: '#2563eb' // Blue-600 (primary)
    });

    // Distribute remaining share
    // We add some variance based on IAC to simulate market reaction
    // but ensure sum is perfectly handled
    let currentSum = playerShare;

    // Competitor logic:
    // Comp A: The "Big One" (35-45% of remainder)
    // Comp B: The "Challenger" (25-30% of remainder)
    // Comp C: The "Follower" (15-20% of remainder)
    // Comp D: The "Niche" (residual)

    const distributions = [0.40, 0.25, 0.20, 0.15];
    const compColors = ['#ef4444', '#f59e0b', '#10b981', '#8b5cf6']; // Red, Amber, Green, Purple

    for (let i = 0; i < competitorsCount; i++) {
        const isLast = i === competitorsCount - 1;
        let share = 0;

        if (isLast) {
            // Last one takes the exact residual to ensure 100.0%
            share = Math.round((100 - currentSum) * 10) / 10;
        } else {
            share = Math.round((remainingShare * distributions[i]) * 10) / 10;
        }

        shares.push({
            name: COMPETITOR_NAMES[i],
            share: share,
            isPlayer: false,
            color: compColors[i]
        });

        currentSum += share;
    }

    // Final sanity check on rounding errors (rare but possible with floats)
    // Force exact 100 on the last competitor if needed
    const total = shares.reduce((sum, s) => sum + s.share, 0);
    if (Math.abs(total - 100) > 0.01) {
        const diff = 100 - total;
        shares[shares.length - 1].share += diff;
        shares[shares.length - 1].share = Math.round(shares[shares.length - 1].share * 10) / 10;
    }

    return shares;
}

// ============================================
// COMPETITOR SIMULATION
// ============================================

/**
 * Simulate competitors data for internal logic
 * @returns Array of Competitor objects with simulated prices
 */
export function simulateCompetitors(): Competitor[] {
    const competitors: Competitor[] = [];

    // Simulate 4 competitors matching the shares logic implicitly
    for (let i = 0; i < 4; i++) {
        // Random price variation around 100 base
        // To make it deterministic in tests, we could seed, but for MVP random is fine
        // provided it stays coherent (90-110 range)
        const price = 90 + Math.floor(Math.random() * 20);

        competitors.push({
            id: `comp_${i}`,
            name: COMPETITOR_NAMES[i],
            isPlayer: false,
            marketShare: 0, // Calculated dynamically in calculateMarketShares
            price: price
        });
    }

    return competitors;
}

// ============================================
// PRICE TRENDS
// ============================================

/**
 * Calculate price trends over the last 4 turns
 */
export function calculatePriceTrends(
    history: MinimalTurnState[],
    currentTurn: number
): PriceTrendPoint[] {
    const trends: PriceTrendPoint[] = [];
    const historyLength = MARKET_CONSTANTS.TREND_HISTORY_LENGTH;

    // We look at previous turns up to current
    // If we don't have enough history, we simulate backward trends
    // In a real scenario we'd read from history, here we simulate for the MVP View

    for (let i = historyLength - 1; i >= 0; i--) {
        const t = currentTurn - i;
        if (t <= 0) continue; // Don't show negative turns

        // Logic to retrieve actual player price from history would go here
        // For MVP View scope, we simulate stable market inflation vs player strategy
        // We assume player price is ~100 normalized

        const offset = i * 2; // Simple trend simulation

        trends.push({
            turn: t,
            playerPrice: 100, // Placeholder: should come from Product state
            marketAvg: 98 + offset // Simulated market inflation
        });
    }

    // If not enough data, pad with mock data for MVP visual completeness
    if (trends.length < historyLength) {
        const missing = historyLength - trends.length;
        for (let j = 0; j < missing; j++) {
            trends.unshift({
                turn: currentTurn - trends.length - 1,
                playerPrice: 100,
                marketAvg: 100
            });
        }
    }

    return trends;
}

/**
 * Calculate the relative price gap
 * @returns Percentage gap (negative = cheaper than market)
 */
export function calculateGapVsMarket(playerPrice: number, marketAvg: number): number {
    if (marketAvg === 0) return 0;
    return Math.round(((playerPrice - marketAvg) / marketAvg) * 1000) / 10;
}
