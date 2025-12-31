/**
 * P&L Calculation Module
 *
 * @module lib/engine/pnl
 * @description P&L calculation functions for the simulation engine (US-020)
 *
 * References:
 * - docs/20_simulation/indices.md §2.7 (P&L formulas)
 * - docs/000_projet/specs_fonctionnelles_mvp.md (US-020 AC2)
 *
 * Invariants:
 * - AC2: P&L = primes - sinistres - frais + produits_financiers
 * - Guard division by zero on ratio calculations
 */

import type { CompanyVariables, PnLState } from './types';
import { debugCalc } from './utils';

// ============================================
// P&L CALCULATION
// ============================================

/**
 * Calculate complete P&L state
 *
 * Implements the full P&L calculation with:
 * - Gross and net premiums
 * - Gross and net claims
 * - Reinsurance balance
 * - Technical and total results
 * - Combined ratios (gross and net)
 *
 * @param vars - Company variables with P&L inputs
 * @returns Complete PnLState
 *
 * @example
 * // From docs/20_simulation/indices.md §2.7 example:
 * const vars = {
 *   primes_brutes: 100_000_000,
 *   primes_cedees: 10_000_000,
 *   sinistres_bruts: 68_000_000,
 *   recup_reassurance: 8_000_000,
 *   frais_acquisition: 15_000_000,
 *   frais_gestion: 10_000_000,
 *   produits_financiers: 3_000_000,
 *   // ... other vars
 * };
 * const pnl = calculatePnL(vars);
 * // pnl.resultat_total = 8_000_000
 * // pnl.ratio_combine_net ≈ 94.4%
 */
export function calculatePnL(vars: CompanyVariables): PnLState {
    // ----------------------------------------
    // Premiums
    // ----------------------------------------
    const primesBrutes = vars.primes_brutes;
    const primesNettes = vars.primes_brutes - vars.primes_cedees;

    // ----------------------------------------
    // Claims
    // ----------------------------------------
    const sinistresBruts = vars.sinistres_bruts;
    const sinistresNets = vars.sinistres_bruts - vars.recup_reassurance;

    // ----------------------------------------
    // Expenses
    // ----------------------------------------
    const fraisAcquisition = vars.frais_acquisition;
    const fraisGestion = vars.frais_gestion;
    const fraisTotal = fraisAcquisition + fraisGestion;

    // ----------------------------------------
    // Reinsurance
    // ----------------------------------------
    const primesCedees = vars.primes_cedees;
    const recuperations = vars.recup_reassurance;
    // solde = primes_cedees - recuperations (cost to company)
    const soldeReassurance = primesCedees - recuperations;

    // ----------------------------------------
    // Technical Results
    // ----------------------------------------
    // resultat_technique_brut = primes_brutes - sinistres_bruts - frais
    const resultatTechniqueBrut = primesBrutes - sinistresBruts - fraisTotal;

    // resultat_technique_net = primes_nettes - sinistres_nets - frais
    const resultatTechniqueNet = primesNettes - sinistresNets - fraisTotal;

    // ----------------------------------------
    // Total Result
    // ----------------------------------------
    // resultat_total = resultat_technique_net + produits_financiers
    const resultatTotal = resultatTechniqueNet + vars.produits_financiers;

    // ----------------------------------------
    // Combined Ratios
    // ----------------------------------------
    // ratio_combine_brut = (sinistres_bruts + frais) / primes_brutes × 100
    // Guard: if primes = 0, ratio = 100 (break-even)
    const ratioCombineBrut =
        primesBrutes === 0
            ? 100
            : ((sinistresBruts + fraisTotal) / primesBrutes) * 100;

    // ratio_combine_net = (sinistres_nets + frais) / primes_nettes × 100
    const ratioCombineNet =
        primesNettes === 0
            ? 100
            : ((sinistresNets + fraisTotal) / primesNettes) * 100;

    // ----------------------------------------
    // Build result
    // ----------------------------------------
    const result: PnLState = {
        primes: {
            brutes: primesBrutes,
            nettes: primesNettes,
        },
        sinistres: {
            bruts: sinistresBruts,
            nets: sinistresNets,
        },
        frais: {
            acquisition: fraisAcquisition,
            gestion: fraisGestion,
            total: fraisTotal,
        },
        reassurance: {
            primesCedees,
            recuperations,
            solde: soldeReassurance,
        },
        produits_financiers: vars.produits_financiers,
        resultat_technique_brut: resultatTechniqueBrut,
        resultat_technique_net: resultatTechniqueNet,
        resultat_total: resultatTotal,
        ratio_combine_brut: ratioCombineBrut,
        ratio_combine_net: ratioCombineNet,
    };

    debugCalc('PnL', resultatTotal, {
        primesBrutes,
        primesNettes,
        sinistresBruts,
        sinistresNets,
        fraisTotal,
        ratioCombineNet,
    });

    return result;
}

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Check if P&L formula holds
 *
 * Validates AC2: P&L = primes - sinistres - frais + produits_financiers
 *
 * @param pnl - Calculated P&L state
 * @param vars - Original company variables
 * @returns true if formula holds
 */
export function validatePnLFormula(pnl: PnLState, vars: CompanyVariables): boolean {
    // Using net values for the main result
    const expected =
        pnl.primes.nettes -
        pnl.sinistres.nets -
        pnl.frais.total +
        vars.produits_financiers;

    // Allow small floating point tolerance
    const tolerance = 0.01;
    return Math.abs(pnl.resultat_total - expected) < tolerance;
}

/**
 * Check if company is profitable
 *
 * @param pnl - P&L state
 * @returns true if resultat_total > 0
 */
export function isProfitable(pnl: PnLState): boolean {
    return pnl.resultat_total > 0;
}

/**
 * Check if combined ratio is in healthy zone
 *
 * Per docs: Ratio combiné < 100% = équilibre technique
 *           Ratio combiné < 95% = zone excellence
 *
 * @param pnl - P&L state
 * @returns 'excellent' | 'equilibre' | 'deficit'
 */
export function getCombinedRatioZone(
    pnl: PnLState
): 'excellent' | 'equilibre' | 'deficit' {
    if (pnl.ratio_combine_net < 95) {
        return 'excellent';
    }
    if (pnl.ratio_combine_net < 100) {
        return 'equilibre';
    }
    return 'deficit';
}
