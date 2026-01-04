/**
 * NewsFlashBanner Component
 *
 * @module components/game/events/NewsFlashBanner
 * @description Breaking news banner for critical events (US-033)
 */

'use client';

import React from 'react';
import type { GameEvent } from '@/lib/engine';
import {
    getEventTypeIcon,
    getSeverityColor,
    getEventNarrative,
} from '@/lib/engine';
import styles from './NewsFlashBanner.module.css';

export interface NewsFlashBannerProps {
    /** The critical event to display */
    event: GameEvent;
    /** Handler to dismiss the banner */
    onDismiss?: () => void;
}

/**
 * NewsFlashBanner displays a breaking news style banner for critical events
 *
 * Features:
 * - Prominent "BREAKING NEWS" header
 * - Slide-in animation
 * - Event narrative with urgency
 * - role="banner" for accessibility
 */
export function NewsFlashBanner({ event, onDismiss }: NewsFlashBannerProps) {
    const typeIcon = getEventTypeIcon(event.type);
    const severityColor = getSeverityColor(event.severity);
    const narrative = getEventNarrative(event);

    return (
        <div
            className={styles.banner}
            role="banner"
            aria-live="assertive"
            aria-label={`Alerte flash: ${event.name}`}
            style={{ '--severity-color': severityColor } as React.CSSProperties}
        >
            <div className={styles.flashHeader}>
                <span className={styles.flashIcon} aria-hidden="true">
                    ⚡
                </span>
                <span className={styles.flashLabel}>FLASH INFO</span>
                <span className={styles.flashIcon} aria-hidden="true">
                    ⚡
                </span>
            </div>

            <div className={styles.content}>
                <span className={styles.typeIcon} aria-hidden="true">
                    {typeIcon}
                </span>
                <div className={styles.eventInfo}>
                    <h2 className={styles.title}>{event.name}</h2>
                    <p className={styles.narrative}>{narrative}</p>
                </div>
            </div>

            {onDismiss && (
                <button
                    className={styles.dismissButton}
                    onClick={onDismiss}
                    aria-label="Fermer l'alerte"
                    type="button"
                >
                    ✕
                </button>
            )}
        </div>
    );
}

export default NewsFlashBanner;
