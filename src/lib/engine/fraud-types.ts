/**
 * Fraud Types - Fraud N1 Lever System
 *
 * @module lib/engine/fraud-types
 * @description Type definitions for Fraud N1 lever (US-025)
 *
 * References:
 * - docs/000_projet/specs_fonctionnelles_mvp.md (US-025)
 * - docs/20_simulation/leviers_catalogue.md (LEV-SIN-02)
 */

// ============================================
// FRAUD ACTION TYPES
// ============================================

/**
 * Fraud N1 action identifiers
 * Each action must be activated in order (prerequisite chain)
 */
export type FraudActionN1 =
    | 'controles_declaratifs'
    | 'scoring_dossiers'
    | 'detection_automatique';

/**
 * All fraud N1 action IDs for iteration
 */
export const FRAUD_N1_ACTION_IDS: readonly FraudActionN1[] = [
    'controles_declaratifs',
    'scoring_dossiers',
    'detection_automatique',
] as const;

// ============================================
// COST LEVELS
// ============================================

/**
 * Cost level for fraud actions
 */
export type FraudCostLevel = 'low' | 'medium' | 'high';

// ============================================
// FRAUD N1 CONFIGURATION
// ============================================

/**
 * Configuration for a single fraud N1 action
 *
 * @remarks
 * Each action has:
 * - Effect range: min/max % reduction on S/P ratio
 * - Delay: turns before effect applies
 * - Cost: budget units to activate
 * - Prerequisites: actions that must be active first
 */
export interface FraudN1Config {
    /** Action identifier */
    actionId: FraudActionN1;
    /** Display label (French) */
    label: string;
    /** Description of the action */
    description: string;
    /** S/P reduction range in % */
    effectRange: {
        min: number;
        max: number;
    };
    /** Delay in turns before effect */
    delay: {
        min: number;
        max: number;
    };
    /** Cost level indicator */
    cost: FraudCostLevel;
    /** Cost value in K€ */
    costValue: number;
    /** Prerequisite action IDs (must be active) */
    prerequisites: FraudActionN1[];
}

/**
 * All fraud N1 actions with their configurations
 *
 * @remarks
 * Actions form a prerequisite chain:
 * 1. Contrôles déclaratifs (no prerequisites)
 * 2. Scoring dossiers (requires contrôles)
 * 3. Détection automatique (requires scoring)
 *
 * Effects:
 * | Action | S/P Reduction | Delay | Cost |
 * |--------|---------------|-------|------|
 * | Contrôles | -1% to -2% | 1T | 50K€ |
 * | Scoring | -1% to -3% | 1-2T | 150K€ |
 * | Détection | -2% to -3% | 2T | 200K€ |
 */
export const FRAUD_N1_ACTIONS: Record<FraudActionN1, FraudN1Config> = {
    controles_declaratifs: {
        actionId: 'controles_declaratifs',
        label: 'Contrôles déclaratifs',
        description: 'Renforcer les vérifications sur les déclarations clients',
        effectRange: { min: 1, max: 2 },
        delay: { min: 1, max: 1 },
        cost: 'low',
        costValue: 50,
        prerequisites: [],
    },
    scoring_dossiers: {
        actionId: 'scoring_dossiers',
        label: 'Scoring des dossiers',
        description: 'Appliquer un score de risque fraude à chaque dossier',
        effectRange: { min: 1, max: 3 },
        delay: { min: 1, max: 2 },
        cost: 'medium',
        costValue: 150,
        prerequisites: ['controles_declaratifs'],
    },
    detection_automatique: {
        actionId: 'detection_automatique',
        label: 'Détection automatique',
        description: 'IA de détection des patterns frauduleux',
        effectRange: { min: 2, max: 3 },
        delay: { min: 2, max: 2 },
        cost: 'medium',
        costValue: 200,
        prerequisites: ['scoring_dossiers'],
    },
} as const;

// ============================================
// CAP CONSTANT
// ============================================

/**
 * Maximum cumulative S/P reduction from fraud N1 actions
 * INV-FRAUD-N1: totalReduction ≤ FRAUD_N1_CAP
 *
 * @remarks
 * AC2: When plafond reached, gain max ~5% S/P
 */
export const FRAUD_N1_CAP = 5;

// ============================================
// FRAUD N1 STATE
// ============================================

/**
 * State of fraud N1 lever for a session
 *
 * @example
 * ```ts
 * const state: FraudN1State = {
 *   activeActions: ['controles_declaratifs', 'scoring_dossiers'],
 *   totalReduction: 3.5,
 *   capReached: false,
 *   n2Available: false,
 * };
 * ```
 */
export interface FraudN1State {
    /** Currently active fraud N1 actions */
    activeActions: FraudActionN1[];
    /** Cumulative S/P reduction percentage */
    totalReduction: number;
    /** Whether the 5% cap has been reached */
    capReached: boolean;
    /** Whether fraud N2 is available (V1 feature, always shown as info) */
    n2Available: boolean;
}

/**
 * Result of a fraud action activation attempt
 */
export interface FraudActivationResult {
    /** Whether activation succeeded */
    success: boolean;
    /** Updated fraud state (if success) */
    newState?: FraudN1State;
    /** Error message (if failure) */
    error?: string;
    /** Error code for programmatic handling */
    errorCode?: 'INSUFFICIENT_BUDGET' | 'PREREQUISITE_MISSING' | 'ALREADY_ACTIVE' | 'CAP_REACHED';
    /** Budget consumed (if success) */
    budgetConsumed?: number;
    /** S/P reduction added (may be capped) */
    reductionAdded?: number;
    /** Whether cap was applied during this activation */
    capApplied?: boolean;
}

/**
 * Log entry for fraud actions
 */
export interface FraudLogEntry {
    /** Timestamp of the action */
    timestamp: string;
    /** Turn number when action occurred */
    turn: number;
    /** Action that was taken */
    action: FraudActionN1;
    /** Type of log entry */
    type: 'activation' | 'cap_reached' | 'effect_applied';
    /** Additional details */
    details?: string;
}
