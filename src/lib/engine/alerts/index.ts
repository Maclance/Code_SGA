/**
 * Alerts Module - Public API
 *
 * @module lib/engine/alerts
 * @description Alert system exports (US-032)
 */

// Types
export type {
    AlertSeverity,
    AlertCategory,
    Alert,
    IndexAlertThreshold,
    PercentageAlertThreshold,
    AlertCategoryConfig,
    AlertThresholdsByDifficulty,
    AlertDetectionInput,
    AlertDifficulty,
} from './alert-types';

export {
    ALERT_CATEGORIES,
    SEVERITY_PRIORITY,
    SEVERITY_ICONS,
} from './alert-types';

// Configuration
export {
    RECOMMENDED_LEVERS,
    ALERT_MESSAGES,
    ALERT_THRESHOLDS,
    getAlertConfig,
    getAllAlertConfigs,
} from './alert-config';

// Engine
export {
    detectAlerts,
    sortAlertsBySeverity,
    isAlertResolved,
    filterAlertsBySeverity,
    filterAlertsByCategory,
    getCriticalAlerts,
    getWarningAlerts,
    ALERT_SEVERITY_VALUES,
} from './alert-engine';
