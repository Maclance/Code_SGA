/**
 * ProgressiveLevel Component Tests
 *
 * @module tests/components/ProgressiveLevel.test
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProgressiveLevel } from '@/components/game/levers/ProgressiveLevel';
import { LeverLevel, ActiveLeversState } from '@/lib/engine';

// Mock getLevelStatus to control state without complex engine logic
vi.mock('@/lib/engine', async () => {
    const actual = await vi.importActual('@/lib/engine');
    return {
        ...actual,
        // We will mock the behavior via props manipulation in tests
        // But since the component uses the imported function, we need to mock it if we want to force states
        // Alternatively, we provide props that result in desired states using valid engine logic
    };
});

const mockLevels: Record<string, LeverLevel> = {
    N1: { id: 'N1', cost: { budgetUnits: 1, recurring: false }, effects: [], description: 'Level 1' },
    N2: { id: 'N2', cost: { budgetUnits: 2, recurring: false }, effects: [], description: 'Level 2', prerequisites: [{ type: 'lever_level', target: 'L1', value: 'N1' }] }
};

describe('ProgressiveLevel', () => {
    it('should render all levels', () => {
        render(
            <ProgressiveLevel
                leverId="L1"
                levels={mockLevels}
                activeLevers={{}}
                onSelectLevel={() => { }}
            />
        );

        expect(screen.getByText('N1')).toBeDefined();
        expect(screen.getByText('N2')).toBeDefined();
        expect(screen.getByText('Level 1')).toBeDefined();
    });

    it('should mark acquired level', () => {
        render(
            <ProgressiveLevel
                leverId="L1"
                levels={mockLevels}
                activeLevers={{ 'L1': 'N1' }}
                onSelectLevel={() => { }}
            />
        );

        // Acquired level should have checkmark or specific text
        expect(screen.getAllByText('Acquis')).toBeDefined(); // FR default
    });

    it('should allow clicking available level', () => {
        const onSelect = vi.fn();
        render(
            <ProgressiveLevel
                leverId="L1"
                levels={mockLevels}
                activeLevers={{}} // N1 is available by default (no prereqs)
                onSelectLevel={onSelect}
            />
        );

        fireEvent.click(screen.getByText('N1'));
        expect(onSelect).toHaveBeenCalledWith('N1');
    });

    it('should disable locked level', () => {
        const onSelect = vi.fn();
        render(
            <ProgressiveLevel
                leverId="L1"
                levels={mockLevels}
                activeLevers={{}} // N2 requires N1, so N2 is locked
                onSelectLevel={onSelect}
            />
        );

        fireEvent.click(screen.getByText('N2'));
        expect(onSelect).not.toHaveBeenCalled();
    });
});
