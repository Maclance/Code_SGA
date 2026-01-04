/**
 * LeverOptions Component Tests
 *
 * @module tests/components/LeverOptions.test
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LeverOptions } from '@/components/game/levers/LeverOptions';
import { LeverOption } from '@/lib/engine';

const mockOptions: LeverOption[] = [
    { id: 'opt1', label: 'Option 1', effects: [] },
    { id: 'opt2', label: 'Option 2', effects: [], meta: { description: 'Desc 2' } }
];

describe('LeverOptions', () => {
    it('should render all options', () => {
        render(<LeverOptions options={mockOptions} onSelect={() => { }} />);

        expect(screen.getByText('Option 1')).toBeDefined();
        expect(screen.getByText('Option 2')).toBeDefined();
        expect(screen.getByText('Desc 2')).toBeDefined();
    });

    it('should select option on click', () => {
        const onSelect = vi.fn();
        render(<LeverOptions options={mockOptions} onSelect={onSelect} />);

        fireEvent.click(screen.getByText('Option 1'));
        expect(onSelect).toHaveBeenCalledWith('opt1');
    });

    it('should display selected state', () => {
        render(<LeverOptions options={mockOptions} selectedOptionId="opt1" onSelect={() => { }} />);

        const opt1Label = screen.getByText('Option 1');
        // Check for checkmark or styling indicating selection
        expect(screen.getByText('✓')).toBeDefined();
        // Since we can't easily check classes in jsdom without helper, specific content check is good
    });

    it('should not trigger onSelect in readOnly mode', () => {
        const onSelect = vi.fn();
        render(<LeverOptions options={mockOptions} onSelect={onSelect} readOnly={true} />);

        fireEvent.click(screen.getByText('Option 1'));
        expect(onSelect).not.toHaveBeenCalled();
    });
});
