/**
 * Indices Calculation Module
 *
 * @module lib/engine/indices
 * @description Calculation functions for the 7 systemic indices (US-020)
 *
 * References:
 * - docs/20_simulation/indices.md (source of truth for formulas)
 * - docs/000_projet/specs_fonctionnelles_mvp.md (US-020)
 *
 * Invariants:
 * - INV-IDX-01: ∀ Indice ∈ {IAC, IPQO, IERH, IRF, IMD, IS, IPP} : 0 ≤ Indice ≤ 100
 * - INV-IMPL-05: Guard division by zero on all ratios
 */

import type { IndicesState, CompanyVariables } from './types';
import { clampIndex, safeDivMin, debugCalc } from './utils';

// ============================================
// IAC - INDICE ATTRACTIVITÉ COMMERCIALE
// ============================================

/**
 * IAC weights (sum = 1.0)
 * @see docs/20_simulation/indices.md §2.1
 */
const IAC_WEIGHTS = {
    competitivite_prix: 0.25,
    qualite_service: 0.20,
    distribution: 0.20,
    garanties: 0.15,
    notoriete: 0.10,
    nps: 0.10,
} as const;

/**
 * Calculate IAC - Indice Attractivité Commerciale
 *
 * Measures the company's ability to attract and retain customers.
 *
 * @param vars - Company variables
 * @returns IAC value [0, 100]
 *
 * @example
 * // From docs/20_simulation/indices.md §2.1 example:
 * // competitivite_prix=80, qualite_service=70, force_distribution=75,
 * // etendue_garanties=60, notoriete=50, satisfaction_nps=65
 * // Expected: IAC ≈ 69.5
 */
export function calculateIAC(vars: CompanyVariables): number {
    const raw =
        IAC_WEIGHTS.competitivite_prix * vars.competitivite_prix +
        IAC_WEIGHTS.qualite_service * vars.qualite_service_sinistres +
        IAC_WEIGHTS.distribution * vars.force_distribution +
        IAC_WEIGHTS.garanties * vars.etendue_garanties +
        IAC_WEIGHTS.notoriete * vars.notoriete +
        IAC_WEIGHTS.nps * vars.satisfaction_nps;

    const result = clampIndex(raw);

    debugCalc('IAC', result, {
        competitivite_prix: vars.competitivite_prix,
        qualite_service: vars.qualite_service_sinistres,
        distribution: vars.force_distribution,
        raw,
    });

    return result;
}

// ============================================
// IPQO - INDICE PERFORMANCE & QUALITÉ OPÉRATIONNELLE
// ============================================

/**
 * Calculate quality process score
 * @see docs/20_simulation/indices.md §2.2 (qualite_process sub-function)
 */
function calculateQualiteProcess(delaiGestion: number, tauxErreur: number): number {
    // delai_penalty = min((delai_gestion - 30) × 0.5, 30)
    const delaiPenalty = Math.min(Math.max(0, (delaiGestion - 30) * 0.5), 30);
    // erreur_penalty = taux_erreur × 100
    const erreurPenalty = tauxErreur * 100;
    // qualite_process = 100 - delai_penalty - erreur_penalty
    return Math.max(0, 100 - delaiPenalty - erreurPenalty);
}

/**
 * Calculate IPQO - Indice Performance & Qualité Opérationnelle
 *
 * Measures the operational quality of the company.
 *
 * @param vars - Company variables
 * @returns IPQO value [0, 100]
 *
 * @example
 * // From docs/20_simulation/indices.md §2.2 example:
 * // ratio_charge_capacite=1.2, delai_gestion=45, taux_erreur=0.05,
 * // qualite_presta=70, stabilite_si=65, competence_rh=60
 * // Expected: IPQO ≈ 66.4
 */
export function calculateIPQO(vars: CompanyVariables): number {
    // Surcharge factor calculation
    // surcharge = max(0, (ratio_charge_capacite - 1.0))
    const surcharge = Math.max(0, vars.ratio_charge_capacite - 1.0);
    // surcharge_factor = min(surcharge × 0.3, 0.5)  // capped at -50%
    const surchargeFactor = Math.min(surcharge * 0.3, 0.5);

    // Quality process score
    const qualiteProcess = calculateQualiteProcess(vars.delai_gestion, vars.taux_erreur);

    // Base score = weighted average of 4 components
    const baseScore =
        0.25 * qualiteProcess +
        0.25 * vars.qualite_presta +
        0.25 * vars.stabilite_si +
        0.25 * vars.competence_rh;

    // Final: base_score × (1 - surcharge_factor)
    const raw = baseScore * (1 - surchargeFactor);
    const result = clampIndex(raw);

    debugCalc('IPQO', result, {
        surcharge,
        surchargeFactor,
        qualiteProcess,
        baseScore,
        raw,
    });

    return result;
}

