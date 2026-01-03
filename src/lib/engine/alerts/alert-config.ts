/**
 * Alert Configuration - Thresholds and recommended levers
 *
 * @module lib/engine/alerts/alert-config
 * @description Configuration for alert thresholds by difficulty (US-032)
 *
 * References:
 * - docs/000_projet/specs_fonctionnelles_mvp.md (US-032)
 * - docs/20_simulation/indices.md (thresholds)
 */

import type {
    AlertCategory,
    AlertCategoryConfig,
    AlertThresholdsByDifficulty,
} from './alert-types';

// ============================================
// RECOMMENDED LEVERS BY ALERT TYPE
// ============================================

/**
 * Recommended levers per alert category (top 3)
 * These map to lever IDs from the leviers_catalogue
 */
export const RECOMMENDED_LEVERS: Record<AlertCategory, string[]> = {
    HR_BOTTLENECK: [
        'LEV-RH-01',  // Recrutement
        'LEV-RH-02',  // Formation
        'LEV-RH-03',  // Conditions travail
    ],
    IT_DEBT: [
        'LEV-IT-01',  // Infrastructure IT
        'LEV-IT-02',  // Gouvernance data
        'LEV-IT-03',  // Réduction dette technique
    ],
    LOW_RESILIENCE: [
        'LEV-REA-01', // Réassurance
        'LEV-PROV-01', // Provisions
        'LEV-FIN-01', // Qualité placements
    ],
    CLAIMS_BACKLOG: [
        'LEV-SIN-01', // Capacité traitement
        'LEV-RH-01',  // Recrutement gestionnaires
        'LEV-ORG-01', // Amélioration processus
    ],
} as const;

// ============================================
// i18n KEYS - FRENCH (DEFAULT)
// ============================================

/**
 * Alert message templates for i18n
 * Format: { titleKey, descriptionKey, causeKey }
 */
export const ALERT_MESSAGES: Record<AlertCategory, {
    titleKey: string;
    title: string;
    descriptionKey: string;
    description: string;
    causeKey: string;
    cause: string;
}> = {
    HR_BOTTLENECK: {
        titleKey: 'alerts.hr_bottleneck.title',
        title: 'Goulot RH',
        descriptionKey: 'alerts.hr_bottleneck.description',
        description: 'L\'indice IERH est en dessous du seuil critique. La capacité RH est insuffisante.',
        causeKey: 'alerts.hr_bottleneck.cause',
        cause: 'Capacité insuffisante',
    },
    IT_DEBT: {
        titleKey: 'alerts.it_debt.title',
        title: 'Dette IT',
        descriptionKey: 'alerts.it_debt.description',
        description: 'L\'indice IMD est en dessous du seuil critique. Risque cyber/panne élevé.',
        causeKey: 'alerts.it_debt.cause',
        cause: 'Risque cyber/panne',
    },
    LOW_RESILIENCE: {
        titleKey: 'alerts.low_resilience.title',
        title: 'Résilience faible',
        descriptionKey: 'alerts.low_resilience.description',
        description: 'L\'indice IRF est en dessous du seuil critique. Vulnérabilité aux chocs.',
        causeKey: 'alerts.low_resilience.cause',
        cause: 'Vulnérabilité aux chocs',
    },
    CLAIMS_BACKLOG: {
        titleKey: 'alerts.claims_backlog.title',
        title: 'Backlog en hausse',
        descriptionKey: 'alerts.claims_backlog.description',
        description: 'Le stock de sinistres a augmenté significativement par rapport au tour précédent.',
        causeKey: 'alerts.claims_backlog.cause',
        cause: 'Afflux de sinistres',
    },
} as const;

// ============================================
// THRESHOLDS BY DIFFICULTY
// ============================================

/**
 * Base alert configuration for NOVICE difficulty
 * More forgiving thresholds for beginners
 */
