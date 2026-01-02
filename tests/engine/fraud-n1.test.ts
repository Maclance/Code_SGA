/**
 * Fraud N1 Unit Tests
 *
 * @module tests/engine/fraud-n1.test
 * @description Unit tests for Fraud N1 lever (US-025)
 *
 * References:
 * - docs/000_projet/specs_fonctionnelles_mvp.md (US-025)
 * - docs/20_simulation/leviers_catalogue.md (LEV-SIN-02)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    FraudN1State,
    FraudActionN1,
    FRAUD_N1_ACTIONS,
    FRAUD_N1_CAP,
    FRAUD_N1_ACTION_IDS,
} from '@/lib/engine/fraud-types';
import {
    initializeFraudN1State,
    checkPrerequisites,
    getMissingPrerequisites,
    checkN1Cap,
    calculateFraudEffect,
    activateFraudAction,
    getAvailableActions,
    getActionConfig,
    getFraudN1Summary,
    getTotalFraudCost,
    clearFraudLogs,
    getFraudLogs,
} from '@/lib/engine/fraud-n1';

// ============================================
// TEST HELPERS
// ============================================

function createTestState(overrides: Partial<FraudN1State> = {}): FraudN1State {
    return {
        activeActions: [],
        totalReduction: 0,
        capReached: false,
        n2Available: false,
        ...overrides,
    };
}

// ============================================
// INITIALIZATION TESTS
// ============================================

describe('initializeFraudN1State', () => {
    it('should create empty state with no active actions', () => {
        const state = initializeFraudN1State();

        expect(state.activeActions).toEqual([]);
        expect(state.totalReduction).toBe(0);
        expect(state.capReached).toBe(false);
        expect(state.n2Available).toBe(false);
    });
});

// ============================================
// PREREQUISITE TESTS
// ============================================

describe('checkPrerequisites', () => {
    it('should return true for controles_declaratifs (no prerequisites)', () => {
        const state = createTestState();

        expect(checkPrerequisites('controles_declaratifs', state)).toBe(true);
    });

    it('should return false for scoring_dossiers without controles_declaratifs', () => {
        const state = createTestState();

        expect(checkPrerequisites('scoring_dossiers', state)).toBe(false);
    });

    it('test_activateFraudAction_prerequisite_fail: scoring without controles should fail', () => {
        const state = createTestState();
        const result = activateFraudAction('scoring_dossiers', state, 1000, 1);

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('PREREQUISITE_MISSING');
        expect(result.error).toContain('Contrôles déclaratifs');
    });

    it('should return true for scoring_dossiers with controles_declaratifs active', () => {
        const state = createTestState({
            activeActions: ['controles_declaratifs'],
        });

        expect(checkPrerequisites('scoring_dossiers', state)).toBe(true);
    });

    it('should return false for detection_automatique without scoring_dossiers', () => {
        const state = createTestState({
            activeActions: ['controles_declaratifs'],
        });

        expect(checkPrerequisites('detection_automatique', state)).toBe(false);
    });

    it('should return true for detection_automatique with full chain', () => {
        const state = createTestState({
            activeActions: ['controles_declaratifs', 'scoring_dossiers'],
        });

        expect(checkPrerequisites('detection_automatique', state)).toBe(true);
    });
});

describe('getMissingPrerequisites', () => {
    it('should return empty array for controles_declaratifs', () => {
        const state = createTestState();

        expect(getMissingPrerequisites('controles_declaratifs', state)).toEqual([]);
    });

    it('should return controles_declaratifs for scoring_dossiers', () => {
        const state = createTestState();

        expect(getMissingPrerequisites('scoring_dossiers', state)).toEqual(['controles_declaratifs']);
    });

    it('should return scoring_dossiers for detection_automatique (with controles active)', () => {
        const state = createTestState({
            activeActions: ['controles_declaratifs'],
        });

        expect(getMissingPrerequisites('detection_automatique', state)).toEqual(['scoring_dossiers']);
    });
});

// ============================================
// CAP TESTS
// ============================================

describe('checkN1Cap', () => {
    it('should not apply cap when under limit', () => {
        const result = checkN1Cap(2, 2);

        expect(result.cappedEffect).toBe(2);
        expect(result.capApplied).toBe(false);
        expect(result.totalAfter).toBe(4);
    });

    it('should apply cap when exceeding limit', () => {
        const result = checkN1Cap(4, 3);

        expect(result.cappedEffect).toBe(1);
        expect(result.capApplied).toBe(true);
        expect(result.totalAfter).toBe(FRAUD_N1_CAP);
    });

    it('test_checkN1Cap: 4% + 3% should cap to 5%', () => {
        const result = checkN1Cap(4, 3);

        expect(result.totalAfter).toBe(5);
        expect(result.cappedEffect).toBe(1);
        expect(result.capApplied).toBe(true);
    });

    it('should return 0 effect when already at cap', () => {
        const result = checkN1Cap(5, 2);

        expect(result.cappedEffect).toBe(0);
        expect(result.capApplied).toBe(true);
        expect(result.totalAfter).toBe(5);
    });

    it('should allow exactly reaching cap', () => {
        const result = checkN1Cap(3, 2);

        expect(result.cappedEffect).toBe(2);
        expect(result.capApplied).toBe(false);
        expect(result.totalAfter).toBe(5);
    });
});

// ============================================
// EFFECT CALCULATION TESTS
// ============================================

describe('calculateFraudEffect', () => {
    it('should return effect within range for controles_declaratifs', () => {
        const effect = calculateFraudEffect('controles_declaratifs', 42);
        const config = FRAUD_N1_ACTIONS['controles_declaratifs'];

        expect(effect).toBeGreaterThanOrEqual(config.effectRange.min);
        expect(effect).toBeLessThanOrEqual(config.effectRange.max);
    });

    it('should return effect within range for scoring_dossiers', () => {
        const effect = calculateFraudEffect('scoring_dossiers', 42);
        const config = FRAUD_N1_ACTIONS['scoring_dossiers'];

        expect(effect).toBeGreaterThanOrEqual(config.effectRange.min);
        expect(effect).toBeLessThanOrEqual(config.effectRange.max);
    });

    it('should return effect within range for detection_automatique', () => {
        const effect = calculateFraudEffect('detection_automatique', 42);
        const config = FRAUD_N1_ACTIONS['detection_automatique'];

        expect(effect).toBeGreaterThanOrEqual(config.effectRange.min);
        expect(effect).toBeLessThanOrEqual(config.effectRange.max);
    });

    it('should produce deterministic effect with same seed', () => {
        const effect1 = calculateFraudEffect('controles_declaratifs', 123);
        const effect2 = calculateFraudEffect('controles_declaratifs', 123);

        expect(effect1).toBe(effect2);
    });

    it('should produce different effects with different seeds', () => {
        const effect1 = calculateFraudEffect('controles_declaratifs', 1);
        const effect2 = calculateFraudEffect('controles_declaratifs', 2);

        // Very unlikely to be equal with different seeds
        expect(effect1).not.toBe(effect2);
    });
});

// ============================================
// ACTIVATION TESTS
// ============================================

describe('activateFraudAction', () => {
    beforeEach(() => {
        clearFraudLogs();
    });

    it('test_activateFraudAction_success: should activate with sufficient budget and prerequisites', () => {
        const state = createTestState();
        const result = activateFraudAction('controles_declaratifs', state, 100, 1, 42);

        expect(result.success).toBe(true);
        expect(result.newState).toBeDefined();
        expect(result.newState!.activeActions).toContain('controles_declaratifs');
        expect(result.budgetConsumed).toBe(50);
        expect(result.reductionAdded).toBeGreaterThan(0);
    });

    it('should fail when budget is insufficient', () => {
        const state = createTestState();
        const result = activateFraudAction('controles_declaratifs', state, 30, 1);

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('INSUFFICIENT_BUDGET');
        expect(result.error).toContain('Budget insuffisant');
    });

    it('should fail when action is already active', () => {
        const state = createTestState({
            activeActions: ['controles_declaratifs'],
        });
        const result = activateFraudAction('controles_declaratifs', state, 100, 1);

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('ALREADY_ACTIVE');
    });

    it('should activate scoring_dossiers when controles is active', () => {
        const state = createTestState({
            activeActions: ['controles_declaratifs'],
            totalReduction: 1.5,
        });
        const result = activateFraudAction('scoring_dossiers', state, 200, 2, 42);

        expect(result.success).toBe(true);
        expect(result.budgetConsumed).toBe(150);
        expect(result.newState!.activeActions).toContain('scoring_dossiers');
    });

    it('should set capReached when cap is exceeded', () => {
        const state = createTestState({
            activeActions: ['controles_declaratifs', 'scoring_dossiers'],
            totalReduction: 4.5, // Near cap
        });
        const result = activateFraudAction('detection_automatique', state, 300, 3, 42);

        expect(result.success).toBe(true);
        expect(result.newState!.capReached).toBe(true);
        expect(result.newState!.totalReduction).toBe(FRAUD_N1_CAP);
        expect(result.capApplied).toBe(true);
    });

    it('should set n2Available when all N1 actions are active', () => {
        const state = createTestState({
            activeActions: ['controles_declaratifs', 'scoring_dossiers'],
            totalReduction: 3,
        });
        const result = activateFraudAction('detection_automatique', state, 300, 3, 42);

        expect(result.success).toBe(true);
        expect(result.newState!.n2Available).toBe(true);
    });

    it('should log activation', () => {
        const state = createTestState();
        activateFraudAction('controles_declaratifs', state, 100, 1, 42);

        const logs = getFraudLogs();
        expect(logs.length).toBeGreaterThan(0);
        expect(logs[0].type).toBe('activation');
        expect(logs[0].action).toBe('controles_declaratifs');
    });

    it('should log cap_reached when cap is hit', () => {
        const state = createTestState({
            activeActions: ['controles_declaratifs', 'scoring_dossiers'],
            totalReduction: 4.5,
        });
        activateFraudAction('detection_automatique', state, 300, 3, 42);

        const logs = getFraudLogs();
        const capLog = logs.find(l => l.type === 'cap_reached');
        expect(capLog).toBeDefined();
    });
});

// ============================================
// AVAILABILITY TESTS
// ============================================

describe('getAvailableActions', () => {
    it('should return only controles_declaratifs for fresh state', () => {
        const state = createTestState();

        const available = getAvailableActions(state);

        expect(available).toEqual(['controles_declaratifs']);
    });

    it('should return scoring_dossiers when controles is active', () => {
        const state = createTestState({
            activeActions: ['controles_declaratifs'],
        });

        const available = getAvailableActions(state);

        expect(available).toEqual(['scoring_dossiers']);
    });

    it('should return detection_automatique when scoring is active', () => {
        const state = createTestState({
            activeActions: ['controles_declaratifs', 'scoring_dossiers'],
        });

        const available = getAvailableActions(state);

        expect(available).toEqual(['detection_automatique']);
    });

    it('should return empty when all actions are active', () => {
        const state = createTestState({
            activeActions: ['controles_declaratifs', 'scoring_dossiers', 'detection_automatique'],
        });

        const available = getAvailableActions(state);

        expect(available).toEqual([]);
    });
});

// ============================================
// HELPER FUNCTION TESTS
// ============================================

describe('getActionConfig', () => {
    it('should return correct config for each action', () => {
        for (const actionId of FRAUD_N1_ACTION_IDS) {
            const config = getActionConfig(actionId);
            expect(config.actionId).toBe(actionId);
            expect(config.label).toBeDefined();
            expect(config.effectRange.min).toBeLessThanOrEqual(config.effectRange.max);
        }
    });
});

describe('getFraudN1Summary', () => {
    it('should return correct summary for fresh state', () => {
        const state = createTestState();
        const summary = getFraudN1Summary(state);

        expect(summary.activeCount).toBe(0);
        expect(summary.totalCount).toBe(3);
        expect(summary.reduction).toBe(0);
        expect(summary.cap).toBe(FRAUD_N1_CAP);
        expect(summary.capReached).toBe(false);
        expect(summary.n2Badge).toBe(false);
    });

    it('should return correct summary for active state', () => {
        const state = createTestState({
            activeActions: ['controles_declaratifs', 'scoring_dossiers'],
            totalReduction: 3.5,
            capReached: false,
            n2Available: false,
        });
        const summary = getFraudN1Summary(state);

        expect(summary.activeCount).toBe(2);
        expect(summary.reduction).toBe(3.5);
    });
});

describe('getTotalFraudCost', () => {
    it('should return 0 for fresh state', () => {
        const state = createTestState();

        expect(getTotalFraudCost(state)).toBe(0);
    });

    it('should return correct total for active actions', () => {
        const state = createTestState({
            activeActions: ['controles_declaratifs', 'scoring_dossiers'],
        });

        // 50 + 150 = 200
        expect(getTotalFraudCost(state)).toBe(200);
    });

    it('should return full cost when all actions active', () => {
        const state = createTestState({
            activeActions: ['controles_declaratifs', 'scoring_dossiers', 'detection_automatique'],
        });

        // 50 + 150 + 200 = 400
        expect(getTotalFraudCost(state)).toBe(400);
    });
});

// ============================================
// PROPERTY TESTS
// ============================================

describe('Fraud N1 Properties', () => {
    it('PROP-CAP: totalReduction should never exceed FRAUD_N1_CAP', () => {
        // Simulate activating all actions with various seeds
        const seeds = [1, 42, 100, 999, 12345];

        for (const seed of seeds) {
            let state = initializeFraudN1State();

            // Activate all actions in order
            for (const action of FRAUD_N1_ACTION_IDS) {
                const result = activateFraudAction(action, state, 1000, 1, seed + FRAUD_N1_ACTION_IDS.indexOf(action));
                if (result.success && result.newState) {
                    state = result.newState;
                }
            }

            expect(state.totalReduction).toBeLessThanOrEqual(FRAUD_N1_CAP);
        }
    });

    it('PROP-PREREQ: cannot activate action without prerequisites', () => {
        const state = createTestState();

        // Try to activate each action without prerequisites
        const scoringResult = activateFraudAction('scoring_dossiers', state, 1000, 1);
        const detectionResult = activateFraudAction('detection_automatique', state, 1000, 1);

        expect(scoringResult.success).toBe(false);
        expect(scoringResult.errorCode).toBe('PREREQUISITE_MISSING');
        expect(detectionResult.success).toBe(false);
        expect(detectionResult.errorCode).toBe('PREREQUISITE_MISSING');
    });

    it('PROP-BUDGET: budget after action = budget before - costValue', () => {
        const state = createTestState();
        const initialBudget = 500;

        const result = activateFraudAction('controles_declaratifs', state, initialBudget, 1);

        expect(result.success).toBe(true);
        expect(result.budgetConsumed).toBe(FRAUD_N1_ACTIONS['controles_declaratifs'].costValue);

        const remainingBudget = initialBudget - result.budgetConsumed!;
        expect(remainingBudget).toBe(450);
    });
});

// ============================================
// INTEGRATION-STYLE TESTS
// ============================================

describe('Fraud N1 Full Flow', () => {
    beforeEach(() => {
        clearFraudLogs();
    });

    it('test_fraud_effect_on_sp_ratio: activating fraud N1 should reduce S/P', () => {
        let state = initializeFraudN1State();
        let budget = 500;

        // Activate all actions
        for (const action of FRAUD_N1_ACTION_IDS) {
            const result = activateFraudAction(action, state, budget, 1, 42);
            if (result.success && result.newState) {
                state = result.newState;
                budget -= result.budgetConsumed!;
            }
        }

        // S/P reduction should be positive (capped at 5%)
        expect(state.totalReduction).toBeGreaterThan(0);
        expect(state.totalReduction).toBeLessThanOrEqual(FRAUD_N1_CAP);
    });

    it('test_fraud_with_budget_deduction: activating fraud should deduct from budget', () => {
        let state = initializeFraudN1State();
        let budget = 500;
        const initialBudget = budget;

        // Activate first action
        const result = activateFraudAction('controles_declaratifs', state, budget, 1);
        if (result.success) {
            budget -= result.budgetConsumed!;
        }

        expect(budget).toBe(initialBudget - 50);
    });
});
