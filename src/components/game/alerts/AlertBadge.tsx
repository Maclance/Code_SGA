/**
 * AlertBadge Component - Compact alert indicator
 *
 * @module components/game/alerts/AlertBadge
 * @description Badge component for displaying alert severity (US-032)
 */

import React from 'react';
import type { Alert, AlertSeverity } from '@/lib/engine';
import { SEVERITY_ICONS } from '@/lib/engine';
import styles from './AlertBadge.module.css';

// ============================================
// PROPS
// ============================================

export interface AlertBadgeProps {
    /** Alert to display */
    alert: Alert;
    /** Compact mode (icon only) */
    compact?: boolean;
    /** Click handler */
    onClick?: (alert: Alert) => void;
    /** Additional CSS class */
    className?: string;
}

// ============================================
// SEVERITY CLASS MAPPING
// ============================================

const getSeverityClass = (severity: AlertSeverity): string => {
    switch (severity) {
        case 'critical':
            return styles.critical;
        case 'warning':
            return styles.warning;
        case 'info':
            return styles.info;
        default:
            return styles.info;
    }
};

// ============================================
// COMPONENT
// ============================================

/**
 * AlertBadge - Compact alert indicator with severity icon
 *
 * Displays:
 * - Severity icon (🔴 critical, ⚠️ warning, 💡 info)
 * - Alert title (unless compact mode)
 * - Click handler for details
 */
export function AlertBadge({
    alert,
    compact = false,
    onClick,
    className,
}: AlertBadgeProps): React.ReactElement {
    const icon = SEVERITY_ICONS[alert.severity];
    const severityClass = getSeverityClass(alert.severity);

    const handleClick = () => {
        if (onClick) {
            onClick(alert);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
        }
    };

    return (
        <div
            className={`${styles.badge} ${severityClass} ${className || ''}`}
            role="status"
            aria-label={`Alerte ${alert.severity}: ${alert.title}`}
            onClick={onClick ? handleClick : undefined}
            onKeyDown={onClick ? handleKeyDown : undefined}
            tabIndex={onClick ? 0 : undefined}
        >
            <span className={styles.icon} aria-hidden="true">
                {icon}
            </span>
            {!compact && (
                <span className={styles.title}>{alert.title}</span>
            )}
        </div>
    );
}

export default AlertBadge;
