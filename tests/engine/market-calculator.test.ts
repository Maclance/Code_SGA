/**
 * Market Calculator Engine Tests
 *
 * @module tests/engine/market-calculator.test
 * @description Unit tests for market share and trend calculations (US-036)
 */

import { describe, it, expect } from 'vitest';
import {
    calculateMarketShares,
    simulateCompetitors,
    calculateGapVsMarket,
    calculatePriceTrends
} from '@/lib/engine/market/market-calculator';

describe('MarketCalculator', () => {
    // ============================================
    // MARKET SHARES
    // ============================================

    describe('calculateMarketShares', () => {
        it('should calculate market shares totaling exactly 100%', () => {
            const playerIAC = 70;
            const shares = calculateMarketShares(playerIAC);

            const total = shares.reduce((sum, s) => sum + s.share, 0);
            expect(total).toBeCloseTo(100, 1);
            expect(total).toBe(100); // Check exactness since we force it
        });

        it('should give higher share to player with high IAC', () => {
            const highIAC = calculateMarketShares(80);
            const lowIAC = calculateMarketShares(40);

            const playerShareHigh = highIAC.find(s => s.isPlayer)?.share || 0;
            const playerShareLow = lowIAC.find(s => s.isPlayer)?.share || 0;

            expect(playerShareHigh).toBeGreaterThan(playerShareLow);
        });

        it('should always include the player and competitors', () => {
            const shares = calculateMarketShares(50);
            const player = shares.find(s => s.isPlayer);
            const competitors = shares.filter(s => !s.isPlayer);

            expect(player).toBeDefined();
            expect(player?.name).toBe('Vous');
            expect(competitors.length).toBeGreaterThanOrEqual(3);
        });
    });

    // ============================================
    // COMPETITORS
    // ============================================

    describe('simulateCompetitors', () => {
        it('should generate sufficient competitors', () => {
            const competitors = simulateCompetitors();

            expect(competitors.length).toBeGreaterThanOrEqual(3);
            expect(competitors.length).toBeLessThanOrEqual(5);
        });

        it('should generate valid prices', () => {
            const competitors = simulateCompetitors();
            competitors.forEach(comp => {
                expect(comp.price).toBeGreaterThan(0);
                expect(comp.price).toBeLessThan(200); // Reasonable range
            });
        });
    });

    // ============================================
    // PRICE TRENDS & GAPS
    // ============================================

    describe('calculatePriceTrends', () => {
        it('should return trend points for history', () => {
            // Mock history empty for now as implementation simulates data
            const trends = calculatePriceTrends([], 10);

            expect(trends.length).toBe(4); // Default constant length
            expect(trends[0].turn).toBeDefined();
            expect(trends[0].playerPrice).toBeDefined();
            expect(trends[0].marketAvg).toBeDefined();
        });

        it('should have turns in ascending order', () => {
            const trends = calculatePriceTrends([], 10);
            expect(trends[0].turn).toBeLessThan(trends[1].turn);
            expect(trends[3].turn).toBe(10);
        });
    });

    describe('calculateGapVsMarket', () => {
        it('should calculate correct percentage gap', () => {
            // Player cheaper (100 vs 110)
            const gapCheaper = calculateGapVsMarket(100, 110);
            // (100-110)/110 = -0.0909 -> -9.1%
            expect(gapCheaper).toBe(-9.1);

            // Player more expensive (110 vs 100)
            const gapMoreExpensive = calculateGapVsMarket(110, 100);
            // (110-100)/100 = 0.1 -> +10.0%
            expect(gapMoreExpensive).toBe(10);
        });

        it('should return 0 when aligned', () => {
            expect(calculateGapVsMarket(100, 100)).toBe(0);
        });
    });
});
