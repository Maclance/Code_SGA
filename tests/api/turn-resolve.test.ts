/**
 * Turn Resolve API Integration Tests
 * 
 * @module tests/api/turn-resolve.test
 * @description Integration tests for turn resolution API (US-014)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prepareFeedback, type TurnFeedback } from '@/lib/services/turn.service';
import type { IndicesSnapshot, PnLSnapshot } from '@/types/game-state';

// ============================================
// prepareFeedback UNIT TESTS
// (These don't require Supabase mock)
// ============================================

describe('prepareFeedback', () => {
    const baseIndices: IndicesSnapshot = {
        IAC: 60,
        IPQO: 60,
        IERH: 60,
        IRF: 60,
        IMD: 45,
        IS: 70,
        IPP: 55,
    };

    const basePnL: PnLSnapshot = {
        primes: 50_000_000,
        sinistres: 32_500_000,
        frais: 12_500_000,
        produits_financiers: 1_500_000,
        resultat: 6_500_000,
    };

    it('should detect major variations (delta >= 5)', () => {
        const newIndices: IndicesSnapshot = {
            ...baseIndices,
            IAC: 70, // +10
            IPQO: 55, // -5
        };

        const feedback = prepareFeedback(
            baseIndices,
            newIndices,
            basePnL,
            basePnL,
            []
        );

        expect(feedback.majorVariations.length).toBeGreaterThanOrEqual(2);

        const iacVariation = feedback.majorVariations.find((v) => v.index === 'IAC');
        expect(iacVariation).toBeDefined();
        expect(iacVariation?.delta).toBe(10);
        expect(iacVariation?.previousValue).toBe(60);
        expect(iacVariation?.newValue).toBe(70);
    });

    it('should not include variations with delta < 5', () => {
        const newIndices: IndicesSnapshot = {
            ...baseIndices,
            IAC: 63, // +3 (not major)
        };

        const feedback = prepareFeedback(
            baseIndices,
            newIndices,
            basePnL,
            basePnL,
            []
        );

        const iacVariation = feedback.majorVariations.find((v) => v.index === 'IAC');
        expect(iacVariation).toBeUndefined();
    });

    it('should count improved and degraded indices', () => {
        const newIndices: IndicesSnapshot = {
            ...baseIndices,
            IAC: 65, // +5
            IPQO: 65, // +5
            IERH: 55, // -5
        };

        const feedback = prepareFeedback(
            baseIndices,
            newIndices,
            basePnL,
            basePnL,
            []
        );

        expect(feedback.summary.indicesImproved).toBe(2);
        expect(feedback.summary.indicesDegraded).toBe(1);
    });

    it('should calculate pnlChange correctly', () => {
        const newPnL: PnLSnapshot = {
            ...basePnL,
            resultat: 8_000_000, // +1.5M
        };

        const feedback = prepareFeedback(
            baseIndices,
            baseIndices,
            basePnL,
            newPnL,
            []
        );

        expect(feedback.summary.pnlChange).toBe(1_500_000);
    });

    it('should track decisions applied count', () => {
        const decisions = [
            { leverId: 'LEV-TAR-01', value: -5 },
            { leverId: 'LEV-RH-01', value: 10 },
        ];

        const feedback = prepareFeedback(
            baseIndices,
            baseIndices,
            basePnL,
            basePnL,
            decisions
        );

        expect(feedback.summary.decisionsApplied).toBe(2);
    });

    it('should identify drivers for variations', () => {
        const newIndices: IndicesSnapshot = {
            ...baseIndices,
            IAC: 75, // +15
        };

        const decisions = [
            { leverId: 'LEV-TAR-01', value: -10, productId: 'auto' },
            { leverId: 'LEV-MKT-01', value: 50 },
        ];

        const feedback = prepareFeedback(
            baseIndices,
            newIndices,
            basePnL,
            basePnL,
            decisions
        );

        const iacVariation = feedback.majorVariations.find((v) => v.index === 'IAC');
        expect(iacVariation?.drivers).toContain('LEV-TAR-01');
        expect(iacVariation?.drivers).toContain('LEV-MKT-01');
    });

    it('should limit drivers to top 3', () => {
        const newIndices: IndicesSnapshot = {
            ...baseIndices,
            IAC: 80,
        };

        const decisions = [
            { leverId: 'LEV-TAR-01', value: -5 },
            { leverId: 'LEV-TAR-02', value: -3 },
            { leverId: 'LEV-TAR-03', value: -2 },
            { leverId: 'LEV-DIST-01', value: 20 },
            { leverId: 'LEV-MKT-01', value: 50 },
        ];

        const feedback = prepareFeedback(
            baseIndices,
            newIndices,
            basePnL,
            basePnL,
            decisions
        );

        const iacVariation = feedback.majorVariations.find((v) => v.index === 'IAC');
        expect(iacVariation?.drivers.length).toBeLessThanOrEqual(3);
    });
});

// ============================================
// DETERMINISM TESTS
// ============================================

describe('Determinism', () => {
    it('should produce same feedback for same inputs', () => {
        const indices1: IndicesSnapshot = { ...baseIndicesDefault(), IAC: 70 };
        const indices2: IndicesSnapshot = { ...baseIndicesDefault(), IAC: 70 };

        const feedback1 = prepareFeedback(
            baseIndicesDefault(),
            indices1,
            basePnLDefault(),
            basePnLDefault(),
            [{ leverId: 'LEV-TAR-01', value: -5 }]
        );

        const feedback2 = prepareFeedback(
            baseIndicesDefault(),
            indices2,
            basePnLDefault(),
            basePnLDefault(),
            [{ leverId: 'LEV-TAR-01', value: -5 }]
        );

        expect(feedback1).toEqual(feedback2);
    });
});

// ============================================
// BOUNDS TESTS
// ============================================

describe('Bounds Validation', () => {
    it('should handle extreme index values', () => {
        const extremeIndices: IndicesSnapshot = {
            IAC: 0,
            IPQO: 100,
            IERH: 0,
            IRF: 100,
            IMD: 50,
            IS: 50,
            IPP: 100,
        };

        const feedback = prepareFeedback(
            baseIndicesDefault(),
            extremeIndices,
            basePnLDefault(),
            basePnLDefault(),
            []
        );

        // Should not throw
        expect(feedback).toBeDefined();
        expect(feedback.majorVariations.length).toBeGreaterThan(0);
    });

    it('should handle negative P&L', () => {
        const negativePnL: PnLSnapshot = {
            primes: 50_000_000,
            sinistres: 60_000_000,
            frais: 12_500_000,
            produits_financiers: 1_500_000,
            resultat: -21_000_000,
        };

        const feedback = prepareFeedback(
            baseIndicesDefault(),
            baseIndicesDefault(),
            basePnLDefault(),
            negativePnL,
            []
        );

        expect(feedback.summary.pnlChange).toBe(-21_000_000 - 6_500_000);
    });
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function baseIndicesDefault(): IndicesSnapshot {
    return {
        IAC: 60,
        IPQO: 60,
        IERH: 60,
        IRF: 60,
        IMD: 45,
        IS: 70,
        IPP: 55,
    };
}

function basePnLDefault(): PnLSnapshot {
    return {
        primes: 50_000_000,
        sinistres: 32_500_000,
        frais: 12_500_000,
        produits_financiers: 1_500_000,
        resultat: 6_500_000,
    };
}
