/**
 * LeverCard Integration Tests
 *
 * @module tests/components/LeverCard.test
 * @description Integration tests for LeverCard with options and progressive levels
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LeverCard } from '@/components/game/decisions/LeverCard';
import type { LeverGatingConfig, LeverWithOptions, LeverWithLevels } from '@/lib/engine';

// Mock sub-components if needed, or rely on them (integration test)
// For deep integration, we use real sub-components.

const leverWithOptions: LeverGatingConfig & LeverWithOptions = {
    id: 'LEV-OPT',
    name: 'Option Lever',
    category: 'PRODUIT_TARIFICATION',
    minDifficulty: 'novice',
    cost: { budgetUnits: 1, recurring: false },
    description: 'Desc',
    delay: 1,
    impactPreview: { target: 'IAC', type: 'mixed', description: 'Impact' },
    options: [
        { id: 'opt1', label: 'Option 1', effects: [], value: 10, type: 'absolute', target: 'IAC' }, // Simplified mock of effect definition
        { id: 'opt2', label: 'Option 2', effects: [] }
    ]
} as any; // Cast to avoid strict typing on every prop during mock

const leverWithLevels: LeverGatingConfig & LeverWithLevels = {
    id: 'LEV-PROG',
    name: 'Progressive Lever',
    category: 'IT_DATA',
    minDifficulty: 'novice',
    cost: { budgetUnits: 1, recurring: false },
    description: 'Desc',
    delay: 1,
    impactPreview: { target: 'IMD', type: 'positive', description: 'Impact' },
    levels: {
        N1: { id: 'N1', cost: { budgetUnits: 1, recurring: false }, effects: [], description: 'L1' },
        N2: { id: 'N2', cost: { budgetUnits: 2, recurring: false }, effects: [], description: 'L2', prerequisites: [{ type: 'lever_level', target: 'LEV-PROG', value: 'N1' }] }
    }
} as any;

describe('LeverCard Integration', () => {
    it('should render LeverOptions for option-based lever', () => {
        render(
            <LeverCard
                lever={leverWithOptions}
                available={true}
                requiredDifficulty="novice"
                onSelect={() => { }}
            />
        );

        expect(screen.getByText('Option 1')).toBeDefined();
        expect(screen.getByText('Option 2')).toBeDefined();
    });

    it('should render ProgressiveLevel for progressive lever', () => {
        render(
            <LeverCard
                lever={leverWithLevels}
                available={true}
                requiredDifficulty="novice"
                onSelect={() => { }}
                activeLevers={{}}
            />
        );

        expect(screen.getByText('N1')).toBeDefined();
        expect(screen.getByText('N2')).toBeDefined();
    });

    it('should call onValueChange when option selected', () => {
        const onValueChange = vi.fn();
        render(
            <LeverCard
                lever={leverWithOptions}
                available={true}
                requiredDifficulty="novice"
                onSelect={() => { }}
                onValueChange={onValueChange}
            />
        );

        fireEvent.click(screen.getByText('Option 1'));
        expect(onValueChange).toHaveBeenCalledWith('LEV-OPT', 'opt1');
    });

    it('should call onValueChange when level selected', () => {
        const onValueChange = vi.fn();
        render(
            <LeverCard
                lever={leverWithLevels}
                available={true}
                requiredDifficulty="novice"
                onSelect={() => { }}
                onValueChange={onValueChange}
                activeLevers={{}} // N1 available
            />
        );

        fireEvent.click(screen.getByText('N1'));
        expect(onValueChange).toHaveBeenCalledWith('LEV-PROG', 'N1');
    });

    it('should not render options if lever is basic', () => {
        const basicLever: LeverGatingConfig = {
            id: 'LEV-BASIC',
            name: 'Basic',
            category: 'RH',
            minDifficulty: 'novice',
            cost: { budgetUnits: 1, recurring: false },
            description: 'Desc',
            delay: 0,
            impactPreview: { description: 'Impact', type: 'positive', target: 'IERH' }
        };

        render(
            <LeverCard
                lever={basicLever}
                available={true}
                requiredDifficulty="novice"
                onSelect={() => { }}
            />
        );

        // Should standard checkmark logic (not tested here deeply, but ensure no "Option 1" etc)
        expect(screen.queryByText('Option 1')).toBeNull();
    });
});