// ============================================
// IERH - INDICE ÉQUILIBRE RH
// ============================================

/**
 * Calculate IERH - Indice Équilibre RH
 *
 * Measures the health of human resources.
 *
 * @param vars - Company variables
 * @returns IERH value [0, 100]
 *
 * @example
 * // From docs/20_simulation/indices.md §2.3 example:
 * // effectif_vs_besoin=0.85, competences=70, turnover=0.18, climat_social=55
 * // Expected: IERH ≈ 79
 */
export function calculateIERH(vars: CompanyVariables): number {
    // effet_effectif = 100 - |effectif_vs_besoin - 1.0| × 50
    const effetEffectif = 100 - Math.abs(vars.effectif_vs_besoin - 1.0) * 50;

    // effet_turnover = max(0, 100 - (turnover - 0.12) × 150)
    // Note: baseline turnover is 12% (0.12)
    const effetTurnover = Math.max(0, 100 - (vars.turnover - 0.12) * 150);

    // IERH = 0.30×effet_effectif + 0.25×competences + 0.25×effet_turnover + 0.20×climat_social
    const raw =
        0.30 * effetEffectif +
        0.25 * vars.competences +
        0.25 * effetTurnover +
        0.20 * vars.climat_social;

    const result = clampIndex(raw);

    debugCalc('IERH', result, {
        effetEffectif,
        effetTurnover,
        raw,
    });

    return result;
}

// ============================================
// IRF - INDICE RÉSILIENCE FINANCIÈRE
// ============================================

/**
 * Calculate IRF - Indice Résilience Financière
 *
 * Measures the capacity to absorb shocks (proxy for Solvency II).
 *
 * @param vars - Company variables
 * @returns IRF value [0, 100]
 *
 * @example
 * // From docs/20_simulation/indices.md §2.4 example:
 * // solvency_ratio=1.50, reassurance_level=70, provisions_marge=0.10, placements_securite=0.70
 * // Expected: IRF ≈ 78.5
 */
export function calculateIRF(vars: CompanyVariables): number {
    // score_solvency = clamp((solvency_ratio - 1.0) × 100 + 50, 0, 100)
    // 100% SCR → 50 points, 150% SCR → 75 points, 200% SCR → 100 points
    const scoreSolvency = clampIndex((vars.solvency_ratio - 1.0) * 100 + 50);

    // score_provisions = 50 + provisions_marge × 100
    // [-30%, +30%] → [20, 80]
    const scoreProvisions = clampIndex(50 + vars.provisions_marge * 100);

    // IRF = 0.35×score_solvency + 0.30×reassurance_level + 0.20×score_provisions + 0.15×placements
    const raw =
        0.35 * scoreSolvency +
        0.30 * vars.reassurance_level +
        0.20 * scoreProvisions +
        0.15 * (vars.placements_securite * 100);

    const result = clampIndex(raw);

    debugCalc('IRF', result, {
        scoreSolvency,
        scoreProvisions,
        raw,
    });

    return result;
}

// ============================================
// IMD - INDICE MATURITÉ DATA
// ============================================

/**
 * Calculate IMD - Indice Maturité Data
 *
 * Measures data capability and its exploitation.
 *
 * @param vars - Company variables
 * @returns IMD value [0, 100]
 *
 * @example
 * // From docs/20_simulation/indices.md §2.5 example:
 * // qualite_donnees=55, gouvernance=45, outillage=50, use_cases_ia=2, dette_technique=40
 * // Expected: IMD ≈ 38.25
 */
export function calculateIMD(vars: CompanyVariables): number {
    // bonus_ia = min(use_cases_ia × 5, 20)
    const bonusIa = Math.min(vars.use_cases_ia * 5, 20);

    // malus_dette = dette_technique × 0.3
    const malusDette = vars.dette_technique * 0.3;

    // IMD = 0.30×qualite_donnees + 0.25×gouvernance + 0.25×outillage + bonus_ia - malus_dette
    const raw =
        0.30 * vars.qualite_donnees +
        0.25 * vars.gouvernance +
        0.25 * vars.outillage +
        bonusIa -
        malusDette;

    const result = clampIndex(raw);

    debugCalc('IMD', result, {
        bonusIa,
        malusDette,
        raw,
    });

    return result;
}

// ============================================
// IS - INDICE DE SINCÉRITÉ
// ============================================

