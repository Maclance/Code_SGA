/**
 * DriverAnalyzer Unit Tests
 *
 * @module tests/engine/driver-analyzer.test
 * @description Unit tests for explainability driver analysis (US-037)
 */

import { describe, it, expect } from 'vitest';
import { analyzeDrivers, DriverType } from '@/lib/engine';
import type { AnalysisContext } from '@/lib/engine';
import type { ProductDecision } from '@/lib/engine/product-types';
import type { GameEvent } from '@/lib/engine/events/event-types';
import type { DelayedEffect } from '@/lib/engine/effects-types';

describe('DriverAnalyzer', () => {
    // Helper to create basic context
    const createTestContext = (overrides: Partial<AnalysisContext> = {}): AnalysisContext => ({
        currentDecisions: [],
        activeEvents: [],
        appliedEffects: [],
        ...overrides,
    });

    // ============================================
    // AC1: TOP 3 DRIVERS DISPLAYED
    // ============================================

    it('should return top 3 drivers sorted by contribution', () => {
        const decisions: ProductDecision[] = [{
            id: 'LEV-TAR-01',
            domain: 'tarif',
            targetIndex: 'IAC',
            value: 3,
            effectType: 'absolute',
            delay: 0,
            turn: 1,
            targetProduct: 'auto'
        } as ProductDecision];

        const events: GameEvent[] = [{
            id: 'EVT-INFLATION',
            type: 'market',
            category: 'ECONOMIQUE',
            name: 'Inflation',
            severity: 'medium',
            impacts: [{ target: 'IAC', value: -2, type: 'absolute' }],
            duration: 10,
            timestamp: '',
            turnTriggered: 1
        } as unknown as GameEvent];

        const effects: DelayedEffect[] = [{
            id: 'EFF-001',
            decisionId: 'LEV-MKT-01',
            targetIndex: 'IAC',
            value: 4,
            effectType: 'absolute',
            createdAtTurn: 1,
            appliesAtTurn: 3,
            domain: 'rh',
            decayRate: 0,
            description: 'Marketing T-2'
        } as DelayedEffect];

        const context = createTestContext({
            currentDecisions: decisions,
            activeEvents: events,
            appliedEffects: effects
        });

        // Total variation +5 (3 - 2 + 4 = 5)
        // Expected order:
        // 1. Delayed Effect (+4)
        // 2. Decision (+3)
        // 3. Event (-2)
        const result = analyzeDrivers('IAC', 50, 55, context);

        expect(result.drivers).toHaveLength(3);
        expect(result.drivers[0].type).toBe(DriverType.DELAYED_EFFECT);
        expect(result.drivers[0].contribution).toBe(4);
        expect(result.drivers[0].contributionPercent).toBe(80); // 4/5 = 80%

        expect(result.drivers[1].type).toBe(DriverType.DECISION);
        expect(result.drivers[1].contribution).toBe(3);

        expect(result.drivers[2].type).toBe(DriverType.EVENT);
        expect(result.drivers[2].contribution).toBe(-2);
    });

    // ============================================
    // AC4: SORTING LOGIC
    // ============================================

    it('should sort drivers by absolute contribution', () => {
        // Driver A: +2
        // Driver B: -8
        // Driver C: +5
        // Expected: B, C, A

        const decisions: ProductDecision[] = [
            { id: 'A', targetIndex: 'IAC', value: 2, effectType: 'absolute', delay: 0, turn: 1 } as ProductDecision,
            { id: 'B', targetIndex: 'IAC', value: -8, effectType: 'absolute', delay: 0, turn: 1 } as ProductDecision,
            { id: 'C', targetIndex: 'IAC', value: 5, effectType: 'absolute', delay: 0, turn: 1 } as ProductDecision,
        ];

        const context = createTestContext({ currentDecisions: decisions });
        const result = analyzeDrivers('IAC', 50, 60, context); // Variation +10 (>= threshold)

        expect(result.drivers).toHaveLength(3);
        expect(result.drivers[0].sourceId).toBe('B');
        expect(result.drivers[1].sourceId).toBe('C');
        expect(result.drivers[2].sourceId).toBe('A');
    });

    // ============================================
    // AC: THRESHOLD
    // ============================================

    it('should return empty array if variation < 5', () => {
        const decisions: ProductDecision[] = [
            { id: 'LEV-TAR-01', targetIndex: 'IAC', value: 2, effectType: 'absolute', delay: 0, turn: 1 } as ProductDecision
        ];

        const context = createTestContext({ currentDecisions: decisions });

        // Variation 2 < 5
        const result = analyzeDrivers('IAC', 50, 52, context);

        expect(result.drivers).toHaveLength(0);
    });

    // ============================================
    // AC2: DRIVER TYPES
    // ============================================

    it('should identify decision as driver type', () => {
        const context = createTestContext({
            currentDecisions: [{ id: 'D1', targetIndex: 'IAC', value: 6, effectType: 'absolute', delay: 0 } as ProductDecision]
        });

        const result = analyzeDrivers('IAC', 50, 56, context);
        expect(result.drivers[0].type).toBe(DriverType.DECISION);
    });

    it('should identify delayed effect as driver type', () => {
        const context = createTestContext({
            appliedEffects: [{ id: 'E1', targetIndex: 'IAC', value: 6, effectType: 'absolute' } as DelayedEffect]
        });

        const result = analyzeDrivers('IAC', 50, 56, context);
        expect(result.drivers[0].type).toBe(DriverType.DELAYED_EFFECT);
    });

    // ============================================
    // RELATIVE EFFECTS
    // ============================================

    it('should calculate relative contribution correctly', () => {
        // Previous value 80
        // Decision +10%
        // Expected contribution: +8
        const context = createTestContext({
            currentDecisions: [{ id: 'D1', targetIndex: 'IAC', value: 10, effectType: 'relative', delay: 0 } as ProductDecision]
        });

        const result = analyzeDrivers('IAC', 80, 88, context);
        expect(result.drivers[0].contribution).toBe(8);
    });
});
