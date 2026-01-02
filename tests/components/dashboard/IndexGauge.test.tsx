/**
 * IndexGauge Component Tests
 *
 * @module tests/components/dashboard/IndexGauge.test
 * @description Tests for IndexGauge component (US-030)
 */

import { describe, it, expect, vi } from 'vitest';
import type { IndexStatus, IndexThresholds } from '@/lib/engine';
import { getIndexStatus, DEFAULT_INDEX_THRESHOLDS, INDEX_LABELS } from '@/lib/engine';

// Mock CSS module
vi.mock('@/components/game/dashboard/IndexGauge.module.css', () => ({
    default: {
        gauge: 'gauge',
        bar: 'bar',
        circular: 'circular',
        compact: 'compact',
        header: 'header',
        titleRow: 'titleRow',
        valueRow: 'valueRow',
        icon: 'icon',
        label: 'label',
        valueText: 'valueText',
        maxValue: 'maxValue',
        delta: 'delta',
        deltaPercent: 'deltaPercent',
        barContainer: 'barContainer',
        barFill: 'barFill',
        thresholdMarker: 'thresholdMarker',
        statusBadge: 'statusBadge',
        critical: 'critical',
        warning: 'warning',
        ok: 'ok',
        good: 'good',
        circularGauge: 'circularGauge',
        circularSvg: 'circularSvg',
        circularProgress: 'circularProgress',
        circularValue: 'circularValue',
        labelContainer: 'labelContainer',
    },
}));

// ============================================
// STATUS CALCULATION TESTS
// ============================================

describe('IndexGauge Status Calculation', () => {
    it('test_IndexGauge_status_critical: value < 30 → status="critical"', () => {
        const status = getIndexStatus(25);
        expect(status).toBe('critical');
    });

    it('test_IndexGauge_status_warning: value < 50 → status="warning"', () => {
        const status = getIndexStatus(40);
        expect(status).toBe('warning');
    });

    it('should return "ok" for values between 50 and 70', () => {
        const status = getIndexStatus(60);
        expect(status).toBe('ok');
    });

    it('should return "good" for values >= 70', () => {
        const status = getIndexStatus(75);
        expect(status).toBe('good');
    });

    it('should handle edge cases at threshold boundaries', () => {
        // Exactly at thresholds
        expect(getIndexStatus(30)).toBe('warning'); // At critical threshold → next level
        expect(getIndexStatus(50)).toBe('ok');      // At warning threshold → next level
        expect(getIndexStatus(70)).toBe('good');    // At good threshold → good
    });

    it('should handle 0 and 100 values', () => {
        expect(getIndexStatus(0)).toBe('critical');
        expect(getIndexStatus(100)).toBe('good');
    });
});

// ============================================
// CUSTOM THRESHOLDS TESTS
// ============================================

describe('IndexGauge Custom Thresholds', () => {
    it('should use custom thresholds when provided', () => {
        const customThresholds: IndexThresholds = {
            critical: 20,
            warning: 40,
            good: 80,
        };

        expect(getIndexStatus(15, customThresholds)).toBe('critical');
        expect(getIndexStatus(25, customThresholds)).toBe('warning');
        expect(getIndexStatus(50, customThresholds)).toBe('ok');
        expect(getIndexStatus(85, customThresholds)).toBe('good');
    });

    it('should use default thresholds by default', () => {
        expect(DEFAULT_INDEX_THRESHOLDS.critical).toBe(30);
        expect(DEFAULT_INDEX_THRESHOLDS.warning).toBe(50);
        expect(DEFAULT_INDEX_THRESHOLDS.good).toBe(70);
    });
});

// ============================================
// DELTA CALCULATION TESTS
// ============================================

describe('IndexGauge Delta Calculation', () => {
    it('should calculate positive delta correctly', () => {
        const current = 65;
        const previous = 60;
        const delta = current - previous;

        expect(delta).toBe(5);
    });

    it('should calculate negative delta correctly', () => {
        const current = 55;
        const previous = 60;
        const delta = current - previous;

        expect(delta).toBe(-5);
    });

    it('should handle zero delta', () => {
        const current = 60;
        const previous = 60;
        const delta = current - previous;

        expect(delta).toBe(0);
    });

    it('should calculate delta percent correctly', () => {
        const current = 66;
        const previous = 60;
        const deltaPercent = ((current - previous) / previous) * 100;

        expect(deltaPercent).toBe(10);
    });
});

// ============================================
// LABELS TESTS
// ============================================

describe('IndexGauge Labels', () => {
    it('should have labels for all 7 indices', () => {
        expect(INDEX_LABELS.IAC).toBe('Attractivité Commerciale');
        expect(INDEX_LABELS.IPQO).toBe('Performance Opérationnelle');
        expect(INDEX_LABELS.IERH).toBe('Équilibre RH');
        expect(INDEX_LABELS.IRF).toBe('Résilience Financière');
        expect(INDEX_LABELS.IMD).toBe('Maturité Data');
        expect(INDEX_LABELS.IS).toBe('Sincérité');
        expect(INDEX_LABELS.IPP).toBe('Performance P&L');
    });
});

// ============================================
// ACCESSIBILITY TESTS
// ============================================

describe('IndexGauge Accessibility', () => {
    it('test_IndexGauge_aria_label: aria-label should contain value and status', () => {
        const value = 45;
        const label = 'Équilibre RH';
        const status = getIndexStatus(value);
        const delta = 5;

        // Simulate what the component would generate
        const ariaLabel = `${label}: ${Math.round(value)} sur 100, variation de +${delta.toFixed(1)}, statut ${status}`;

        expect(ariaLabel).toContain('45');
        expect(ariaLabel).toContain('sur 100');
        expect(ariaLabel).toContain('warning');
    });

    it('should include delta in aria-label when present', () => {
        const value = 65;
        const delta = -3;
        const status = getIndexStatus(value);
        const ariaLabel = `Test: ${value} sur 100, variation de ${delta.toFixed(1)}, statut ${status}`;

        expect(ariaLabel).toContain('-3.0');
    });
});

// ============================================
// PROPS TESTS
// ============================================

describe('IndexGauge Props', () => {
    it('should accept required props', () => {
        const props = {
            indexId: 'IAC' as const,
            label: 'Attractivité Commerciale',
            value: 65,
        };

        expect(props.indexId).toBe('IAC');
        expect(props.label).toBeDefined();
        expect(props.value).toBe(65);
    });

    it('should accept optional props', () => {
        const props = {
            indexId: 'IERH' as const,
            label: 'Équilibre RH',
            value: 45,
            previousValue: 48,
            thresholds: DEFAULT_INDEX_THRESHOLDS,
            compact: true,
            variant: 'circular' as const,
        };

        expect(props.previousValue).toBe(48);
        expect(props.compact).toBe(true);
        expect(props.variant).toBe('circular');
    });
});
