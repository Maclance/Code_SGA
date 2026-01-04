/**
 * EventCard Component
 *
 * @module components/game/events/EventCard
 * @description Individual event card with type icon, narrative, impact badge (US-033)
 */

'use client';

import React from 'react';
import type { GameEvent } from '@/lib/engine';
import {
    getEventTypeIcon,
    getEventTypeLabel,
    getSeverityColor,
    formatImpactBadge,
    formatSingleImpact,
    getEventNarrative,
    getRemainingDuration,
    formatDuration,
    EVENT_CATEGORY_CONFIG,
} from '@/lib/engine';
import styles from './EventCard.module.css';

export interface EventCardProps {
    /** The event to display */
    event: GameEvent;
    /** Current turn number for duration calculation */
    currentTurn: number;
    /** Whether to show detailed impacts */
    showDetails?: boolean;
    /** Click handler for expanding details */
    onClick?: () => void;
}

/**
 * EventCard displays a single game event with engaging narrative style
 *
 * Features:
 * - Type icon (🌍 market / 🏢 company)
 * - Catchy title with category badge
 * - Narrative description (≥50 chars)
 * - Impact badge (✅ positive / ❌ negative / ⚪ neutral)
 * - Duration remaining indicator
 * - Smooth fade-in animation
 */
export function EventCard({
    event,
    currentTurn,
    showDetails = false,
    onClick,
}: EventCardProps) {
    const typeIcon = getEventTypeIcon(event.type);
    const typeLabel = getEventTypeLabel(event.type);
    const severityColor = getSeverityColor(event.severity);
    const narrative = getEventNarrative(event);
    const remainingDuration = getRemainingDuration(event, currentTurn);
    const durationText = formatDuration(remainingDuration);
    const impactBadge = formatImpactBadge(event.impacts);
    const categoryConfig = EVENT_CATEGORY_CONFIG[event.category];

    return (
        <article
            className={styles.card}
            style={{ '--severity-color': severityColor } as React.CSSProperties}
            role="article"
            aria-label={`Événement: ${event.name}`}
            onClick={onClick}
            onKeyDown={(e) => {
                if (onClick && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onClick();
                }
            }}
            tabIndex={onClick ? 0 : undefined}
        >
            {/* Header with type and category */}
            <header className={styles.header}>
                <div className={styles.typeInfo}>
                    <span className={styles.typeIcon} aria-hidden="true">
                        {typeIcon}
                    </span>
                    <span className={styles.typeLabel}>{typeLabel}</span>
                </div>
                <div className={styles.badges}>
                    <span
                        className={styles.categoryBadge}
                        aria-label={`Catégorie: ${categoryConfig.label}`}
                    >
                        {categoryConfig.icon} {categoryConfig.label}
                    </span>
                    <span
                        className={styles.severityBadge}
                        style={{ backgroundColor: severityColor }}
                        aria-label={`Sévérité: ${event.severity}`}
                    >
                        {event.severity}
                    </span>
                </div>
            </header>

            {/* Title */}
            <h3 className={styles.title}>{event.name}</h3>

            {/* Narrative description */}
            <p className={styles.narrative}>{narrative}</p>

            {/* Impact and Duration footer */}
            <footer className={styles.footer}>
                <div className={styles.impactBadge} data-type={impactBadge.type}>
                    <span aria-hidden="true">{impactBadge.icon}</span>
                    <span>{impactBadge.label}</span>
                </div>
                <div className={styles.duration}>
                    <span aria-hidden="true">⏱️</span>
                    <span>{durationText}</span>
                </div>
            </footer>

            {/* Detailed impacts (expandable) */}
            {showDetails && event.impacts.length > 0 && (
                <div className={styles.details} aria-label="Détails des impacts">
                    <h4 className={styles.detailsTitle}>Impacts détaillés</h4>
                    <ul className={styles.impactsList}>
                        {event.impacts.map((impact, index) => (
                            <li
                                key={`${impact.target}-${index}`}
                                className={styles.impactItem}
                                data-direction={impact.value >= 0 ? 'positive' : 'negative'}
                            >
                                {formatSingleImpact(impact)}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </article>
    );
}

export default EventCard;
