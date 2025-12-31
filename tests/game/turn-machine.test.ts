/**
 * Turn Machine Unit Tests
 * 
 * @module tests/game/turn-machine.test
 * @description Unit tests for turn state machine (US-014)
 */

import { describe, it, expect } from 'vitest';
import {
    TurnPhase,
    PHASE_ORDER,
    nextPhase,
    previousPhase,
    canTransition,
    getPhaseIndex,
    getPhaseConfig,
    isFirstPhase,
    isLastPhase,
    createTurnContext,
    advancePhase,
    addDecision,
    removeDecision,
    clearDecisions,
    isFinalTurn,
    type TurnContext,
    type TurnStateSnapshot,
} from '@/lib/game/turn-machine';

// ============================================
// TEST HELPERS
// ============================================

function createDefaultSnapshot(): TurnStateSnapshot {
    return {
        indices: {
            IAC: 60,
            IPQO: 60,
            IERH: 60,
            IRF: 60,
            IMD: 45,
            IS: 70,
            IPP: 55,
        },
        pnl: {
            primes: 50_000_000,
            sinistres: 32_500_000,
            frais: 12_500_000,
            produits_financiers: 1_500_000,
            resultat: 6_500_000,
        },
    };
}

// ============================================
// PHASE ORDER TESTS
// ============================================

describe('PHASE_ORDER', () => {
    it('should have 5 phases in correct order', () => {
        expect(PHASE_ORDER).toHaveLength(5);
        expect(PHASE_ORDER[0]).toBe(TurnPhase.DASHBOARD);
        expect(PHASE_ORDER[1]).toBe(TurnPhase.EVENTS);
        expect(PHASE_ORDER[2]).toBe(TurnPhase.DECISIONS);
        expect(PHASE_ORDER[3]).toBe(TurnPhase.RESOLUTION);
        expect(PHASE_ORDER[4]).toBe(TurnPhase.FEEDBACK);
    });
});

// ============================================
// nextPhase TESTS
// ============================================

describe('nextPhase', () => {
    it('should return EVENTS after DASHBOARD', () => {
        expect(nextPhase(TurnPhase.DASHBOARD)).toBe(TurnPhase.EVENTS);
    });

    it('should return DECISIONS after EVENTS', () => {
        expect(nextPhase(TurnPhase.EVENTS)).toBe(TurnPhase.DECISIONS);
    });

    it('should return RESOLUTION after DECISIONS', () => {
        expect(nextPhase(TurnPhase.DECISIONS)).toBe(TurnPhase.RESOLUTION);
    });

    it('should return FEEDBACK after RESOLUTION', () => {
        expect(nextPhase(TurnPhase.RESOLUTION)).toBe(TurnPhase.FEEDBACK);
    });

    it('should return null after FEEDBACK (end of turn)', () => {
        expect(nextPhase(TurnPhase.FEEDBACK)).toBeNull();
    });

    it('should traverse full sequence: DASHBOARD → EVENTS → DECISIONS → RESOLUTION → FEEDBACK', () => {
        let phase: TurnPhase | null = TurnPhase.DASHBOARD;
        const visited: TurnPhase[] = [];

        while (phase !== null) {
            visited.push(phase);
            phase = nextPhase(phase);
        }

        expect(visited).toEqual([
            TurnPhase.DASHBOARD,
            TurnPhase.EVENTS,
            TurnPhase.DECISIONS,
            TurnPhase.RESOLUTION,
            TurnPhase.FEEDBACK,
        ]);
    });
});

// ============================================
// previousPhase TESTS
// ============================================

describe('previousPhase', () => {
    it('should return null before DASHBOARD', () => {
        expect(previousPhase(TurnPhase.DASHBOARD)).toBeNull();
    });

    it('should return DASHBOARD before EVENTS', () => {
        expect(previousPhase(TurnPhase.EVENTS)).toBe(TurnPhase.DASHBOARD);
    });

    it('should return RESOLUTION before FEEDBACK', () => {
        expect(previousPhase(TurnPhase.FEEDBACK)).toBe(TurnPhase.RESOLUTION);
    });
});

