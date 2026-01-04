/**
 * AlertPanel Component Tests
 *
 * @module tests/components/AlertPanel.test
 * @description Integration tests for AlertPanel component (US-032)
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AlertPanel } from '@/components/game/alerts/AlertPanel';
import type { Alert } from '@/lib/engine';

// Mock CSS module
vi.mock('@/components/game/alerts/AlertPanel.module.css', () => ({
    default: {
        panel: 'panel',
        empty: 'empty',
        title: 'title',
        count: 'count',
        emptyMessage: 'emptyMessage',
        alertList: 'alertList',
        alertItem: 'alertItem',
        alertHeader: 'alertHeader',
        alertTitle: 'alertTitle',
        alertDescription: 'alertDescription',
        alertCause: 'alertCause',
        icon: 'icon',
        critical: 'critical',
        warning: 'warning',
        info: 'info',
        recommendations: 'recommendations',
        leverList: 'leverList',
        leverItem: 'leverItem',
        indexBadge: 'indexBadge',
        threshold: 'threshold',
    },
}));

// ============================================
// TEST HELPERS
// ============================================

function createTestAlert(overrides: Partial<Alert> = {}): Alert {
    return {
        id: 'alert-test',
        type: 'HR_BOTTLENECK',
        severity: 'warning',
        threshold: 40,
        currentValue: 35,
        relatedIndex: 'IERH',
        titleKey: 'alerts.hr.title',
        descriptionKey: 'alerts.hr.description',
        title: 'Goulot RH',
        description: 'Test description',
        cause: 'Capacité insuffisante',
        recommendedLevers: ['LEV-RH-01', 'LEV-RH-02', 'LEV-RH-03'],
        ...overrides,
    };
}

// ============================================
// AC3: SEVERITY SORTING DISPLAY
// ============================================

describe('AlertPanel - Severity Sorting Display', () => {
    it('should render alerts sorted by severity (critical first)', () => {
        const alerts: Alert[] = [
            createTestAlert({
                id: 'alert-1',
                type: 'HR_BOTTLENECK',
                severity: 'warning',
                title: 'RH Warning',
            }),
            createTestAlert({
                id: 'alert-2',
                type: 'LOW_RESILIENCE',
                severity: 'critical',
                title: 'Résilience Critical',
            }),
        ];

        render(<AlertPanel alerts={alerts} />);

        const alertElements = screen.getAllByRole('alert');
        expect(alertElements).toHaveLength(2);

        // Critical should come first - check textContent
        expect(alertElements[0].textContent).toContain('Résilience Critical');
        expect(alertElements[1].textContent).toContain('RH Warning');
    });

    it('should display severity icon for each alert', () => {
        const alerts: Alert[] = [
            createTestAlert({
                severity: 'critical',
                title: 'Critical Alert',
            }),
        ];

        render(<AlertPanel alerts={alerts} />);

        // Critical icon should be present (🔴)
        const icon = screen.getByText('🔴');
        expect(icon).toBeDefined();
    });
});

// ============================================
// AC2: RECOMMENDED LEVERS DISPLAY
// ============================================

describe('AlertPanel - Recommended Levers Display', () => {
    it('should display recommended levers when showRecommendations is true', () => {
        const alerts: Alert[] = [
            createTestAlert({
                recommendedLevers: ['LEV-RH-01', 'LEV-RH-02'],
            }),
        ];

        render(<AlertPanel alerts={alerts} showRecommendations />);

        expect(screen.getByText('LEV-RH-01')).toBeDefined();
        expect(screen.getByText('LEV-RH-02')).toBeDefined();
    });

    it('should not display levers when showRecommendations is false', () => {
        const alerts: Alert[] = [
            createTestAlert({
                recommendedLevers: ['LEV-RH-01'],
            }),
        ];

        render(<AlertPanel alerts={alerts} showRecommendations={false} />);

        expect(screen.queryByText('LEV-RH-01')).toBeNull();
    });

    it('should display only top 3 levers maximum', () => {
        const alerts: Alert[] = [
            createTestAlert({
                recommendedLevers: ['LEV-1', 'LEV-2', 'LEV-3', 'LEV-4', 'LEV-5'],
            }),
        ];

        render(<AlertPanel alerts={alerts} showRecommendations />);

        expect(screen.getByText('LEV-1')).toBeDefined();
        expect(screen.getByText('LEV-2')).toBeDefined();
        expect(screen.getByText('LEV-3')).toBeDefined();
        expect(screen.queryByText('LEV-4')).toBeNull();
        expect(screen.queryByText('LEV-5')).toBeNull();
    });
});

// ============================================
// EMPTY STATE
// ============================================

describe('AlertPanel - Empty State', () => {
    it('should display empty message when no alerts', () => {
        render(<AlertPanel alerts={[]} />);

        const emptyMessage = screen.getByText(/Aucune alerte active/);
        expect(emptyMessage).toBeDefined();
    });

    it('should display alert count badge when alerts present', () => {
        const alerts: Alert[] = [
            createTestAlert({ id: 'alert-1' }),
            createTestAlert({ id: 'alert-2' }),
        ];

        render(<AlertPanel alerts={alerts} />);

        const badge = screen.getByText('2');
        expect(badge).toBeDefined();
    });
});

// ============================================
// ACCESSIBILITY
// ============================================

describe('AlertPanel - Accessibility', () => {
    it('should have role="alert" on each alert item', () => {
        const alerts: Alert[] = [createTestAlert()];

        render(<AlertPanel alerts={alerts} />);

        const alertElements = screen.getAllByRole('alert');
        expect(alertElements).toHaveLength(1);
    });

    it('should display cause probable', () => {
        const alerts: Alert[] = [
            createTestAlert({
                cause: 'Capacité insuffisante',
            }),
        ];

        render(<AlertPanel alerts={alerts} />);

        expect(screen.getByText(/Cause probable/)).toBeDefined();
        expect(screen.getByText(/Capacité insuffisante/)).toBeDefined();
    });
});

// ============================================
// EXTRA: ALERT CONTENT DISPLAY
// ============================================

describe('AlertPanel - Content Display', () => {
    it('should display description text', () => {
        const alerts: Alert[] = [
            createTestAlert({
                description: 'L\'indice IERH est bas',
            }),
        ];

        render(<AlertPanel alerts={alerts} />);

        const desc = screen.getByText(/L'indice IERH est bas/);
        expect(desc).toBeDefined();
    });

    it('should display index badge with current value and threshold', () => {
        const alerts: Alert[] = [
            createTestAlert({
                relatedIndex: 'IERH',
                currentValue: 35,
                threshold: 40,
            }),
        ];

        render(<AlertPanel alerts={alerts} />);

        expect(screen.getByText(/IERH: 35/)).toBeDefined();
        expect(screen.getByText(/seuil: 40/)).toBeDefined();
    });
});
