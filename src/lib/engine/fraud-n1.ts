/**
 * Fraud N1 Module - Fraud Level 1 Lever Logic
 *
 * @module lib/engine/fraud-n1
 * @description Fraud N1 lever implementation (US-025)
 *
 * References:
 * - docs/000_projet/specs_fonctionnelles_mvp.md (US-025)
 * - docs/20_simulation/leviers_catalogue.md (LEV-SIN-02)
 *
 * Invariants:
 * - INV-FRAUD-N1: totalReduction ≤ FRAUD_N1_CAP (5%)
 * - Prerequisites must be satisfied before activation
 * - Budget must cover costValue
 */

import {
    FraudActionN1,
    FraudN1Config,
    FraudN1State,
    FraudActivationResult,
    FraudLogEntry,
    FRAUD_N1_ACTIONS,
    FRAUD_N1_CAP,
    FRAUD_N1_ACTION_IDS,
} from './fraud-types';

// ============================================
// INITIALIZATION
// ============================================

/**
 * Creates a fresh fraud N1 state for a new session
 *
 * @returns Initial fraud N1 state with no active actions
 *
 * @example
 * ```ts
 * const state = initializeFraudN1State();
 * // { activeActions: [], totalReduction: 0, capReached: false, n2Available: false }
 * ```
 */
export function initializeFraudN1State(): FraudN1State {
    return {
        activeActions: [],
        totalReduction: 0,
        capReached: false,
        n2Available: false,
    };
}

// ============================================
// PREREQUISITE VALIDATION
// ============================================

/**
 * Checks if all prerequisites for an action are satisfied
 *
 * @param action - The action to check prerequisites for
 * @param state - Current fraud N1 state
 * @returns True if all prerequisites are active, false otherwise
 *
 * @example
 * ```ts
 * const state = { activeActions: ['controles_declaratifs'], ... };
 * checkPrerequisites('scoring_dossiers', state); // true
 * checkPrerequisites('detection_automatique', state); // false
 * ```
 */
export function checkPrerequisites(
    action: FraudActionN1,
    state: FraudN1State
): boolean {
    const config = FRAUD_N1_ACTIONS[action];

    // No prerequisites = always valid
    if (config.prerequisites.length === 0) {
        return true;
    }

    // All prerequisites must be in activeActions
    return config.prerequisites.every(prereq =>
        state.activeActions.includes(prereq)
    );
}

/**
 * Gets the missing prerequisites for an action
 *
 * @param action - The action to check
 * @param state - Current fraud N1 state
 * @returns Array of missing prerequisite action IDs
 */
export function getMissingPrerequisites(
    action: FraudActionN1,
    state: FraudN1State
): FraudActionN1[] {
    const config = FRAUD_N1_ACTIONS[action];

    return config.prerequisites.filter(prereq =>
        !state.activeActions.includes(prereq)
    );
}

// ============================================
// CAP ENFORCEMENT
// ============================================

/**
 * Checks and enforces the N1 cap on S/P reduction
 *
 * @param currentReduction - Current cumulative reduction %
 * @param newEffect - New reduction to add %
 * @returns Capped reduction value and whether cap was applied
 *
 * @remarks
 * INV-FRAUD-N1: totalReduction ≤ FRAUD_N1_CAP (5%)
 *
 * @example
 * ```ts
 * checkN1Cap(4, 3); // { cappedEffect: 1, capApplied: true, totalAfter: 5 }
 * checkN1Cap(2, 2); // { cappedEffect: 2, capApplied: false, totalAfter: 4 }
 * ```
 */
export function checkN1Cap(
    currentReduction: number,
    newEffect: number
): { cappedEffect: number; capApplied: boolean; totalAfter: number } {
    const potentialTotal = currentReduction + newEffect;

    if (potentialTotal > FRAUD_N1_CAP) {
        const cappedEffect = Math.max(0, FRAUD_N1_CAP - currentReduction);
        return {
            cappedEffect,
            capApplied: true,
            totalAfter: FRAUD_N1_CAP,
        };
    }

    return {
        cappedEffect: newEffect,
        capApplied: false,
        totalAfter: potentialTotal,
    };
}