const NOVICE_CONFIG: Record<AlertCategory, AlertCategoryConfig> = {
    HR_BOTTLENECK: {
        category: 'HR_BOTTLENECK',
        indexThreshold: {
            index: 'IERH',
            threshold: 40,
            severity: 'warning',
        },
        titleKey: ALERT_MESSAGES.HR_BOTTLENECK.titleKey,
        descriptionKey: ALERT_MESSAGES.HR_BOTTLENECK.descriptionKey,
        causeKey: ALERT_MESSAGES.HR_BOTTLENECK.causeKey,
        recommendedLevers: RECOMMENDED_LEVERS.HR_BOTTLENECK,
    },
    IT_DEBT: {
        category: 'IT_DEBT',
        indexThreshold: {
            index: 'IMD',
            threshold: 30,
            severity: 'warning',
        },
        titleKey: ALERT_MESSAGES.IT_DEBT.titleKey,
        descriptionKey: ALERT_MESSAGES.IT_DEBT.descriptionKey,
        causeKey: ALERT_MESSAGES.IT_DEBT.causeKey,
        recommendedLevers: RECOMMENDED_LEVERS.IT_DEBT,
    },
    LOW_RESILIENCE: {
        category: 'LOW_RESILIENCE',
        indexThreshold: {
            index: 'IRF',
            threshold: 35,
            severity: 'critical',
        },
        titleKey: ALERT_MESSAGES.LOW_RESILIENCE.titleKey,
        descriptionKey: ALERT_MESSAGES.LOW_RESILIENCE.descriptionKey,
        causeKey: ALERT_MESSAGES.LOW_RESILIENCE.causeKey,
        recommendedLevers: RECOMMENDED_LEVERS.LOW_RESILIENCE,
    },
    CLAIMS_BACKLOG: {
        category: 'CLAIMS_BACKLOG',
        percentageThreshold: {
            percentageIncrease: 20,
            severity: 'warning',
        },
        titleKey: ALERT_MESSAGES.CLAIMS_BACKLOG.titleKey,
        descriptionKey: ALERT_MESSAGES.CLAIMS_BACKLOG.descriptionKey,
        causeKey: ALERT_MESSAGES.CLAIMS_BACKLOG.causeKey,
        recommendedLevers: RECOMMENDED_LEVERS.CLAIMS_BACKLOG,
    },
};

/**
 * Alert configuration for INTERMEDIAIRE difficulty
 * Stricter thresholds with higher severity
 */
const INTERMEDIAIRE_CONFIG: Record<AlertCategory, AlertCategoryConfig> = {
    HR_BOTTLENECK: {
        ...NOVICE_CONFIG.HR_BOTTLENECK,
        indexThreshold: {
            index: 'IERH',
            threshold: 45,  // Stricter threshold
            severity: 'critical',  // Higher severity
        },
    },
    IT_DEBT: {
        ...NOVICE_CONFIG.IT_DEBT,
        indexThreshold: {
            index: 'IMD',
            threshold: 35,  // Stricter threshold
            severity: 'critical',  // Higher severity
        },
    },
    LOW_RESILIENCE: {
        ...NOVICE_CONFIG.LOW_RESILIENCE,
        indexThreshold: {
            index: 'IRF',
            threshold: 40,  // Stricter threshold
            severity: 'critical',
        },
    },
    CLAIMS_BACKLOG: {
        ...NOVICE_CONFIG.CLAIMS_BACKLOG,
        percentageThreshold: {
            percentageIncrease: 15,  // Stricter threshold
            severity: 'critical',  // Higher severity
        },
    },
};

/**
 * Complete alert thresholds configuration by difficulty
 */
export const ALERT_THRESHOLDS: AlertThresholdsByDifficulty = {
    novice: NOVICE_CONFIG,
    intermediaire: INTERMEDIAIRE_CONFIG,
} as const;

/**
 * Get alert configuration for a specific difficulty
 */
export function getAlertConfig(
    difficulty: 'novice' | 'intermediaire',
    category: AlertCategory
): AlertCategoryConfig {
    return ALERT_THRESHOLDS[difficulty][category];
}

/**
 * Get all alert configurations for a difficulty
 */
export function getAllAlertConfigs(
    difficulty: 'novice' | 'intermediaire'
): AlertCategoryConfig[] {
    return Object.values(ALERT_THRESHOLDS[difficulty]);
}
