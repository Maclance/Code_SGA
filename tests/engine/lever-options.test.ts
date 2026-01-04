/**
 * Lever Options Logic Tests
 *
 * @module tests/engine/lever-options.test
 * @description Unit tests for lever options logic and prerequisite checking (US-035)
 */

import { describe, it, expect } from 'vitest';
import {
    resolveLeverEffects,
    checkLevelPrerequisites,
    getLevelStatus,
    getLevelMissingPrerequisites
} from '@/lib/engine';
import type {
    LeverGatingConfig,
    LeverWithOptions,
    LeverWithLevels,
    LeverAction,
    ActiveLeversState,
    IndicesState
} from '@/lib/engine';

// ============================================
// DATA MOCKS
// ============================================

const mockIndices: IndicesState = {
    IAC: 60, IPQO: 60, IERH: 60, IRF: 60, IMD: 50, IS: 70, IPP: 55
};

const leverWithOptions: LeverGatingConfig & LeverWithOptions = {
    id: 'LEV-OPT',
    name: 'Option Lever',
    category: 'PRODUIT_TARIFICATION',
    minDifficulty: 'novice',
    cost: { budgetUnits: 1, recurring: false },
    description: 'Test lever with options',
    impactPreview: { target: 'IAC', type: 'mixed', description: 'Impact' },
    options: [
        {
            id: 'opt1',
            label: 'Option 1',
            effects: [{ target: 'IAC', type: 'absolute', value: 10, delay: 0 }]
        },
        {
            id: 'opt2',
            label: 'Option 2',
            effects: [{ target: 'IAC', type: 'absolute', value: 20, delay: 0 }]
        }
    ]
};

const leverWithLevels: LeverGatingConfig & LeverWithLevels = {
    id: 'LEV-PROG',
    name: 'Progressive Lever',
    category: 'IT_DATA',
    minDifficulty: 'novice',
    cost: { budgetUnits: 1, recurring: false },
    description: 'Test progressive lever',
    impactPreview: { target: 'IMD', type: 'positive', description: 'Impact' },
    levels: {
        N1: {
            id: 'N1',
            cost: { budgetUnits: 1, recurring: false },
            effects: [{ target: 'IMD', type: 'absolute', value: 5, delay: 1 }],
            description: 'Level 1'
        },
        N2: {
            id: 'N2',
            cost: { budgetUnits: 2, recurring: false },
            effects: [{ target: 'IMD', type: 'absolute', value: 10, delay: 2 }],
            description: 'Level 2',
            prerequisites: [
                { type: 'lever_level', target: 'LEV-PROG', value: 'N1' }
            ]
        },
        N3: {
            id: 'N3',
            cost: { budgetUnits: 3, recurring: false },
            effects: [{ target: 'IMD', type: 'absolute', value: 15, delay: 3 }],
            description: 'Level 3',
            prerequisites: [
                { type: 'lever_level', target: 'LEV-PROG', value: 'N2' },
                { type: 'index_min', target: 'IMD', value: 60 }
            ]
        }
    }
};

// ============================================
// TESTS
// ============================================

describe('resolveLeverEffects', () => {
    it('should return empty effects if no option selected', () => {
        const action: LeverAction = { leverId: 'LEV-OPT' };
        const effects = resolveLeverEffects(leverWithOptions, action);
        expect(effects).toHaveLength(0);
    });

    it('should return simple option effects', () => {
        const action: LeverAction = { leverId: 'LEV-OPT', optionId: 'opt1' };
        const effects = resolveLeverEffects(leverWithOptions, action);

        expect(effects).toHaveLength(1);
        expect(effects[0].value).toBe(10);
    });

    it('should return specific level effects', () => {
        const action: LeverAction = { leverId: 'LEV-PROG', levelId: 'N2' };
        const effects = resolveLeverEffects(leverWithLevels, action);

        expect(effects).toHaveLength(1);
        expect(effects[0].value).toBe(10);
        expect(effects[0].delay).toBe(2);
    });
});

describe('checkLevelPrerequisites', () => {
    it('should pass if no prerequisites', () => {
        const n1 = leverWithLevels.levels.N1;
        const result = checkLevelPrerequisites(n1, {});
        expect(result).toBe(true);
    });

    it('should fail if lever level requirement not met', () => {
        const n2 = leverWithLevels.levels.N2;
        const result = checkLevelPrerequisites(n2, {}); // No active levers
        expect(result).toBe(false);
    });

    it('should pass if lever level requirement met', () => {
        const n2 = leverWithLevels.levels.N2;
        const active: ActiveLeversState = { 'LEV-PROG': 'N1' };
        const result = checkLevelPrerequisites(n2, active);
        expect(result).toBe(true);
    });

    it('should fail if index requirement not met', () => {
        const n3 = leverWithLevels.levels.N3;
        const active: ActiveLeversState = { 'LEV-PROG': 'N2' };
        const indices = { ...mockIndices, IMD: 50 }; // N3 needs 60

        const result = checkLevelPrerequisites(n3, active, indices);
        expect(result).toBe(false);
    });

    it('should pass if all requirements met', () => {
        const n3 = leverWithLevels.levels.N3;
        const active: ActiveLeversState = { 'LEV-PROG': 'N2' };
        const indices = { ...mockIndices, IMD: 65 }; // > 60

        const result = checkLevelPrerequisites(n3, active, indices);
        expect(result).toBe(true);
    });
});

describe('getLevelStatus', () => {
    it('should detect acquired level (exact match)', () => {
        const active: ActiveLeversState = { 'LEV-PROG': 'N1' };
        const status = getLevelStatus('LEV-PROG', 'N1', active, leverWithLevels.levels.N1);
        expect(status).toBe('acquired');
    });

    it('should detect acquired level (lower than active)', () => {
        const active: ActiveLeversState = { 'LEV-PROG': 'N2' };
        const status = getLevelStatus('LEV-PROG', 'N1', active, leverWithLevels.levels.N1);
        expect(status).toBe('acquired');
    });

    it('should detect available level', () => {
        const active: ActiveLeversState = { 'LEV-PROG': 'N1' };
        const status = getLevelStatus('LEV-PROG', 'N2', active, leverWithLevels.levels.N2);
        expect(status).toBe('available');
    });

    it('should detect locked level', () => {
        const active: ActiveLeversState = { 'LEV-PROG': 'N1' };
        // N3 requires N2, but we only have N1
        const status = getLevelStatus('LEV-PROG', 'N3', active, leverWithLevels.levels.N3, mockIndices);
        expect(status).toBe('locked');
    });
});

describe('getLevelMissingPrerequisites', () => {
    it('should list missing lever prerequisite', () => {
        const n2 = leverWithLevels.levels.N2;
        const messages = getLevelMissingPrerequisites(n2, {});

        expect(messages).toHaveLength(1);
        expect(messages[0]).toContain('Levier LEV-PROG niveau N1 requis');
    });

    it('should list missing index prerequisite', () => {
        const n3 = leverWithLevels.levels.N3;
        const active: ActiveLeversState = { 'LEV-PROG': 'N2' };
        const indices = { ...mockIndices, IMD: 50 };

        const messages = getLevelMissingPrerequisites(n3, active, indices);

        expect(messages).toHaveLength(1);
        expect(messages[0]).toContain('Indice IMD >= 60 requis');
    });
});