// ============================================
// EFFECT CALCULATION
// ============================================

/**
 * Calculates the S/P reduction effect for a fraud action
 *
 * @param action - The fraud action
 * @param seed - Random seed for deterministic calculation (optional)
 * @returns S/P reduction percentage within action's effect range
 *
 * @remarks
 * Effect is calculated within the action's effectRange [min, max]
 * Uses linear interpolation with optional seed for reproducibility
 */
export function calculateFraudEffect(
    action: FraudActionN1,
    seed?: number
): number {
    const config = FRAUD_N1_ACTIONS[action];
    const { min, max } = config.effectRange;

    // Use seed or random
    const random = seed !== undefined
        ? seededRandom(seed)
        : Math.random();

    // Linear interpolation between min and max
    const effect = min + random * (max - min);

    // Round to 1 decimal place
    return Math.round(effect * 10) / 10;
}

/**
 * Simple seeded random number generator
 * @internal
 */
function seededRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

// ============================================
// ACTION ACTIVATION
// ============================================

/**
 * Attempts to activate a fraud N1 action
 *
 * @param action - The action to activate
 * @param state - Current fraud N1 state
 * @param availableBudget - Available budget in K€
 * @param currentTurn - Current turn number (for logging)
 * @param seed - Optional seed for deterministic effect calculation
 * @returns Activation result with success/failure and updated state
 *
 * @remarks
 * Validates:
 * 1. Action not already active
 * 2. Prerequisites satisfied
 * 3. Budget sufficient
 * 4. Cap not already reached (warns but proceeds with reduced effect)
 *
 * @example
 * ```ts
 * const result = activateFraudAction('controles_declaratifs', state, 100, 1);
 * if (result.success) {
 *   state = result.newState;
 *   budget -= result.budgetConsumed;
 * }
 * ```
 */
export function activateFraudAction(
    action: FraudActionN1,
    state: FraudN1State,
    availableBudget: number,
    currentTurn: number,
    seed?: number
): FraudActivationResult {
    const config = FRAUD_N1_ACTIONS[action];

    // Check if already active
    if (state.activeActions.includes(action)) {
        return {
            success: false,
            error: `Action "${config.label}" est déjà active`,
            errorCode: 'ALREADY_ACTIVE',
        };
    }

    // Check prerequisites
    if (!checkPrerequisites(action, state)) {
        const missing = getMissingPrerequisites(action, state);
        const missingLabels = missing.map(m => FRAUD_N1_ACTIONS[m].label);
        return {
            success: false,
            error: `Prérequis manquants: ${missingLabels.join(', ')}`,
            errorCode: 'PREREQUISITE_MISSING',
        };
    }

    // Check budget
    if (availableBudget < config.costValue) {
        return {
            success: false,
            error: `Budget insuffisant: ${config.costValue}K€ requis, ${availableBudget}K€ disponible`,
            errorCode: 'INSUFFICIENT_BUDGET',
        };
    }

    // Calculate effect (may be capped)
    const rawEffect = calculateFraudEffect(action, seed);
    const { cappedEffect, capApplied, totalAfter } = checkN1Cap(
        state.totalReduction,
        rawEffect
    );

    // Check if cap was already reached (no benefit to activating)
    if (state.capReached && cappedEffect === 0) {
        return {
            success: false,
            error: 'Cap fraude N1 déjà atteint (5% S/P)',
            errorCode: 'CAP_REACHED',
        };
    }

    // Create new state
    const newState: FraudN1State = {
        activeActions: [...state.activeActions, action],
        totalReduction: totalAfter,
        capReached: totalAfter >= FRAUD_N1_CAP,
        n2Available: checkN2Availability([...state.activeActions, action]),
    };

    // Log activation
    logFraudAction({
        timestamp: new Date().toISOString(),
        turn: currentTurn,
        action,
        type: 'activation',
        details: `S/P reduction: ${cappedEffect}%${capApplied ? ' (capped)' : ''}`,
    });

    // Log cap reached if applicable
    if (newState.capReached && !state.capReached) {
        logFraudAction({
            timestamp: new Date().toISOString(),
            turn: currentTurn,
            action,
            type: 'cap_reached',
            details: `Cap fraude N1 atteint: ${FRAUD_N1_CAP}% S/P`,
        });
    }

    return {
        success: true,
        newState,
        budgetConsumed: config.costValue,
        reductionAdded: cappedEffect,
        capApplied,
    };
}

