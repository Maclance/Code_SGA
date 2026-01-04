/**
 * Alert Types - TypeScript definitions for alert system
 *
 * @module lib/engine/alerts/alert-types
 * @description Type definitions for alert detection system (US-032)
 *
 * References:
 * - docs/000_projet/specs_fonctionnelles_mvp.md (US-032)
 * - docs/20_simulation/indices.md (thresholds)
 */

import type { IndexId } from '../types';

// ============================================
// SEVERITY LEVELS
// ============================================

/**
 * Alert severity levels in order of priority
 * - critical (🔴): Immediate action required
 * - warning (⚠️): Attention needed soon
 * - info (💡): Informational, suggestion
 */
export type AlertSeverity = 'critical' | 'warning' | 'info';

/**
 * Severity priority map for sorting (higher = more urgent)
 */
export const SEVERITY_PRIORITY: Record<AlertSeverity, number> = {
    critical: 3,
    warning: 2,
    info: 1,
} as const;

/**
 * Severity icons for display
 */
export const SEVERITY_ICONS: Record<AlertSeverity, string> = {
    critical: '🔴',
    warning: '⚠️',
    info: '💡',
} as const;

// ============================================
// ALERT CATEGORIES
// ============================================

/**
 * Alert categories for MVP
 * Each category maps to a specific business situation
 */
export type AlertCategory =
    | 'HR_BOTTLENECK'      // IERH < threshold
    | 'IT_DEBT'            // IMD < threshold
    | 'LOW_RESILIENCE'     // IRF < threshold
    | 'CLAIMS_BACKLOG';    // Stock sinistres +20% vs T-1

/**
 * All alert category IDs for iteration
 */
export const ALERT_CATEGORIES: readonly AlertCategory[] = [
    'HR_BOTTLENECK',
    'IT_DEBT',
    'LOW_RESILIENCE',
    'CLAIMS_BACKLOG',
] as const;

// ============================================
// ALERT STRUCTURE
// ============================================

/**
 * Alert structure with all information for display and action
 */
export interface Alert {
    /** Unique alert identifier */
    id: string;
    /** Alert category */
    type: AlertCategory;
    /** Severity level */
    severity: AlertSeverity;
    /** Threshold that was crossed */
    threshold: number;
    /** Current value that triggered the alert */
    currentValue: number;
    /** Related index if applicable */
    relatedIndex?: IndexId;
    /** i18n key for title */
    titleKey: string;
    /** i18n key for description */
    descriptionKey: string;
    /** Display title (localized) */
    title: string;
    /** Detailed description (localized) */
    description: string;
    /** Probable cause of the issue */
    cause: string;
    /** Recommended lever IDs (top 3) */
    recommendedLevers: string[];
    /** Turn when alert was created */
    createdAtTurn?: number;
}

// ============================================
// CONFIGURATION TYPES
// ============================================

/**
 * Threshold configuration for index-based alerts
 */
export interface IndexAlertThreshold {
    /** Index to monitor */
    index: IndexId;
    /** Threshold below which alert triggers */
    threshold: number;
    /** Severity when triggered */
    severity: AlertSeverity;
}

/**
 * Threshold configuration for percentage-based alerts
 */
export interface PercentageAlertThreshold {
    /** Percentage increase that triggers alert */
    percentageIncrease: number;
    /** Severity when triggered */
    severity: AlertSeverity;
}

/**
 * Alert configuration by category
 */
export interface AlertCategoryConfig {
    /** Category identifier */
    category: AlertCategory;
    /** Index threshold (for index-based alerts) */
    indexThreshold?: IndexAlertThreshold;
    /** Percentage threshold (for percentage-based alerts) */
    percentageThreshold?: PercentageAlertThreshold;
    /** i18n key for title */
    titleKey: string;
    /** i18n key for description */
    descriptionKey: string;
    /** i18n key for cause */
    causeKey: string;
    /** Recommended lever IDs */
    recommendedLevers: string[];
}

/**
 * Complete thresholds configuration by difficulty
 */
export type AlertThresholdsByDifficulty = Record<
    'novice' | 'intermediaire',
    Record<AlertCategory, AlertCategoryConfig>
>;

// ============================================
// DETECTION INPUT
// ============================================

/**
 * Input for alert detection
 */
export interface AlertDetectionInput {
    /** Current indices values */
    indices: Record<IndexId, number>;
    /** Previous turn's stock sinistres (for backlog comparison) */
    previousStockSinistres?: number;
    /** Current stock sinistres */
    currentStockSinistres?: number;
    /** Current turn number */
    currentTurn?: number;
}

/**
 * Difficulty type for alert configuration
 */
export type AlertDifficulty = 'novice' | 'intermediaire';
