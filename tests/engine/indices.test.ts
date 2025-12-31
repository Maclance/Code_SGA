/**
 * Indices Calculation Unit Tests
 *
 * @module tests/engine/indices.test
 * @description Unit tests for the 7 indices calculations (US-020)
 *
 * References:
 * - docs/20_simulation/indices.md (formulas and examples)
 * - docs/000_projet/specs_fonctionnelles_mvp.md (US-020 DoD)
 */

import { describe, it, expect } from 'vitest';
import {
    clamp,
    clampIndex,
    safeDiv,
    safeDivMin,
    calculateIAC,
    calculateIPQO,
    calculateIERH,
    calculateIRF,
    calculateIMD,
    calculateIS,
    calculateIPP,
    calculateAllIndices,
    type CompanyVariables,
    type IndicesState,
    INDEX_IDS,
} from '@/lib/engine';

// ============================================
// TEST DATA HELPERS
// ============================================

/**
 * Create default company variables for testing
 * All values set to neutral/mid-range
 */
function createDefaultVars(): CompanyVariables {
    return {
        // IAC
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
// UTILITY FUNCTIONS TESTS
// ============================================

describe('clamp', () => {
    it('should return max when value exceeds max', () => {
        expect(clamp(150, 0, 100)).toBe(100);
        expect(clamp(200, 0, 100)).toBe(100);
    });

    it('should return min when value is below min', () => {
        expect(clamp(-10, 0, 100)).toBe(0);
        expect(clamp(-50, 0, 100)).toBe(0);
    });

    it('should return value when in range', () => {
        expect(clamp(50, 0, 100)).toBe(50);
        expect(clamp(0, 0, 100)).toBe(0);
        expect(clamp(100, 0, 100)).toBe(100);
    });

    it('should throw error when min > max', () => {
        expect(() => clamp(50, 100, 0)).toThrow('Invalid clamp bounds');
    });
});

describe('clampIndex', () => {
    it('should clamp to [0, 100]', () => {
        expect(clampIndex(150)).toBe(100);
        expect(clampIndex(-10)).toBe(0);
        expect(clampIndex(50)).toBe(50);
    });
});

describe('safeDiv', () => {
    it('should return fallback when denominator is zero', () => {
        expect(safeDiv(100, 0)).toBe(0);
        expect(safeDiv(100, 0, 100)).toBe(100);
    });

    it('should return normal division result', () => {
        expect(safeDiv(100, 50)).toBe(2);
        expect(safeDiv(100, 4)).toBe(25);
    });
});

describe('safeDivMin', () => {
    it('should use minDenominator when denominator is zero', () => {
        expect(safeDivMin(100, 0)).toBe(100); // 100 / 1
        expect(safeDivMin(100, 0, 2)).toBe(50); // 100 / 2
    });

    it('should use actual denominator when larger than min', () => {
        expect(safeDivMin(100, 50)).toBe(2);
        expect(safeDivMin(100, 50, 10)).toBe(2);
    });
});

// ============================================
// IAC TESTS
// ============================================

describe('calculateIAC', () => {
    it('should calculate nominal case from docs example', () => {
        // From docs/20_simulation/indices.md §2.1 example
        const vars = createDefaultVars();
        vars.competitivite_prix = 80;
        vars.qualite_service_sinistres = 70;
        vars.force_distribution = 75;
        vars.etendue_garanties = 60;
        vars.notoriete = 50;
        vars.satisfaction_nps = 65;

        const result = calculateIAC(vars);

        // Expected: 0.25×80 + 0.20×70 + 0.20×75 + 0.15×60 + 0.10×50 + 0.10×65 = 69.5
        expect(result).toBeCloseTo(69.5, 1);
    });

    it('should clamp result to [0, 100]', () => {
        const vars = createDefaultVars();
        // Set all to max
        vars.competitivite_prix = 120;
        vars.qualite_service_sinistres = 120;
        vars.force_distribution = 120;
        vars.etendue_garanties = 120;
        vars.notoriete = 120;
        vars.satisfaction_nps = 120;

        const result = calculateIAC(vars);
        expect(result).toBe(100);
    });

    it('should monotonically increase with competitivite_prix', () => {
        const vars1 = createDefaultVars();
        const vars2 = createDefaultVars();
        vars1.competitivite_prix = 40;
        vars2.competitivite_prix = 60;

        const result1 = calculateIAC(vars1);
        const result2 = calculateIAC(vars2);

        expect(result2).toBeGreaterThan(result1);
    });
});

// ============================================
// IPQO TESTS
// ============================================

describe('calculateIPQO', () => {
    it('should calculate nominal case from docs example', () => {
        // From docs/20_simulation/indices.md §2.2 example
        const vars = createDefaultVars();
        vars.ratio_charge_capacite = 1.2;
        vars.delai_gestion = 45;
        vars.taux_erreur = 0.05;
        vars.qualite_presta = 70;
        vars.stabilite_si = 65;
        vars.competence_rh = 60;

        const result = calculateIPQO(vars);

        // Expected: ~66.4 (see docs calculation)
        expect(result).toBeCloseTo(66.4, 0);
    });

    it('should degrade with high surcharge', () => {
        const vars1 = createDefaultVars();
        const vars2 = createDefaultVars();
        vars1.ratio_charge_capacite = 1.0;
        vars2.ratio_charge_capacite = 1.5;

        const result1 = calculateIPQO(vars1);
        const result2 = calculateIPQO(vars2);

        expect(result2).toBeLessThan(result1);
    });
});

// ============================================
// IERH TESTS
// ============================================

describe('calculateIERH', () => {
    it('should calculate nominal case from docs example', () => {
        // From docs/20_simulation/indices.md §2.3 example
        const vars = createDefaultVars();
        vars.effectif_vs_besoin = 0.85;
        vars.competences = 70;
        vars.turnover = 0.18;
        vars.climat_social = 55;

        const result = calculateIERH(vars);

        // Expected: ~79
        expect(result).toBeCloseTo(79, 0);
    });

    it('should penalize understaffing', () => {
        const vars1 = createDefaultVars();
        const vars2 = createDefaultVars();
        vars1.effectif_vs_besoin = 1.0;
        vars2.effectif_vs_besoin = 0.7;

        const result1 = calculateIERH(vars1);
        const result2 = calculateIERH(vars2);

        expect(result2).toBeLessThan(result1);
    });

    it('should penalize high turnover', () => {
        const vars1 = createDefaultVars();
        const vars2 = createDefaultVars();
        vars1.turnover = 0.10;
        vars2.turnover = 0.25;

        const result1 = calculateIERH(vars1);
        const result2 = calculateIERH(vars2);

        expect(result2).toBeLessThan(result1);
    });
});

// ============================================
// IRF TESTS
// ============================================

describe('calculateIRF', () => {
    it('should calculate nominal case from docs example', () => {
        // From docs/20_simulation/indices.md §2.4 example
        const vars = createDefaultVars();
        vars.solvency_ratio = 1.50;
        vars.reassurance_level = 70;
        vars.provisions_marge = 0.10;
        vars.placements_securite = 0.70;

        const result = calculateIRF(vars);

        // Expected: ~78.5
        expect(result).toBeCloseTo(78.5, 0);
    });

    it('should improve with higher solvency ratio', () => {
        const vars1 = createDefaultVars();
        const vars2 = createDefaultVars();
        vars1.solvency_ratio = 1.2;
        vars2.solvency_ratio = 2.0;

        const result1 = calculateIRF(vars1);
        const result2 = calculateIRF(vars2);

        expect(result2).toBeGreaterThan(result1);
    });
});

// ============================================
// IMD TESTS
// ============================================

describe('calculateIMD', () => {
    it('should calculate nominal case from docs example', () => {
        // From docs/20_simulation/indices.md §2.5 example
        const vars = createDefaultVars();
        vars.qualite_donnees = 55;
        vars.gouvernance = 45;
        vars.outillage = 50;
        vars.use_cases_ia = 2;
        vars.dette_technique = 40;

        const result = calculateIMD(vars);

        // Expected: ~38.25
        expect(result).toBeCloseTo(38.25, 0);
    });

    it('should add bonus for AI use cases (capped at 20)', () => {
        const vars1 = createDefaultVars();
        const vars2 = createDefaultVars();
        vars1.use_cases_ia = 0;
        vars2.use_cases_ia = 5;

        const result1 = calculateIMD(vars1);
        const result2 = calculateIMD(vars2);

        expect(result2 - result1).toBeCloseTo(20, 0); // 5 × 5 = 25, but capped at 20
    });

    it('should penalize technical debt', () => {
        const vars1 = createDefaultVars();
        const vars2 = createDefaultVars();
        vars1.dette_technique = 20;
        vars2.dette_technique = 60;

        const result1 = calculateIMD(vars1);
        const result2 = calculateIMD(vars2);

        expect(result2).toBeLessThan(result1);
    });
});

// ============================================
// IS TESTS
// ============================================

describe('calculateIS', () => {
    it('should calculate nominal case from docs example', () => {
        // From docs/20_simulation/indices.md §2.6 example
        const vars = createDefaultVars();
        vars.is_precedent = 70;
        vars.adequation_provisions = -0.15;
        vars.court_termisme_score = 60;

        const result = calculateIS(vars);

        // Expected: ~57.5
        expect(result).toBeCloseTo(57.5, 0);
    });

    it('should penalize under-provisioning more than over-provisioning', () => {
        const vars1 = createDefaultVars();
        const vars2 = createDefaultVars();
        vars1.adequation_provisions = -0.10; // under
        vars2.adequation_provisions = 0.10; // over

        const result1 = calculateIS(vars1);
        const result2 = calculateIS(vars2);

        // Under-provisioning penalty = 0.10 × 30 = 3
        // Over-provisioning penalty = 0.10 × 10 = 1
        expect(result2).toBeGreaterThan(result1);
    });

    it('should give bonus for prudence', () => {
        const vars1 = createDefaultVars();
        const vars2 = createDefaultVars();
        vars1.adequation_provisions = 0.03;
        vars2.adequation_provisions = 0.10; // > 0.05

        const result1 = calculateIS(vars1);
        const result2 = calculateIS(vars2);

        // vars2 gets +3 bonus
        expect(result2).toBeGreaterThan(result1);
    });
});

// ============================================
// IPP TESTS
// ============================================

describe('calculateIPP', () => {
    it('should calculate nominal case from docs example', () => {
        // From docs/20_simulation/indices.md §2.7 example
        const vars = createDefaultVars();
        vars.primes_brutes = 100_000_000;
        vars.primes_cedees = 10_000_000;
        vars.sinistres_bruts = 68_000_000;
        vars.recup_reassurance = 8_000_000;
        vars.frais_acquisition = 15_000_000;
        vars.frais_gestion = 10_000_000;
        vars.produits_financiers = 3_000_000;
        vars.resultat_marche = 4_000_000;

        const result = calculateIPP(vars);

        // Expected: ~78
        expect(result).toBeCloseTo(78, 0);
    });

    it('should guard against division by zero when primes=0', () => {
        const vars = createDefaultVars();
        vars.primes_brutes = 0;
        vars.primes_cedees = 0;

        // Should not throw
        expect(() => calculateIPP(vars)).not.toThrow();

        const result = calculateIPP(vars);
        // With ratio_combine = 100 (guard value), result should be valid
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(100);
    });

    it('should clamp to 0 for extreme negative case (TEST-IDX-05)', () => {
        // From docs/20_simulation/indices.md TEST-IDX-05
        const vars = createDefaultVars();
        vars.primes_brutes = 100_000_000;
        vars.primes_cedees = 0;
        vars.sinistres_bruts = 130_000_000; // 130% S/P
        vars.recup_reassurance = 0;
        vars.frais_acquisition = 15_000_000;
        vars.frais_gestion = 10_000_000;
        vars.produits_financiers = 0;
        vars.resultat_marche = 4_000_000;

        const result = calculateIPP(vars);

        // Should be clamped to 0
        expect(result).toBe(0);
    });
});

// ============================================
// AGGREGATE TESTS
// ============================================

describe('calculateAllIndices', () => {
    it('should return all 7 indices', () => {
        const vars = createDefaultVars();
        const result = calculateAllIndices(vars);

        expect(result).toHaveProperty('IAC');
        expect(result).toHaveProperty('IPQO');
        expect(result).toHaveProperty('IERH');
        expect(result).toHaveProperty('IRF');
        expect(result).toHaveProperty('IMD');
        expect(result).toHaveProperty('IS');
        expect(result).toHaveProperty('IPP');
    });

    it('should have all indices in [0, 100] (INV-IDX-01)', () => {
        const vars = createDefaultVars();
        const result = calculateAllIndices(vars);

        for (const id of INDEX_IDS) {
            expect(result[id]).toBeGreaterThanOrEqual(0);
            expect(result[id]).toBeLessThanOrEqual(100);
        }
    });

    it('should be deterministic (same input → same output)', () => {
        const vars = createDefaultVars();

        const result1 = calculateAllIndices(vars);
        const result2 = calculateAllIndices(vars);

        expect(result1).toEqual(result2);
    });

    it('should handle extreme values without throwing', () => {
        const vars = createDefaultVars();
        // Set extreme values
        vars.competitivite_prix = 150;
        vars.turnover = 0.9;
        vars.solvency_ratio = 0.1;
        vars.primes_brutes = 0;

        expect(() => calculateAllIndices(vars)).not.toThrow();

        const result = calculateAllIndices(vars);
        for (const id of INDEX_IDS) {
            expect(result[id]).toBeGreaterThanOrEqual(0);
            expect(result[id]).toBeLessThanOrEqual(100);
        }
    });
});

// ============================================
// PROPERTY-BASED TESTS
// ============================================

describe('Indices Properties', () => {
    it('should satisfy INV-IDX-01: all indices in [0, 100]', () => {
        // Test with multiple random configurations
        for (let i = 0; i < 10; i++) {
            const vars = createDefaultVars();
            vars.competitivite_prix = Math.random() * 150;
            vars.turnover = Math.random();
            vars.solvency_ratio = Math.random() * 3;

            const result = calculateAllIndices(vars);

            for (const id of INDEX_IDS) {
                expect(result[id]).toBeGreaterThanOrEqual(0);
                expect(result[id]).toBeLessThanOrEqual(100);
            }
        }
    });

    it('should be monotonic: ↑competitivite_prix → ↑IAC', () => {
        const vars = createDefaultVars();
        let previousIAC = 0;

        for (let prix = 0; prix <= 100; prix += 20) {
            vars.competitivite_prix = prix;
            const iac = calculateIAC(vars);

            expect(iac).toBeGreaterThanOrEqual(previousIAC);
            previousIAC = iac;
        }
    });
});
