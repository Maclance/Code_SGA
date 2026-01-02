/**
 * AlertBadges Component Tests
 *
 * @module tests/components/dashboard/AlertBadges.test
 * @description Tests for AlertBadges component (US-030)
 */

import { describe, it, expect, vi } from 'vitest';
import type { IndicesState, DashboardAlert, AlertThresholds } from '@/lib/engine';
import { generateAlerts, DEFAULT_ALERT_THRESHOLDS } from '@/lib/engine';

// Mock CSS module
vi.mock('@/components/game/dashboard/AlertBadges.module.css', () => ({
    default: {
        container: 'container',
        empty: 'empty',
        emptyIcon: 'emptyIcon',
        emptyText: 'emptyText',
        alerts: 'alerts',
        compact: 'compact',
        alert: 'alert',
        critical: 'critical',
        warning: 'warning',
        info: 'info',
        alertHeader: 'alertHeader',
        alertIcon: 'alertIcon',
        alertTitle: 'alertTitle',
        indexBadge: 'indexBadge',
        alertDescription: 'alertDescription',
        suggestedActions: 'suggestedActions',
        suggestedLabel: 'suggestedLabel',
        actionList: 'actionList',
        actionItem: 'actionItem',
        toggleButton: 'toggleButton',
    },
}));

// ============================================
// TEST HELPERS
// ============================================

function createHealthyIndices(): IndicesState {
    return {
        IAC: 65,
        IPQO: 70,
        IERH: 55, // Above critical threshold of 40
        IRF: 60,  // Above critical threshold of 35
        IMD: 50,  // Above critical threshold of 30
        IS: 72,
        IPP: 60,
    };
}

function createCriticalIndices(): IndicesState {
    return {
        IAC: 50,
        IPQO: 45,
        IERH: 35, // Below critical threshold of 40
        IRF: 30,  // Below critical threshold of 35
        IMD: 25,  // Below critical threshold of 30
        IS: 55,
        IPP: 40,
    };
}

// ============================================
// THRESHOLD TESTS
// ============================================

describe('AlertBadges Thresholds', () => {
    it('test_AlertBadges_threshold: IERH=35 (<40) → critical alert displayed', () => {
        const indices = createHealthyIndices();
        indices.IERH = 35; // Below 40 threshold

        const alerts = generateAlerts(indices, 100, 100);

        expect(alerts.some(a => a.relatedIndex === 'IERH')).toBe(true);
        expect(alerts.find(a => a.relatedIndex === 'IERH')?.type).toBe('critical');
        expect(alerts.find(a => a.relatedIndex === 'IERH')?.title).toBe('Capacité insuffisante');
    });

    it('test_AlertBadges_no_alert: All indices healthy → no alerts', () => {
        const indices = createHealthyIndices();

        const alerts = generateAlerts(indices, 100, 100);

        // No alerts for index issues (only potential stock warning)
        const indexAlerts = alerts.filter(a => a.relatedIndex !== undefined);
        expect(indexAlerts.length).toBe(0);
    });

    it('should trigger IMD critical alert when IMD < 30', () => {
        const indices = createHealthyIndices();
        indices.IMD = 25;

        const alerts = generateAlerts(indices, 100, 100);

        expect(alerts.some(a => a.relatedIndex === 'IMD')).toBe(true);
        expect(alerts.find(a => a.relatedIndex === 'IMD')?.title).toBe('Risque cyber/panne');
    });

    it('should trigger IRF critical alert when IRF < 35', () => {
        const indices = createHealthyIndices();
        indices.IRF = 30;

        const alerts = generateAlerts(indices, 100, 100);

        expect(alerts.some(a => a.relatedIndex === 'IRF')).toBe(true);
        expect(alerts.find(a => a.relatedIndex === 'IRF')?.title).toBe('Vulnérabilité aux chocs');
    });
});

// ============================================
// STOCK SINISTRES TESTS
// ============================================

