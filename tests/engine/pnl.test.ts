/**
 * P&L Calculation Unit Tests
 *
 * @module tests/engine/pnl.test
 * @description Unit tests for P&L calculations (US-020)
 *
 * References:
 * - docs/20_simulation/indices.md §2.7 (P&L formulas)
 * - docs/000_projet/specs_fonctionnelles_mvp.md (US-020 AC2)
 */

import { describe, it, expect } from 'vitest';
import {
    calculatePnL,
    validatePnLFormula,
    isProfitable,
    getCombinedRatioZone,
    type CompanyVariables,
    type PnLState,
} from '@/lib/engine';

// ============================================
// TEST DATA HELPERS
// ============================================

/**
 * Create default company variables for testing
 */
function createDefaultVars(): CompanyVariables {
    return {
        // IAC (not used in P&L but required for type)
        competitivite_prix: 50,
        qualite_service_sinistres: 50,
        etendue_garanties: 50,
        force_distribution: 50,
        notoriete: 50,
        satisfaction_nps: 50,
        // IPQO
        ratio_charge_capacite: 1.0,
        delai_gestion: 30,
        taux_erreur: 0.03,
        qualite_presta: 50,
        stabilite_si: 50,
        competence_rh: 50,
        // IERH
        effectif_vs_besoin: 1.0,
        competences: 50,
        turnover: 0.12,
        climat_social: 50,
        // IRF
        solvency_ratio: 1.5,
        reassurance_level: 50,
        provisions_marge: 0,
        placements_securite: 0.5,
        // IMD
        qualite_donnees: 50,
        gouvernance: 50,
        outillage: 50,
        use_cases_ia: 0,
        dette_technique: 30,
        // IS
        adequation_provisions: 0,
        court_termisme_score: 70,
        conformite: 70,
        is_precedent: 70,
        // P&L
        primes_brutes: 100_000_000,
        primes_cedees: 10_000_000,
        sinistres_bruts: 65_000_000,
        recup_reassurance: 6_500_000,
        frais_acquisition: 15_000_000,
        frais_gestion: 10_000_000,
        produits_financiers: 3_000_000,
        resultat_marche: 5_000_000,
    };
}

// ============================================
// calculatePnL TESTS
// ============================================

