/**
 * Alert Engine - Detection and management of alerts
 *
 * @module lib/engine/alerts/alert-engine
 * @description Alert detection engine with configurable thresholds (US-032)
 *
 * References:
 * - docs/000_projet/specs_fonctionnelles_mvp.md (US-032)
 * - docs/20_simulation/indices.md (thresholds)
 */

import type { IndexId, IndicesState } from '../types';
import type {
    Alert,
    AlertCategory,
    AlertDifficulty,
    AlertDetectionInput,
    AlertSeverity,
} from './alert-types';
import { ALERT_CATEGORIES, SEVERITY_PRIORITY } from './alert-types';
import { ALERT_THRESHOLDS, ALERT_MESSAGES } from './alert-config';

// ============================================
// ALERT DETECTION
// ============================================

/**
 * Generate unique alert ID
 */
function generateAlertId(category: AlertCategory, turn?: number): string {
    const turnSuffix = turn !== undefined ? `-t${turn}` : '';
    return `alert-${category.toLowerCase()}${turnSuffix}`;
}

/**
 * Create an alert from configuration
 */
function createAlert(
    category: AlertCategory,
    severity: AlertSeverity,
    threshold: number,
    currentValue: number,
    relatedIndex: IndexId | undefined,
    recommendedLevers: string[],
    turn?: number
): Alert {
    const messages = ALERT_MESSAGES[category];

    return {
        id: generateAlertId(category, turn),
        type: category,
        severity,
        threshold,
        currentValue,
        relatedIndex,
        titleKey: messages.titleKey,
        descriptionKey: messages.descriptionKey,
        title: messages.title,
        description: messages.description,
        cause: messages.cause,
        recommendedLevers,
        createdAtTurn: turn,
    };
}

/**
 * Detect alerts based on current indices and configuration
 *
 * Performance target: < 50ms for 20 indices
 *
 * @param input - Detection input with indices and optional stock data
 * @param difficulty - Game difficulty level
 * @returns Array of detected alerts
 */
export function detectAlerts(
    input: AlertDetectionInput | Record<IndexId, number>,
    difficulty: AlertDifficulty = 'novice'
): Alert[] {
    const alerts: Alert[] = [];
    const config = ALERT_THRESHOLDS[difficulty];

    // Normalize input - check if it's a full AlertDetectionInput or just indices
    const isFullInput = typeof input === 'object' && 'indices' in input;
    const indices: Record<IndexId, number> = isFullInput
        ? (input as AlertDetectionInput).indices
        : input as Record<IndexId, number>;
    const previousStock = isFullInput ? (input as AlertDetectionInput).previousStockSinistres : undefined;
    const currentStock = isFullInput ? (input as AlertDetectionInput).currentStockSinistres : undefined;
    const currentTurn = isFullInput ? (input as AlertDetectionInput).currentTurn : undefined;

    // Check each alert category
    for (const category of ALERT_CATEGORIES) {
        const categoryConfig = config[category];

        // Index-based alerts
        if (categoryConfig.indexThreshold) {
            const { index, threshold, severity } = categoryConfig.indexThreshold;
            const currentValue = indices[index] as number | undefined;

            if (currentValue !== undefined && currentValue < threshold) {
                alerts.push(createAlert(
                    category,
                    severity,
                    threshold,
                    currentValue,
                    index,
                    categoryConfig.recommendedLevers,
                    currentTurn
                ));
            }
        }

        // Percentage-based alerts (claims backlog)
        if (categoryConfig.percentageThreshold && previousStock !== undefined && currentStock !== undefined) {
            const { percentageIncrease, severity } = categoryConfig.percentageThreshold;

            if (previousStock > 0) {
                const increase = ((currentStock - previousStock) / previousStock) * 100;

                if (increase >= percentageIncrease) {
                    alerts.push(createAlert(
                        category,
                        severity,
                        percentageIncrease,
                        Math.round(increase),
                        undefined,
                        categoryConfig.recommendedLevers,
                        currentTurn
                    ));
                }
            }
        }
    }

    return alerts;
}

// ============================================
// ALERT SORTING
// ============================================

/**
 * Sort alerts by severity (critical first, then warning, then info)
 *
 * @param alerts - Array of alerts to sort
 * @returns Sorted array (new array, original not mutated)
 */
export function sortAlertsBySeverity(alerts: Alert[]): Alert[] {
    return [...alerts].sort((a, b) => {
        // Higher priority first
        return SEVERITY_PRIORITY[b.severity] - SEVERITY_PRIORITY[a.severity];
    });
}

// ============================================
// ALERT RESOLUTION CHECK
// ============================================

/**
 * Check if an alert would still be active given new indices
 * Used to determine if an alert should be auto-dismissed
 *
 * @param alert - The alert to check
 * @param newIndices - Current indices state
 * @param difficulty - Game difficulty level
 * @returns true if alert is resolved (should be dismissed)
 */
export function isAlertResolved(
    alert: Alert,
    newIndices: IndicesState,
    difficulty: AlertDifficulty = 'novice'
): boolean {
    const config = ALERT_THRESHOLDS[difficulty];
    const categoryConfig = config[alert.type];

    // Index-based alerts
    if (categoryConfig.indexThreshold && alert.relatedIndex) {
        const { threshold } = categoryConfig.indexThreshold;
        const currentValue = newIndices[alert.relatedIndex];

        // Alert is resolved if current value is above threshold
        return currentValue >= threshold;
    }

    // Percentage-based alerts cannot be auto-resolved this way
    // They need stock comparison which is done at detection time
    return false;
}

// ============================================
// ALERT FILTERING
// ============================================

/**
 * Filter alerts by severity
 */
export function filterAlertsBySeverity(
    alerts: Alert[],
    severity: AlertSeverity
): Alert[] {
    return alerts.filter(alert => alert.severity === severity);
}

/**
 * Filter alerts by category
 */
export function filterAlertsByCategory(
    alerts: Alert[],
    category: AlertCategory
): Alert[] {
    return alerts.filter(alert => alert.type === category);
}

/**
 * Get critical alerts only
 */
export function getCriticalAlerts(alerts: Alert[]): Alert[] {
    return filterAlertsBySeverity(alerts, 'critical');
}

/**
 * Get warning alerts only
 */
export function getWarningAlerts(alerts: Alert[]): Alert[] {
    return filterAlertsBySeverity(alerts, 'warning');
}

// ============================================
// EXPORTS FOR BACKWARD COMPATIBILITY
// ============================================

/**
 * AlertSeverity values exported for tests
 * Named differently to avoid conflict with AlertSeverity type
 */
export const ALERT_SEVERITY_VALUES = {
    CRITICAL: 'critical' as const,
    WARNING: 'warning' as const,
    INFO: 'info' as const,
} as const;
