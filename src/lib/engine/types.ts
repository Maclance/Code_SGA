/**
 * Engine Types - Indices and P&L Calculations
 *
 * @module lib/engine/types
 * @description Type definitions for simulation engine calculations (US-020)
 *
 * References:
 * - docs/20_simulation/indices.md (formulas and invariants)
 * - docs/000_projet/specs_fonctionnelles_mvp.md (US-020)
 */

// ============================================
// INDICES TYPES
// ============================================

/**
 * Complete indices state (7 systemic indices)
 * Invariant INV-IDX-01: All values in [0, 100]
 */
export interface IndicesState {
    /** Indice Attractivité Commerciale */
    IAC: number;
    /** Indice Performance & Qualité Opérationnelle */
    IPQO: number;
    /** Indice Équilibre RH */
    IERH: number;
    /** Indice Résilience Financière */
    IRF: number;
    /** Indice Maturité Data */
    IMD: number;
    /** Indice de Sincérité */
    IS: number;
    /** Indice Performance P&L */
    IPP: number;
}

/**
 * Index identifier type
 */
export type IndexId = keyof IndicesState;

/**
 * All index IDs for iteration
 */
export const INDEX_IDS: readonly IndexId[] = [
    'IAC',
    'IPQO',
    'IERH',
    'IRF',
    'IMD',
    'IS',
    'IPP',
] as const;

// ============================================
// COMPANY VARIABLES (Input)
// ============================================

/**
 * All company variables used in indices calculations
 * These are the inputs to the calculation functions
 */
export interface CompanyVariables {
    // ----------------------------------------
    // IAC - Attractivité Commerciale
    // ----------------------------------------
    /** Position tarifaire vs marché [0, 100] */
    competitivite_prix: number;
    /** Qualité perçue gestion sinistres [0, 100] */
    qualite_service_sinistres: number;
    /** Niveau de couverture offert [0, 100] */
    etendue_garanties: number;
    /** Couverture et animation réseau [0, 100] */
    force_distribution: number;
    /** Image de marque, marketing [0, 100] */
    notoriete: number;
    /** Score NPS normalisé [0, 100] */
    satisfaction_nps: number;

    // ----------------------------------------
    // IPQO - Performance & Qualité Opérationnelle
    // ----------------------------------------
    /** Stock sinistres / Capacité traitement [0, ∞[ */
    ratio_charge_capacite: number;
    /** Délai moyen clôture (jours) [0, ∞[ */
    delai_gestion: number;
    /** % dossiers avec erreur [0, 1] */
    taux_erreur: number;
    /** Performance SLA prestataires [0, 100] */
    qualite_presta: number;
    /** Score stabilité SI [0, 100] */
    stabilite_si: number;
    /** Niveau moyen compétences RH [0, 100] */
    competence_rh: number;

    // ----------------------------------------
    // IERH - Équilibre RH
    // ----------------------------------------
    /** Ratio effectif réel / besoin [0, 2] */
    effectif_vs_besoin: number;
    /** Niveau de formation moyen [0, 100] */
    competences: number;
    /** Taux départ annualisé [0, 1] */
    turnover: number;
    /** Score QVT / engagement [0, 100] */
    climat_social: number;

    // ----------------------------------------
    // IRF - Résilience Financière
    // ----------------------------------------
    /** Ratio couverture SCR [0, 3] */
    solvency_ratio: number;
    /** Niveau protection réassurance [0, 100] */
    reassurance_level: number;
    /** Marge prudence provisions [-0.3, 0.3] */
    provisions_marge: number;
    /** % placements investment grade [0, 1] */
    placements_securite: number;

    // ----------------------------------------
    // IMD - Maturité Data
    // ----------------------------------------
    /** Score qualité données [0, 100] */
    qualite_donnees: number;
    /** Maturité gouvernance data [0, 100] */
    gouvernance: number;
    /** Niveau outillage/automatisation [0, 100] */
    outillage: number;
    /** Nb use cases IA déployés [0, 10] */
    use_cases_ia: number;
    /** Niveau dette IT [0, 100] */
    dette_technique: number;

    // ----------------------------------------
    // IS - Sincérité
    // ----------------------------------------
    /** Provisions vs sinistres réels [-1, 1] */
    adequation_provisions: number;
    /** Score court-termisme [0, 100] */
    court_termisme_score: number;
    /** Score conformité réglementaire [0, 100] */
    conformite: number;
    /** IS du tour précédent (pour formule récursive) */
    is_precedent: number;

    // ----------------------------------------
    // P&L Variables
    // ----------------------------------------
    /** Primes brutes collectées (€) */
    primes_brutes: number;
    /** Primes cédées à la réassurance (€) */
    primes_cedees: number;
    /** Sinistres bruts payés (€) */
    sinistres_bruts: number;
    /** Récupérations réassurance (€) */
    recup_reassurance: number;
    /** Frais d'acquisition (€) */
    frais_acquisition: number;
    /** Frais de gestion (€) */
    frais_gestion: number;
    /** Revenus des placements (€) */
    produits_financiers: number;
    /** Résultat moyen du marché (€) */
    resultat_marche: number;
}

// ============================================
// P&L STATE
// ============================================

/**
 * Complete P&L state with all calculated values
 */
export interface PnLState {
    /** Primes (brutes et nettes) */
    primes: {
        brutes: number;
        nettes: number;
    };
    /** Sinistres (bruts et nets) */
    sinistres: {
        bruts: number;
        nets: number;
    };
    /** Frais */
    frais: {
        acquisition: number;
        gestion: number;
        total: number;
    };
    /** Réassurance */
    reassurance: {
        primesCedees: number;
        recuperations: number;
        solde: number;
    };
    /** Produits financiers */
    produits_financiers: number;
    /** Résultat technique brut (hors réassurance) */
    resultat_technique_brut: number;
    /** Résultat technique net (après réassurance) */
    resultat_technique_net: number;
    /** Résultat total (technique net + financier) */
    resultat_total: number;
    /** Ratio combiné brut (%) - hors réassurance */
    ratio_combine_brut: number;
    /** Ratio combiné net (%) - après réassurance */
    ratio_combine_net: number;
}

// ============================================
// CALCULATION CONTEXT
// ============================================

/**
 * Difficulty levels affecting calculation parameters
 */
export type Difficulty = 'novice' | 'intermediaire' | 'expert' | 'survie';

/**
 * Variation limits per difficulty
 * INV-IDX-05: Variation max par tour selon difficulté
 */
export const VARIATION_MAX_BY_DIFFICULTY: Record<Difficulty, number> = {
    novice: 5,
    intermediaire: 10,
    expert: 15,
    survie: 15,
} as const;

/**
 * Default initial values for indices
 */
export const DEFAULT_INDICES: IndicesState = {
    IAC: 60,
    IPQO: 60,
    IERH: 60,
    IRF: 60,
    IMD: 45,
    IS: 70, // INV-IDX-07: IS initial = 70
    IPP: 55,
} as const;
