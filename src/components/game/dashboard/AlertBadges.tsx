/**
 * AlertBadges Component
 *
 * @module components/game/dashboard/AlertBadges
 * @description Alert badges showing threshold-based warnings (US-030)
 */

'use client';

import React from 'react';
import styles from './AlertBadges.module.css';
import type { DashboardAlert, AlertType } from '@/lib/engine';

// ============================================
// TYPES
// ============================================

export interface AlertBadgesProps {
    /** Alerts to display */
    alerts: DashboardAlert[];
    /** Max alerts to show (rest collapsed) */
    maxVisible?: number;
    /** Compact display mode */
    compact?: boolean;
    /** Callback when alert is clicked */
    onAlertClick?: (alert: DashboardAlert) => void;
    /** Locale for formatting */
    locale?: 'fr' | 'en';
}

// ============================================
// ICONS
// ============================================

const ALERT_ICONS: Record<AlertType, string> = {
    critical: '🔴',
    warning: '🟠',
    info: '🔵',
};

const LABELS = {
    fr: {
        noAlerts: 'Aucune alerte',
        showMore: 'Voir plus',
        showLess: 'Voir moins',
        suggestedActions: 'Actions suggérées',
    },
    en: {
        noAlerts: 'No alerts',
        showMore: 'Show more',
        showLess: 'Show less',
        suggestedActions: 'Suggested actions',
    },
};

// ============================================
// COMPONENT
// ============================================

export function AlertBadges({
    alerts,
    maxVisible = 3,
    compact = false,
    onAlertClick,
    locale = 'fr',
}: AlertBadgesProps) {
    const [expanded, setExpanded] = React.useState(false);
    const labels = LABELS[locale];

    // Sort alerts by severity
    const sortedAlerts = [...alerts].sort((a, b) => {
        const priority: Record<AlertType, number> = { critical: 0, warning: 1, info: 2 };
        return priority[a.type] - priority[b.type];
    });

    const visibleAlerts = expanded ? sortedAlerts : sortedAlerts.slice(0, maxVisible);
    const hasMore = sortedAlerts.length > maxVisible;

    if (alerts.length === 0) {
        return (
            <div className={styles.empty} role="status">
                <span className={styles.emptyIcon}>✅</span>
                <span className={styles.emptyText}>{labels.noAlerts}</span>
            </div>
        );
    }

    return (
        <div className={styles.container} role="alert" aria-live="polite">
            <div className={`${styles.alerts} ${compact ? styles.compact : ''}`}>
                {visibleAlerts.map((alert) => (
                    <article
                        key={alert.id}
                        className={`${styles.alert} ${styles[alert.type]}`}
                        onClick={() => onAlertClick?.(alert)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                onAlertClick?.(alert);
                            }
                        }}
                    >
                        <div className={styles.alertHeader}>
                            <span className={styles.alertIcon}>
                                {ALERT_ICONS[alert.type]}
                            </span>
                            <span className={styles.alertTitle}>{alert.title}</span>
                            {alert.relatedIndex && (
                                <span className={styles.indexBadge}>{alert.relatedIndex}</span>
                            )}
                        </div>

                        {!compact && (
                            <>
                                <p className={styles.alertDescription}>{alert.description}</p>

                                {alert.suggestedActions.length > 0 && (
                                    <div className={styles.suggestedActions}>
                                        <span className={styles.suggestedLabel}>
                                            {labels.suggestedActions}:
                                        </span>
                                        <ul className={styles.actionList}>
                                            {alert.suggestedActions.slice(0, 2).map((action, i) => (
                                                <li key={i} className={styles.actionItem}>
                                                    {action}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </>
                        )}
                    </article>
                ))}
            </div>

            {hasMore && (
                <button
                    className={styles.toggleButton}
                    onClick={() => setExpanded(!expanded)}
                    aria-expanded={expanded}
                >
                    {expanded ? labels.showLess : `${labels.showMore} (${sortedAlerts.length - maxVisible})`}
                </button>
            )}
        </div>
    );
}

export default AlertBadges;
