/**
 * Alert Engine Unit Tests
 *
 * @module tests/engine/alerts.test
 * @description Unit tests for alert detection system (US-032)
 */

import { describe, it, expect } from 'vitest';
import {
    detectAlerts,
    sortAlertsBySeverity,
    isAlertResolved,
    ALERT_SEVERITY_VALUES,
    ALERT_THRESHOLDS,
    RECOMMENDED_LEVERS,
} from '@/lib/engine';
import type { Alert, AlertDifficulty, IndicesState } from '@/lib/engine';

// ============================================
// TEST HELPERS
// ============================================

function createTestIndices(overrides: Partial<Record<keyof IndicesState, number>> = {}): Record<keyof IndicesState, number> {
    return {
        IAC: 60,
        IPQO: 60,
        IERH: 60,
        IRF: 60,
        IMD: 60,
        IS: 70,
        IPP: 55,
        ...overrides,
    };
}

// ============================================
// AC1: THRESHOLD CROSSING DETECTION
// ============================================

describe('AlertEngine - Threshold Detection', () => {
    it('should detect HR bottleneck when IERH < 40', () => {
        const indices = createTestIndices({ IERH: 35 });
        const alerts = detectAlerts(indices, 'novice');

        expect(alerts).toContainEqual(
            expect.objectContaining({
                type: 'HR_BOTTLENECK',
                severity: 'warning',
                threshold: 40,
                currentValue: 35,
            })
        );
    });

    it('should detect IT debt when IMD < 30', () => {
        const indices = createTestIndices({ IMD: 25 });
        const alerts = detectAlerts(indices, 'novice');

        expect(alerts).toContainEqual(
            expect.objectContaining({
                type: 'IT_DEBT',
                severity: 'warning',
            })
        );
    });

    it('should detect critical resilience when IRF < 35', () => {
        const indices = createTestIndices({ IRF: 30 });
        const alerts = detectAlerts(indices, 'novice');

        expect(alerts).toContainEqual(
            expect.objectContaining({
                type: 'LOW_RESILIENCE',
                severity: 'critical',
            })
        );
    });

    it('should return empty array when all indices above thresholds', () => {
        const indices = createTestIndices({
            IERH: 60,
            IMD: 60,
            IRF: 60,
        });
        const alerts = detectAlerts(indices, 'novice');

        expect(alerts).toHaveLength(0);
    });

    it('should detect claims backlog when stock increases > 20%', () => {
        const alerts = detectAlerts({
            indices: createTestIndices(),
            previousStockSinistres: 100,
            currentStockSinistres: 125, // 25% increase
        }, 'novice');

        expect(alerts).toContainEqual(
            expect.objectContaining({
                type: 'CLAIMS_BACKLOG',
                severity: 'warning',
            })
        );
    });
});

// ============================================
// AC2: RECOMMENDED LEVERS
// ============================================

describe('AlertEngine - Recommended Levers', () => {
    it('should include recommended levers for HR bottleneck', () => {
        const indices = createTestIndices({ IERH: 30 });
        const alerts = detectAlerts(indices, 'novice');

        const hrAlert = alerts.find(a => a.type === 'HR_BOTTLENECK');
        expect(hrAlert).toBeDefined();
        expect(hrAlert!.recommendedLevers).toEqual(RECOMMENDED_LEVERS.HR_BOTTLENECK);
        expect(hrAlert!.recommendedLevers.length).toBe(3);
    });

    it('should include cause probable for each alert', () => {
        const indices = createTestIndices({ IERH: 30, IMD: 25 });
        const alerts = detectAlerts(indices, 'novice');

        alerts.forEach(alert => {
            expect(alert.cause).toBeDefined();
            expect(alert.cause.length).toBeGreaterThan(0);
        });
    });
});

// ============================================
// AC3: SEVERITY SORTING
// ============================================

