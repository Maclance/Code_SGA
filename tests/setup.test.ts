/**
 * Sample test to validate Vitest configuration
 * This test ensures the testing framework is properly set up
 */

import { describe, it, expect } from 'vitest';

describe('Vitest Configuration', () => {
    describe('Basic functionality', () => {
        it('should run a simple test', () => {
            expect(1 + 1).toBe(2);
        });

        it('should support async tests', async () => {
            const result = await Promise.resolve('success');
            expect(result).toBe('success');
        });
    });

    describe('Array utilities', () => {
        it('should work with array matchers', () => {
            const items = [1, 2, 3];
            expect(items).toHaveLength(3);
            expect(items).toContain(2);
        });
    });

    describe('Object utilities', () => {
        it('should work with object matchers', () => {
            const user = { name: 'Test', role: 'joueur' };
            expect(user).toHaveProperty('name');
            expect(user).toMatchObject({ role: 'joueur' });
        });
    });
});

describe('Types validation', () => {
    it('should handle TypeScript types correctly', () => {
        interface IndiceValeur {
            type: string;
            valeur: number;
        }

        const indice: IndiceValeur = {
            type: 'IAC',
            valeur: 75,
        };

        expect(indice.valeur).toBeGreaterThanOrEqual(0);
        expect(indice.valeur).toBeLessThanOrEqual(100);
    });
});