describe('AlertBadges Stock Sinistres', () => {
    it('should trigger warning when stock increases by 20%+', () => {
        const indices = createHealthyIndices();
        const previousStock = 100;
        const currentStock = 125; // 25% increase

        const alerts = generateAlerts(indices, previousStock, currentStock);

        const stockAlert = alerts.find(a => a.id === 'alert-stock-warning');
        expect(stockAlert).toBeDefined();
        expect(stockAlert?.type).toBe('warning');
        expect(stockAlert?.title).toBe('Backlog en hausse');
    });

    it('should not trigger when stock increase is below 20%', () => {
        const indices = createHealthyIndices();
        const previousStock = 100;
        const currentStock = 115; // 15% increase

        const alerts = generateAlerts(indices, previousStock, currentStock);

        const stockAlert = alerts.find(a => a.id === 'alert-stock-warning');
        expect(stockAlert).toBeUndefined();
    });

    it('should handle zero previous stock', () => {
        const indices = createHealthyIndices();

        // Division by zero protection
        const alerts = generateAlerts(indices, 0, 100);

        // Should not crash, and no stock alert when previous is 0
        const stockAlert = alerts.find(a => a.id === 'alert-stock-warning');
        expect(stockAlert).toBeUndefined();
    });
});

// ============================================
// MULTIPLE ALERTS TESTS
// ============================================

describe('AlertBadges Multiple Alerts', () => {
    it('should generate multiple alerts when multiple thresholds crossed', () => {
        const indices = createCriticalIndices();

        const alerts = generateAlerts(indices, 100, 100);

        // Should have alerts for IERH, IMD, IRF
        expect(alerts.length).toBeGreaterThanOrEqual(3);
        expect(alerts.some(a => a.relatedIndex === 'IERH')).toBe(true);
        expect(alerts.some(a => a.relatedIndex === 'IMD')).toBe(true);
        expect(alerts.some(a => a.relatedIndex === 'IRF')).toBe(true);
    });

    it('should all be critical type for index alerts', () => {
        const indices = createCriticalIndices();

        const alerts = generateAlerts(indices, 100, 100);
        const indexAlerts = alerts.filter(a => a.relatedIndex !== undefined);

        for (const alert of indexAlerts) {
            expect(alert.type).toBe('critical');
        }
    });
});

// ============================================
// SUGGESTED ACTIONS TESTS
// ============================================

describe('AlertBadges Suggested Actions', () => {
    it('should provide suggested actions for IERH alert', () => {
        const indices = createHealthyIndices();
        indices.IERH = 35;

        const alerts = generateAlerts(indices, 100, 100);
        const ierhAlert = alerts.find(a => a.relatedIndex === 'IERH');

        expect(ierhAlert?.suggestedActions.length).toBeGreaterThan(0);
        expect(ierhAlert?.suggestedActions).toContain('Recruter du personnel supplémentaire');
    });

    it('should provide suggested actions for IMD alert', () => {
        const indices = createHealthyIndices();
        indices.IMD = 25;

        const alerts = generateAlerts(indices, 100, 100);
        const imdAlert = alerts.find(a => a.relatedIndex === 'IMD');

        expect(imdAlert?.suggestedActions.length).toBeGreaterThan(0);
        expect(imdAlert?.suggestedActions).toContain('Investir en infrastructure IT');
    });
});

// ============================================
// CUSTOM THRESHOLDS TESTS
// ============================================

describe('AlertBadges Custom Thresholds', () => {
    it('should use custom thresholds when provided', () => {
        const indices = createHealthyIndices();
        indices.IERH = 55; // Above default 40, but below custom 60

        const customThresholds: AlertThresholds = {
            ierh_critical: 60,
            imd_critical: 30,
            irf_critical: 35,
            stock_increase_warning: 20,
        };

        const alerts = generateAlerts(indices, 100, 100, customThresholds);

        expect(alerts.some(a => a.relatedIndex === 'IERH')).toBe(true);
    });

    it('should use DEFAULT_ALERT_THRESHOLDS values correctly', () => {
        expect(DEFAULT_ALERT_THRESHOLDS.ierh_critical).toBe(40);
        expect(DEFAULT_ALERT_THRESHOLDS.imd_critical).toBe(30);
        expect(DEFAULT_ALERT_THRESHOLDS.irf_critical).toBe(35);
        expect(DEFAULT_ALERT_THRESHOLDS.stock_increase_warning).toBe(20);
    });
});

// ============================================
// PROPS TESTS
// ============================================

describe('AlertBadges Props', () => {
    it('should accept required props', () => {
        const props = {
            alerts: [] as DashboardAlert[],
        };

        expect(props.alerts).toBeDefined();
        expect(Array.isArray(props.alerts)).toBe(true);
    });

    it('should accept optional props', () => {
        const props = {
            alerts: [] as DashboardAlert[],
            maxVisible: 5,
            compact: true,
            onAlertClick: vi.fn(),
            locale: 'fr' as const,
        };

        expect(props.maxVisible).toBe(5);
        expect(props.compact).toBe(true);
        expect(props.onAlertClick).toBeDefined();
        expect(props.locale).toBe('fr');
    });
});