describe('AlertEngine - Severity Sorting', () => {
    it('should sort alerts by severity (critical first)', () => {
        const indices = createTestIndices({
            IERH: 30,  // warning
            IRF: 25,   // critical
        });
        const alerts = detectAlerts(indices, 'novice');
        const sorted = sortAlertsBySeverity(alerts);

        // Critical should come first
        expect(sorted[0].severity).toBe('critical');
        expect(sorted[1].severity).toBe('warning');
    });

    it('should not mutate original array', () => {
        const alerts: Alert[] = [
            {
                id: 'alert-1',
                type: 'HR_BOTTLENECK',
                severity: 'warning',
                threshold: 40,
                currentValue: 35,
                title: 'Test',
                titleKey: 'test',
                description: 'Test',
                descriptionKey: 'test',
                cause: 'Test',
                recommendedLevers: [],
            },
            {
                id: 'alert-2',
                type: 'LOW_RESILIENCE',
                severity: 'critical',
                threshold: 35,
                currentValue: 25,
                title: 'Test',
                titleKey: 'test',
                description: 'Test',
                descriptionKey: 'test',
                cause: 'Test',
                recommendedLevers: [],
            },
        ];

        const originalFirst = alerts[0];
        sortAlertsBySeverity(alerts);

        // Original array should not be mutated
        expect(alerts[0]).toBe(originalFirst);
    });
});

// ============================================
// AC4: ALERT RESOLUTION
// ============================================

describe('AlertEngine - Alert Resolution', () => {
    it('should mark alert as resolved when index goes above threshold', () => {
        const alert: Alert = {
            id: 'alert-ierh-critical',
            type: 'HR_BOTTLENECK',
            severity: 'warning',
            threshold: 40,
            currentValue: 35,
            relatedIndex: 'IERH',
            title: 'Test',
            titleKey: 'test',
            description: 'Test',
            descriptionKey: 'test',
            cause: 'Test',
            recommendedLevers: [],
        };

        const newIndices: IndicesState = {
            IAC: 60,
            IPQO: 60,
            IERH: 55, // Above threshold
            IRF: 60,
            IMD: 60,
            IS: 70,
            IPP: 55,
        };

        const isResolved = isAlertResolved(alert, newIndices, 'novice');
        expect(isResolved).toBe(true);
    });

    it('should not mark alert as resolved when index still below threshold', () => {
        const alert: Alert = {
            id: 'alert-ierh-critical',
            type: 'HR_BOTTLENECK',
            severity: 'warning',
            threshold: 40,
            currentValue: 35,
            relatedIndex: 'IERH',
            title: 'Test',
            titleKey: 'test',
            description: 'Test',
            descriptionKey: 'test',
            cause: 'Test',
            recommendedLevers: [],
        };

        const newIndices: IndicesState = {
            IAC: 60,
            IPQO: 60,
            IERH: 38, // Still below threshold
            IRF: 60,
            IMD: 60,
            IS: 70,
            IPP: 55,
        };

        const isResolved = isAlertResolved(alert, newIndices, 'novice');
        expect(isResolved).toBe(false);
    });
});

// ============================================
// DIFFICULTY CONFIGURATION
// ============================================

describe('AlertEngine - Difficulty Configuration', () => {
    it('should have stricter thresholds for intermediaire', () => {
        const noviceHRThreshold = ALERT_THRESHOLDS.novice.HR_BOTTLENECK.indexThreshold?.threshold;
        const intermediateHRThreshold = ALERT_THRESHOLDS.intermediaire.HR_BOTTLENECK.indexThreshold?.threshold;

        expect(intermediateHRThreshold).toBeGreaterThan(noviceHRThreshold!);
    });

    it('should detect warnings at higher thresholds in intermediaire', () => {
        const indices = createTestIndices({ IERH: 42 });

        const noviceAlerts = detectAlerts(indices, 'novice');
        const intermediateAlerts = detectAlerts(indices, 'intermediaire');

        // 42 is above novice threshold (40) but below intermediaire (45)
        expect(noviceAlerts.find(a => a.type === 'HR_BOTTLENECK')).toBeUndefined();
        expect(intermediateAlerts.find(a => a.type === 'HR_BOTTLENECK')).toBeDefined();
    });
});

// ============================================
// SEVERITY VALUES EXPORT
// ============================================

describe('AlertEngine - Severity Values', () => {
    it('should export severity values for tests', () => {
        expect(ALERT_SEVERITY_VALUES.CRITICAL).toBe('critical');
        expect(ALERT_SEVERITY_VALUES.WARNING).toBe('warning');
        expect(ALERT_SEVERITY_VALUES.INFO).toBe('info');
    });
});
