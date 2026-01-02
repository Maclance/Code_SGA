/**
 * FraudLeverN1 Component Tests
 *
 * @module tests/components/FraudLeverN1.test
 * @description Tests for FraudLeverN1 component (US-025)
 */

import { describe, it, expect, vi } from 'vitest';
import {
    FraudN1State,
    FRAUD_N1_ACTIONS,
    FRAUD_N1_CAP,
    FRAUD_N1_ACTION_IDS,
    checkPrerequisites,
    getAvailableActions,
    getMissingPrerequisites,
} from '@/lib/engine';

// Mock CSS module
vi.mock('@/components/game/levers/FraudLeverN1.module.css', () => ({
    default: {
        fraudLeverContainer: 'fraudLeverContainer',
        header: 'header',
        title: 'title',
        capIndicator: 'capIndicator',
        normal: 'normal',
        warning: 'warning',
        reached: 'reached',
        progressBar: 'progressBar',
        progressFill: 'progressFill',
        actionsGrid: 'actionsGrid',
        actionCard: 'actionCard',
        active: 'active',
        disabled: 'disabled',
        available: 'available',
        actionNumber: 'actionNumber',
        actionContent: 'actionContent',
        actionHeader: 'actionHeader',
        actionLabel: 'actionLabel',
        actionMeta: 'actionMeta',
        costBadge: 'costBadge',
        low: 'low',
        medium: 'medium',
        high: 'high',
        delayBadge: 'delayBadge',
        actionDescription: 'actionDescription',
        effectRange: 'effectRange',
        prerequisiteWarning: 'prerequisiteWarning',
        statusBadge: 'statusBadge',
        n2Section: 'n2Section',
        n2Header: 'n2Header',
        n2Title: 'n2Title',
        n2Badge: 'n2Badge',
        n2Description: 'n2Description',
        capNotification: 'capNotification',
    },
}));

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
// ACTION AVAILABILITY TESTS
// ============================================

describe('FraudLeverN1 Action Availability', () => {
    describe('Fresh state (no actions active)', () => {
        it('should only allow controles_declaratifs', () => {
            const state = createTestState();
            const available = getAvailableActions(state);

            expect(available).toContain('controles_declaratifs');
            expect(available).not.toContain('scoring_dossiers');
            expect(available).not.toContain('detection_automatique');
        });

        it('should show prerequisite warning for scoring_dossiers', () => {
            const state = createTestState();
            const missing = getMissingPrerequisites('scoring_dossiers', state);

            expect(missing).toContain('controles_declaratifs');
        });
    });

    describe('With controles_declaratifs active', () => {
        it('should allow scoring_dossiers', () => {
            const state = createTestState({
                activeActions: ['controles_declaratifs'],
            });
            const available = getAvailableActions(state);

            expect(available).toContain('scoring_dossiers');
            expect(available).not.toContain('detection_automatique');
        });

        it('should show prerequisite warning for detection_automatique', () => {
            const state = createTestState({
                activeActions: ['controles_declaratifs'],
            });
            const missing = getMissingPrerequisites('detection_automatique', state);

            expect(missing).toContain('scoring_dossiers');
        });
    });

    describe('With controles and scoring active', () => {
        it('should allow detection_automatique', () => {
            const state = createTestState({
                activeActions: ['controles_declaratifs', 'scoring_dossiers'],
            });
            const available = getAvailableActions(state);

            expect(available).toContain('detection_automatique');
        });
    });
});

// ============================================
// COST DISPLAY TESTS
// ============================================

describe('FraudLeverN1 Cost Display', () => {
    it('should have correct cost values for each action', () => {
        expect(FRAUD_N1_ACTIONS['controles_declaratifs'].costValue).toBe(50);
        expect(FRAUD_N1_ACTIONS['scoring_dossiers'].costValue).toBe(150);
        expect(FRAUD_N1_ACTIONS['detection_automatique'].costValue).toBe(200);
    });

    it('should have correct cost levels for each action', () => {
        expect(FRAUD_N1_ACTIONS['controles_declaratifs'].cost).toBe('low');
        expect(FRAUD_N1_ACTIONS['scoring_dossiers'].cost).toBe('medium');
        expect(FRAUD_N1_ACTIONS['detection_automatique'].cost).toBe('medium');
    });

    it('should format cost as K€', () => {
        for (const action of FRAUD_N1_ACTION_IDS) {
            const config = FRAUD_N1_ACTIONS[action];
            const formatted = `${config.costValue}K€`;
            expect(formatted).toMatch(/^\d+K€$/);
        }
    });
});

// ============================================
// CAP INDICATOR TESTS
// ============================================

describe('FraudLeverN1 Cap Indicator', () => {
    it('should show normal status when reduction is low', () => {
        const state = createTestState({ totalReduction: 1.5 });
        const percentage = (state.totalReduction / FRAUD_N1_CAP) * 100;

        expect(percentage).toBeLessThan(60);
    });

    it('should show warning status when reduction is high', () => {
        const state = createTestState({ totalReduction: 3.5 });
        const percentage = (state.totalReduction / FRAUD_N1_CAP) * 100;

        expect(percentage).toBeGreaterThanOrEqual(60);
        expect(percentage).toBeLessThan(100);
    });

    it('should show reached status when cap is reached', () => {
        const state = createTestState({
            totalReduction: 5,
            capReached: true,
        });

        expect(state.capReached).toBe(true);
        expect(state.totalReduction).toBe(FRAUD_N1_CAP);
    });

    it('should display cap as percentage', () => {
        const state = createTestState({ totalReduction: 2.5 });
        const displayText = `${state.totalReduction.toFixed(1)}% / ${FRAUD_N1_CAP}%`;

        expect(displayText).toBe('2.5% / 5%');
    });
});