// ============================================
// AVAILABILITY HELPERS
// ============================================

/**
 * Gets all currently available (activable) fraud actions
 *
 * @param state - Current fraud N1 state
 * @returns Array of action IDs that can be activated
 */
export function getAvailableActions(state: FraudN1State): FraudActionN1[] {
    return FRAUD_N1_ACTION_IDS.filter(action =>
        !state.activeActions.includes(action) &&
        checkPrerequisites(action, state)
    );
}

/**
 * Gets the configuration for a fraud action
 *
 * @param action - The action ID
 * @returns The action configuration
 */
export function getActionConfig(action: FraudActionN1): FraudN1Config {
    return FRAUD_N1_ACTIONS[action];
}

/**
 * Checks if N2 fraud is available (V1 feature indicator)
 *
 * @remarks
 * N2 becomes "available" (shown as info) when all N1 actions are active
 * Actual N2 functionality is out of scope for MVP
 */
function checkN2Availability(activeActions: FraudActionN1[]): boolean {
    // N2 is shown as available when all N1 actions are active
    return FRAUD_N1_ACTION_IDS.every(action =>
        activeActions.includes(action)
    );
}

// ============================================
// LOGGING
// ============================================

/**
 * Log store for fraud actions (module-level for simplicity)
 * @internal
 */
const fraudLogs: FraudLogEntry[] = [];

/**
 * Logs a fraud action event
 * @internal
 */
function logFraudAction(entry: FraudLogEntry): void {
    fraudLogs.push(entry);

    // Console log for debugging
    if (process.env.NODE_ENV === 'development') {
        console.log(`[Fraud N1] ${entry.type}: ${entry.action}`, entry.details || '');
    }
}

/**
 * Gets all fraud log entries
 *
 * @returns Array of log entries
 */
export function getFraudLogs(): FraudLogEntry[] {
    return [...fraudLogs];
}

/**
 * Clears fraud logs (for testing)
 */
export function clearFraudLogs(): void {
    fraudLogs.length = 0;
}

// ============================================
// SUMMARY HELPERS
// ============================================

/**
 * Gets a summary of the current fraud N1 state for UI display
 *
 * @param state - Current fraud N1 state
 * @returns Summary object for UI rendering
 */
export function getFraudN1Summary(state: FraudN1State): {
    activeCount: number;
    totalCount: number;
    reduction: number;
    cap: number;
    capReached: boolean;
    n2Badge: boolean;
} {
    return {
        activeCount: state.activeActions.length,
        totalCount: FRAUD_N1_ACTION_IDS.length,
        reduction: state.totalReduction,
        cap: FRAUD_N1_CAP,
        capReached: state.capReached,
        n2Badge: state.n2Available,
    };
}

/**
 * Calculates total cost of all active fraud actions
 *
 * @param state - Current fraud N1 state
 * @returns Total cost in K€
 */
export function getTotalFraudCost(state: FraudN1State): number {
    return state.activeActions.reduce((total, action) =>
        total + FRAUD_N1_ACTIONS[action].costValue,
        0
    );
}