// ============================================
// canTransition TESTS
// ============================================

describe('canTransition', () => {
    it('should allow transition from DASHBOARD to EVENTS', () => {
        expect(canTransition(TurnPhase.DASHBOARD, TurnPhase.EVENTS)).toBe(true);
    });

    it('should allow transition from EVENTS to DECISIONS', () => {
        expect(canTransition(TurnPhase.EVENTS, TurnPhase.DECISIONS)).toBe(true);
    });

    it('should allow transition from DECISIONS to RESOLUTION', () => {
        expect(canTransition(TurnPhase.DECISIONS, TurnPhase.RESOLUTION)).toBe(true);
    });

    it('should allow transition from RESOLUTION to FEEDBACK', () => {
        expect(canTransition(TurnPhase.RESOLUTION, TurnPhase.FEEDBACK)).toBe(true);
    });

    it('should NOT allow backward transition from EVENTS to DASHBOARD', () => {
        expect(canTransition(TurnPhase.EVENTS, TurnPhase.DASHBOARD)).toBe(false);
    });

    it('should NOT allow backward transition from FEEDBACK to EVENTS', () => {
        expect(canTransition(TurnPhase.FEEDBACK, TurnPhase.EVENTS)).toBe(false);
    });

    it('should NOT allow skipping phases (DASHBOARD to DECISIONS)', () => {
        expect(canTransition(TurnPhase.DASHBOARD, TurnPhase.DECISIONS)).toBe(false);
    });

    it('should NOT allow skipping phases (EVENTS to RESOLUTION)', () => {
        expect(canTransition(TurnPhase.EVENTS, TurnPhase.RESOLUTION)).toBe(false);
    });

    it('should NOT allow same phase transition', () => {
        expect(canTransition(TurnPhase.DASHBOARD, TurnPhase.DASHBOARD)).toBe(false);
    });
});

// ============================================
// getPhaseIndex TESTS
// ============================================

describe('getPhaseIndex', () => {
    it('should return 0 for DASHBOARD', () => {
        expect(getPhaseIndex(TurnPhase.DASHBOARD)).toBe(0);
    });

    it('should return 4 for FEEDBACK', () => {
        expect(getPhaseIndex(TurnPhase.FEEDBACK)).toBe(4);
    });
});

// ============================================
// isFirstPhase / isLastPhase TESTS
// ============================================

describe('isFirstPhase', () => {
    it('should return true for DASHBOARD', () => {
        expect(isFirstPhase(TurnPhase.DASHBOARD)).toBe(true);
    });

    it('should return false for other phases', () => {
        expect(isFirstPhase(TurnPhase.EVENTS)).toBe(false);
        expect(isFirstPhase(TurnPhase.FEEDBACK)).toBe(false);
    });
});

describe('isLastPhase', () => {
    it('should return true for FEEDBACK', () => {
        expect(isLastPhase(TurnPhase.FEEDBACK)).toBe(true);
    });

    it('should return false for other phases', () => {
        expect(isLastPhase(TurnPhase.DASHBOARD)).toBe(false);
        expect(isLastPhase(TurnPhase.RESOLUTION)).toBe(false);
    });
});

// ============================================
// getPhaseConfig TESTS
// ============================================

describe('getPhaseConfig', () => {
    it('should return config for DASHBOARD', () => {
        const config = getPhaseConfig(TurnPhase.DASHBOARD);
        expect(config.name).toBe('Tableau de bord');
        expect(config.allowsDecisions).toBe(false);
        expect(config.requiresApiCall).toBe(false);
    });

    it('should return config for DECISIONS with allowsDecisions=true', () => {
        const config = getPhaseConfig(TurnPhase.DECISIONS);
        expect(config.allowsDecisions).toBe(true);
    });

    it('should return config for RESOLUTION with requiresApiCall=true', () => {
        const config = getPhaseConfig(TurnPhase.RESOLUTION);
        expect(config.requiresApiCall).toBe(true);
    });
});