/**
 * Calculate IS - Indice de Sincérité
 *
 * Measures ethics and prudence of decisions.
 *
 * @param vars - Company variables
 * @returns IS value [0, 100]
 *
 * @example
 * // From docs/20_simulation/indices.md §2.6 example:
 * // is_precedent=70, adequation_provisions=-0.15, court_termisme_score=60
 * // Expected: IS ≈ 57.5
 */
export function calculateIS(vars: CompanyVariables): number {
    // Calculate provisions penalty
    // If adequation_provisions < 0 (under-provisioning): penalty = |adequation| × 30
    // If adequation_provisions >= 0 (over-provisioning): penalty = adequation × 10
    let penaliteProvisions: number;
    if (vars.adequation_provisions < 0) {
        penaliteProvisions = Math.abs(vars.adequation_provisions) * 30;
    } else {
        penaliteProvisions = vars.adequation_provisions * 10;
    }

    // penalite_ct = (100 - court_termisme_score) × 0.2
    const penaliteCt = (100 - vars.court_termisme_score) * 0.2;

    // bonus_prudence = +3 if adequation_provisions > 0.05, else 0
    const bonusPrudence = vars.adequation_provisions > 0.05 ? 3 : 0;

    // IS(t) = IS(t-1) - penalite_provisions - penalite_ct + bonus_prudence
    const raw = vars.is_precedent - penaliteProvisions - penaliteCt + bonusPrudence;

    const result = clampIndex(raw);

    debugCalc('IS', result, {
        penaliteProvisions,
        penaliteCt,
        bonusPrudence,
        raw,
    });

    return result;
}

// ============================================
// IPP - INDICE PERFORMANCE P&L
// ============================================

/**
 * Calculate IPP - Indice Performance P&L
 *
 * Measures overall economic performance.
 *
 * @param vars - Company variables
 * @returns IPP value [0, 100]
 *
 * @example
 * // From docs/20_simulation/indices.md §2.7 example:
 * // primes_brutes=100M, primes_cedees=10M, sinistres_bruts=68M,
 * // recup_reassurance=8M, frais=25M, produits_financiers=3M, resultat_marche=4M
 * // Expected: IPP ≈ 78
 */
export function calculateIPP(vars: CompanyVariables): number {
    // Calculate net values
    const primesNettes = vars.primes_brutes - vars.primes_cedees;
    const sinistresNets = vars.sinistres_bruts - vars.recup_reassurance;
    const fraisTotal = vars.frais_acquisition + vars.frais_gestion;

    // resultat_technique_net = primes_nettes - sinistres_nets - frais
    const resultatTechniqueNet = primesNettes - sinistresNets - fraisTotal;

    // resultat_total = resultat_technique_net + produits_financiers
    const resultatTotal = resultatTechniqueNet + vars.produits_financiers;

    // ratio_combine_net = (sinistres_nets + frais) / primes_nettes × 100
    // Guard: if primes_nettes = 0, ratio = 100 (break-even)
    const ratioCombineNet =
        primesNettes === 0
            ? 100
            : ((sinistresNets + fraisTotal) / primesNettes) * 100;

    // performance_relative = clamp((resultat_total - resultat_marche) / max(|resultat_marche|, 1), -2, +2)
    const perfRelativeRaw = safeDivMin(
        resultatTotal - vars.resultat_marche,
        Math.abs(vars.resultat_marche),
        1
    );
    const performanceRelative = Math.max(-2, Math.min(2, perfRelativeRaw));

    // IPP = 50 + performance_relative × 25 + (100 - ratio_combine_net) × 0.5
    const raw = 50 + performanceRelative * 25 + (100 - ratioCombineNet) * 0.5;

    const result = clampIndex(raw);

    debugCalc('IPP', result, {
        primesNettes,
        sinistresNets,
        resultatTotal,
        ratioCombineNet,
        performanceRelative,
        raw,
    });

    return result;
}

// ============================================
// AGGREGATOR
// ============================================

/**
 * Calculate all 7 indices at once
 *
 * @param vars - Company variables
 * @returns All indices as IndicesState
 *
 * @example
 * const state = calculateAllIndices(companyVars);
 * // state.IAC, state.IPQO, ... all in [0, 100]
 */
export function calculateAllIndices(vars: CompanyVariables): IndicesState {
    const indices: IndicesState = {
        IAC: calculateIAC(vars),
        IPQO: calculateIPQO(vars),
        IERH: calculateIERH(vars),
        IRF: calculateIRF(vars),
        IMD: calculateIMD(vars),
        IS: calculateIS(vars),
        IPP: calculateIPP(vars),
    };

    debugCalc('AllIndices', 0, indices as unknown as Record<string, number>);

    return indices;
}