describe('calculatePnL', () => {
    it('should calculate complete P&L from docs example', () => {
        // From docs/20_simulation/indices.md §2.7 example
        const vars = createDefaultVars();
        vars.primes_brutes = 100_000_000;
        vars.primes_cedees = 10_000_000;
        vars.sinistres_bruts = 68_000_000;
        vars.recup_reassurance = 8_000_000;
        vars.frais_acquisition = 15_000_000;
        vars.frais_gestion = 10_000_000;
        vars.produits_financiers = 3_000_000;

        const pnl = calculatePnL(vars);

        // Verify structure
        expect(pnl.primes.brutes).toBe(100_000_000);
        expect(pnl.primes.nettes).toBe(90_000_000);
        expect(pnl.sinistres.bruts).toBe(68_000_000);
        expect(pnl.sinistres.nets).toBe(60_000_000);
        expect(pnl.frais.total).toBe(25_000_000);
    });

    it('should satisfy AC2: resultat = primes - sinistres - frais + produits', () => {
        const vars = createDefaultVars();
        const pnl = calculatePnL(vars);

        // AC2: P&L = Σ(primes) - Σ(sinistres) - Σ(frais) + Σ(produits_financiers)
        const expected =
            pnl.primes.nettes -
            pnl.sinistres.nets -
            pnl.frais.total +
            vars.produits_financiers;

        expect(pnl.resultat_total).toBeCloseTo(expected, 2);
    });

    it('should pass formula validation', () => {
        const vars = createDefaultVars();
        const pnl = calculatePnL(vars);

        expect(validatePnLFormula(pnl, vars)).toBe(true);
    });

    it('should calculate resultat_technique_brut correctly', () => {
        const vars = createDefaultVars();
        vars.primes_brutes = 100_000_000;
        vars.sinistres_bruts = 65_000_000;
        vars.frais_acquisition = 15_000_000;
        vars.frais_gestion = 10_000_000;

        const pnl = calculatePnL(vars);

        // resultat_technique_brut = primes_brutes - sinistres_bruts - frais
        const expected = 100_000_000 - 65_000_000 - 25_000_000;
        expect(pnl.resultat_technique_brut).toBe(expected);
    });

    it('should calculate resultat_technique_net correctly', () => {
        const vars = createDefaultVars();
        vars.primes_brutes = 100_000_000;
        vars.primes_cedees = 10_000_000;
        vars.sinistres_bruts = 65_000_000;
        vars.recup_reassurance = 6_500_000;
        vars.frais_acquisition = 15_000_000;
        vars.frais_gestion = 10_000_000;

        const pnl = calculatePnL(vars);

        // resultat_technique_net = primes_nettes - sinistres_nets - frais
        // = (100M - 10M) - (65M - 6.5M) - 25M = 90M - 58.5M - 25M = 6.5M
        expect(pnl.resultat_technique_net).toBe(6_500_000);
    });

    it('should calculate resultat_total with produits_financiers', () => {
        const vars = createDefaultVars();
        const pnl = calculatePnL(vars);

        // resultat_total = resultat_technique_net + produits_financiers
        expect(pnl.resultat_total).toBe(
            pnl.resultat_technique_net + vars.produits_financiers
        );
    });

    describe('ratio_combine_brut', () => {
        it('should calculate correctly', () => {
            const vars = createDefaultVars();
            vars.primes_brutes = 100_000_000;
            vars.sinistres_bruts = 70_000_000;
            vars.frais_acquisition = 15_000_000;
            vars.frais_gestion = 10_000_000;

            const pnl = calculatePnL(vars);

            // ratio_combine_brut = (sinistres + frais) / primes × 100
            // = (70M + 25M) / 100M × 100 = 95%
            expect(pnl.ratio_combine_brut).toBe(95);
        });

        it('should handle zero primes (guard)', () => {
            const vars = createDefaultVars();
            vars.primes_brutes = 0;
            vars.primes_cedees = 0;

            const pnl = calculatePnL(vars);

            // Guard: ratio = 100 when primes = 0
            expect(pnl.ratio_combine_brut).toBe(100);
        });
    });

    describe('ratio_combine_net', () => {
        it('should calculate correctly', () => {
            const vars = createDefaultVars();
            vars.primes_brutes = 100_000_000;
            vars.primes_cedees = 10_000_000;
            vars.sinistres_bruts = 68_000_000;
            vars.recup_reassurance = 8_000_000;
            vars.frais_acquisition = 15_000_000;
            vars.frais_gestion = 10_000_000;

            const pnl = calculatePnL(vars);

            // ratio_combine_net = (sinistres_nets + frais) / primes_nettes × 100
            // = (60M + 25M) / 90M × 100 = 94.44%
            expect(pnl.ratio_combine_net).toBeCloseTo(94.44, 1);
        });

        it('should handle zero net primes (guard)', () => {
            const vars = createDefaultVars();
            vars.primes_brutes = 10_000_000;
            vars.primes_cedees = 10_000_000; // net = 0

            const pnl = calculatePnL(vars);

            // Guard: ratio = 100 when primes_nettes = 0
            expect(pnl.ratio_combine_net).toBe(100);
        });
    });

    it('should calculate reassurance correctly', () => {
        const vars = createDefaultVars();
        vars.primes_cedees = 10_000_000;
        vars.recup_reassurance = 8_000_000;

        const pnl = calculatePnL(vars);

        expect(pnl.reassurance.primesCedees).toBe(10_000_000);
        expect(pnl.reassurance.recuperations).toBe(8_000_000);
        // solde = primes_cedees - recuperations (cost to company)
        expect(pnl.reassurance.solde).toBe(2_000_000);
    });
});

// ============================================
// HELPER FUNCTIONS TESTS
// ============================================