// ============================================
// CONTEXT HELPER TESTS
// ============================================

describe('createTurnContext', () => {
    it('should create context with default phase as DASHBOARD', () => {
        const snapshot = createDefaultSnapshot();
        const context = createTurnContext('session-123', 1, 12, snapshot, 42);

        expect(context.sessionId).toBe('session-123');
        expect(context.turnNumber).toBe(1);
        expect(context.maxTurns).toBe(12);
        expect(context.phase).toBe(TurnPhase.DASHBOARD);
        expect(context.seed).toBe(42);
        expect(context.pendingDecisions).toEqual([]);
        expect(context.activeEvents).toEqual([]);
    });
});

describe('advancePhase', () => {
    it('should advance context phase', () => {
        const snapshot = createDefaultSnapshot();
        const context = createTurnContext('session-123', 1, 12, snapshot, 42);

        const advanced = advancePhase(context);

        expect(advanced).not.toBeNull();
        expect(advanced!.phase).toBe(TurnPhase.EVENTS);
    });

    it('should return null when at FEEDBACK', () => {
        const snapshot = createDefaultSnapshot();
        const context = createTurnContext('session-123', 1, 12, snapshot, 42);
        context.phase = TurnPhase.FEEDBACK;

        const advanced = advancePhase(context);

        expect(advanced).toBeNull();
    });
});

describe('isFinalTurn', () => {
    it('should return true when turnNumber equals maxTurns', () => {
        const snapshot = createDefaultSnapshot();
        const context = createTurnContext('session-123', 12, 12, snapshot, 42);

        expect(isFinalTurn(context)).toBe(true);
    });

    it('should return true when turnNumber exceeds maxTurns', () => {
        const snapshot = createDefaultSnapshot();
        const context = createTurnContext('session-123', 13, 12, snapshot, 42);

        expect(isFinalTurn(context)).toBe(true);
    });

    it('should return false when turnNumber is less than maxTurns', () => {
        const snapshot = createDefaultSnapshot();
        const context = createTurnContext('session-123', 5, 12, snapshot, 42);

        expect(isFinalTurn(context)).toBe(false);
    });
});

// ============================================
// DECISION MANAGEMENT TESTS
// ============================================

describe('addDecision', () => {
    it('should add decision to context', () => {
        const snapshot = createDefaultSnapshot();
        const context = createTurnContext('session-123', 1, 12, snapshot, 42);

        const updated = addDecision(context, {
            leverId: 'LEV-TAR-01',
            value: -5,
            productId: 'auto',
        });

        expect(updated.pendingDecisions).toHaveLength(1);
        expect(updated.pendingDecisions[0].leverId).toBe('LEV-TAR-01');
    });

    it('should not mutate original context', () => {
        const snapshot = createDefaultSnapshot();
        const context = createTurnContext('session-123', 1, 12, snapshot, 42);

        addDecision(context, { leverId: 'LEV-TAR-01', value: -5 });

        expect(context.pendingDecisions).toHaveLength(0);
    });
});

describe('removeDecision', () => {
    it('should remove decision by leverId', () => {
        const snapshot = createDefaultSnapshot();
        let context = createTurnContext('session-123', 1, 12, snapshot, 42);
        context = addDecision(context, { leverId: 'LEV-TAR-01', value: -5 });
        context = addDecision(context, { leverId: 'LEV-RH-01', value: 10 });

        const updated = removeDecision(context, 'LEV-TAR-01');

        expect(updated.pendingDecisions).toHaveLength(1);
        expect(updated.pendingDecisions[0].leverId).toBe('LEV-RH-01');
    });
});

describe('clearDecisions', () => {
    it('should clear all decisions', () => {
        const snapshot = createDefaultSnapshot();
        let context = createTurnContext('session-123', 1, 12, snapshot, 42);
        context = addDecision(context, { leverId: 'LEV-TAR-01', value: -5 });
        context = addDecision(context, { leverId: 'LEV-RH-01', value: 10 });

        const updated = clearDecisions(context);

        expect(updated.pendingDecisions).toHaveLength(0);
    });
});