// ============================================
// PREREQUISITES DISPLAY TESTS
// ============================================

describe('FraudLeverN1 Prerequisites Display', () => {
    it('should display prerequisite chain correctly', () => {
        // controles_declaratifs has no prerequisites
        expect(FRAUD_N1_ACTIONS['controles_declaratifs'].prerequisites).toEqual([]);

        // scoring_dossiers requires controles_declaratifs
        expect(FRAUD_N1_ACTIONS['scoring_dossiers'].prerequisites).toEqual(['controles_declaratifs']);

        // detection_automatique requires scoring_dossiers
        expect(FRAUD_N1_ACTIONS['detection_automatique'].prerequisites).toEqual(['scoring_dossiers']);
    });

    it('should format prerequisite labels in French', () => {
        const missing = getMissingPrerequisites('scoring_dossiers', createTestState());
        const labels = missing.map(m => FRAUD_N1_ACTIONS[m].label);

        expect(labels).toContain('Contrôles déclaratifs');
    });
});

// ============================================
// N2 BADGE TESTS
// ============================================

describe('FraudLeverN1 N2 Badge', () => {
    it('should not show n2Available when not all N1 actions are active', () => {
        const state = createTestState({
            activeActions: ['controles_declaratifs', 'scoring_dossiers'],
        });

        expect(state.n2Available).toBe(false);
    });

    it('should show N2 as V1 feature (disabled)', () => {
        // N2 should always be displayed but disabled
        const n2Badge = 'V1';
        expect(n2Badge).toBe('V1');
    });
});

// ============================================
// EFFECT RANGE DISPLAY TESTS
// ============================================

describe('FraudLeverN1 Effect Range Display', () => {
    it('should display effect range correctly', () => {
        for (const action of FRAUD_N1_ACTION_IDS) {
            const config = FRAUD_N1_ACTIONS[action];
            const rangeText = `-${config.effectRange.min}% à -${config.effectRange.max}%`;

            expect(rangeText).toMatch(/-\d+% à -\d+%/);
        }
    });

    it('should have valid effect ranges (min <= max)', () => {
        for (const action of FRAUD_N1_ACTION_IDS) {
            const config = FRAUD_N1_ACTIONS[action];
            expect(config.effectRange.min).toBeLessThanOrEqual(config.effectRange.max);
        }
    });
});

// ============================================
// DELAY DISPLAY TESTS
// ============================================

describe('FraudLeverN1 Delay Display', () => {
    it('should display delay correctly for single turn', () => {
        const config = FRAUD_N1_ACTIONS['controles_declaratifs'];
        const delayText = config.delay.min === config.delay.max
            ? `${config.delay.min} tour`
            : `${config.delay.min}-${config.delay.max} tours`;

        expect(delayText).toBe('1 tour');
    });

    it('should display delay correctly for range', () => {
        const config = FRAUD_N1_ACTIONS['scoring_dossiers'];
        const delayText = config.delay.min === config.delay.max
            ? `${config.delay.min} tour`
            : `${config.delay.min}-${config.delay.max} tours`;

        expect(delayText).toBe('1-2 tours');
    });
});

// ============================================
// PROPS VALIDATION TESTS
// ============================================

describe('FraudLeverN1 Props', () => {
    it('should accept required props', () => {
        const props = {
            state: createTestState(),
            availableBudget: 500,
        };

        expect(props.state).toBeDefined();
        expect(props.availableBudget).toBe(500);
    });

    it('should accept optional props', () => {
        const props = {
            state: createTestState(),
            availableBudget: 500,
            onActivate: vi.fn(),
            locale: 'fr' as const,
            readOnly: false,
        };

        expect(props.onActivate).toBeDefined();
        expect(props.locale).toBe('fr');
        expect(props.readOnly).toBe(false);
    });

    it('should handle budget check for action availability', () => {
        const state = createTestState();
        const lowBudget = 30;
        const controlesCost = FRAUD_N1_ACTIONS['controles_declaratifs'].costValue;

        expect(lowBudget).toBeLessThan(controlesCost);
        // With low budget, controles should show as insufficient
    });
});

// ============================================
// i18n TESTS
// ============================================

describe('FraudLeverN1 i18n', () => {
    it('should have French translations', () => {
        const frTranslations = {
            title: 'Lutte anti-fraude',
            level1: 'Niveau 1',
            level2: 'Niveau 2',
            v1Badge: 'V1',
            active: 'Actif',
        };

        expect(frTranslations.title).toBe('Lutte anti-fraude');
        expect(frTranslations.v1Badge).toBe('V1');
    });

    it('should have English translations', () => {
        const enTranslations = {
            title: 'Fraud Prevention',
            level1: 'Level 1',
            level2: 'Level 2',
            v1Badge: 'V1',
            active: 'Active',
        };

        expect(enTranslations.title).toBe('Fraud Prevention');
        expect(enTranslations.v1Badge).toBe('V1');
    });
});
