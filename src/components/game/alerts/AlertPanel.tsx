/**
 * AlertPanel Component - Alert list with recommendations
 *
 * @module components/game/alerts/AlertPanel
 * @description Panel displaying sorted alerts with recommended levers (US-032)
 */

import React from 'react';
import type { Alert } from '@/lib/engine';
import { sortAlertsBySeverity, SEVERITY_ICONS } from '@/lib/engine';
import styles from './AlertPanel.module.css';

// ============================================
// PROPS
// ============================================

export interface AlertPanelProps {
    /** Alerts to display */
    alerts: Alert[];
    /** Show recommended levers section */
    showRecommendations?: boolean;
    /** Click handler for individual alert */
    onAlertClick?: (alert: Alert) => void;
    /** Title override */
    title?: string;
    /** Additional CSS class */
    className?: string;
}

// ============================================
// SEVERITY STYLES
// ============================================

const getSeverityClass = (severity: Alert['severity']): string => {
    switch (severity) {
        case 'critical':
            return styles.critical;
        case 'warning':
            return styles.warning;
        case 'info':
            return styles.info;
        default:
            return '';
    }
};

// ============================================
// COMPONENT
// ============================================

/**
 * AlertPanel - List of alerts sorted by severity
 *
 * Features:
 * - Automatic sorting by severity (critical first)
 * - Severity icons and color coding
 * - Recommended levers display (optional)
 * - Accessible with role="alert"
 */
export function AlertPanel({
    alerts,
    showRecommendations = false,
    onAlertClick,
    title = 'Alertes',
    className,
}: AlertPanelProps): React.ReactElement | null {
    // Sort alerts by severity (critical first)
    const sortedAlerts = sortAlertsBySeverity(alerts);

    // Empty state
    if (sortedAlerts.length === 0) {
        return (
            <div className={`${styles.panel} ${styles.empty} ${className || ''}`}>
                <h3 className={styles.title}>{title}</h3>
                <p className={styles.emptyMessage}>
                    ✅ Aucune alerte active
                </p>
            </div>
        );
    }

    return (
        <div className={`${styles.panel} ${className || ''}`}>
            <h3 className={styles.title}>
                {title}
                <span className={styles.count}>{sortedAlerts.length}</span>
            </h3>

            <ul className={styles.alertList} role="list">
                {sortedAlerts.map((alert) => (
                    <li
                        key={alert.id}
                        className={`${styles.alertItem} ${getSeverityClass(alert.severity)}`}
                        role="alert"
                        onClick={onAlertClick ? () => onAlertClick(alert) : undefined}
                    >
                        <div className={styles.alertHeader}>
                            <span className={styles.icon} aria-hidden="true">
                                {SEVERITY_ICONS[alert.severity]}
                            </span>
                            <span className={styles.alertTitle}>{alert.title}</span>
                        </div>

                        <p className={styles.alertDescription}>
                            {alert.description}
                        </p>

                        {alert.cause && (
                            <p className={styles.alertCause}>
                                <strong>Cause probable :</strong> {alert.cause}
                            </p>
                        )}

                        {showRecommendations && alert.recommendedLevers.length > 0 && (
                            <div className={styles.recommendations}>
                                <strong>Leviers conseillés :</strong>
                                <ul className={styles.leverList}>
                                    {alert.recommendedLevers.slice(0, 3).map((lever) => (
                                        <li key={lever} className={styles.leverItem}>
                                            {lever}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {alert.relatedIndex && (
                            <div className={styles.indexBadge}>
                                {alert.relatedIndex}: {alert.currentValue}
                                <span className={styles.threshold}>
                                    (seuil: {alert.threshold})
                                </span>
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default AlertPanel;