describe('isProfitable', () => {
    it('should return true when resultat_total > 0', () => {
        const pnl: PnLState = {
            primes: { brutes: 100, nettes: 90 },
            sinistres: { bruts: 60, nets: 55 },
            frais: { acquisition: 10, gestion: 5, total: 15 },
            reassurance: { primesCedees: 10, recuperations: 5, solde: 5 },
            produits_financiers: 3,
            resultat_technique_brut: 25,
            resultat_technique_net: 20,
            resultat_total: 23, // > 0
            ratio_combine_brut: 75,
            ratio_combine_net: 77.8,
        };

        expect(isProfitable(pnl)).toBe(true);
    });

    it('should return false when resultat_total <= 0', () => {
        const pnl: PnLState = {
            primes: { brutes: 100, nettes: 90 },
            sinistres: { bruts: 80, nets: 75 },
            frais: { acquisition: 10, gestion: 10, total: 20 },
            reassurance: { primesCedees: 10, recuperations: 5, solde: 5 },
            produits_financiers: 2,
            resultat_technique_brut: 0,
            resultat_technique_net: -5,
            resultat_total: -3, // < 0
            ratio_combine_brut: 100,
            ratio_combine_net: 105.6,
        };

        expect(isProfitable(pnl)).toBe(false);
    });
});

describe('getCombinedRatioZone', () => {
    it('should return "excellent" when ratio < 95%', () => {
        const pnl: PnLState = {
            primes: { brutes: 100, nettes: 90 },
            sinistres: { bruts: 60, nets: 55 },
            frais: { acquisition: 10, gestion: 5, total: 15 },
            reassurance: { primesCedees: 10, recuperations: 5, solde: 5 },
            produits_financiers: 3,
            resultat_technique_brut: 25,
            resultat_technique_net: 20,
            resultat_total: 23,
            ratio_combine_brut: 75,
            ratio_combine_net: 77.8, // < 95%
        };

        expect(getCombinedRatioZone(pnl)).toBe('excellent');
    });

    it('should return "equilibre" when ratio >= 95% and < 100%', () => {
        const pnl: PnLState = {
            primes: { brutes: 100, nettes: 90 },
            sinistres: { bruts: 70, nets: 65 },
            frais: { acquisition: 10, gestion: 10, total: 20 },
            reassurance: { primesCedees: 10, recuperations: 5, solde: 5 },
            produits_financiers: 3,
            resultat_technique_brut: 10,
            resultat_technique_net: 5,
            resultat_total: 8,
            ratio_combine_brut: 90,
            ratio_combine_net: 97, // >= 95% and < 100%
        };

        expect(getCombinedRatioZone(pnl)).toBe('equilibre');
    });

    it('should return "deficit" when ratio >= 100%', () => {
        const pnl: PnLState = {
            primes: { brutes: 100, nettes: 90 },
            sinistres: { bruts: 80, nets: 75 },
            frais: { acquisition: 10, gestion: 10, total: 20 },
            reassurance: { primesCedees: 10, recuperations: 5, solde: 5 },
            produits_financiers: 2,
            resultat_technique_brut: -10,
            resultat_technique_net: -5,
            resultat_total: -3,
            ratio_combine_brut: 110,
            ratio_combine_net: 105.6, // >= 100%
        };

        expect(getCombinedRatioZone(pnl)).toBe('deficit');
    });
});

// ============================================
// EDGE CASES
// ============================================

describe('P&L Edge Cases', () => {
    it('should handle all zeros', () => {
        const vars = createDefaultVars();
        vars.primes_brutes = 0;
        vars.primes_cedees = 0;
        vars.sinistres_bruts = 0;
        vars.recup_reassurance = 0;
        vars.frais_acquisition = 0;
        vars.frais_gestion = 0;
        vars.produits_financiers = 0;

        expect(() => calculatePnL(vars)).not.toThrow();

        const pnl = calculatePnL(vars);
        expect(pnl.resultat_total).toBe(0);
        expect(pnl.ratio_combine_brut).toBe(100); // Guard value
    });

    it('should handle negative produits_financiers', () => {
        const vars = createDefaultVars();
        vars.produits_financiers = -1_000_000; // Loss on investments

        const pnl = calculatePnL(vars);

        expect(pnl.resultat_total).toBe(
            pnl.resultat_technique_net + vars.produits_financiers
        );
    });

    it('should handle very large numbers', () => {
        const vars = createDefaultVars();
        vars.primes_brutes = 10_000_000_000; // 10 billion
        vars.primes_cedees = 1_000_000_000;
        vars.sinistres_bruts = 7_000_000_000;
        vars.recup_reassurance = 700_000_000;

        expect(() => calculatePnL(vars)).not.toThrow();

        const pnl = calculatePnL(vars);
        expect(Number.isFinite(pnl.resultat_total)).toBe(true);
        expect(Number.isFinite(pnl.ratio_combine_net)).toBe(true);
    });
});
