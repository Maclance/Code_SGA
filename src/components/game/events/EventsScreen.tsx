/**
 * EventsScreen Component
 *
 * @module components/game/events/EventsScreen
 * @description Main events screen with list and NewsFlashBanner (US-033)
 */

'use client';

import React, { useState, useMemo } from 'react';
import type { GameEvent } from '@/lib/engine';
import {
    sortEventsByTimestamp,
    getMostCriticalEvent,
    isCriticalEvent,
} from '@/lib/engine';
import { EventCard } from './EventCard';
import { NewsFlashBanner } from './NewsFlashBanner';
import styles from './EventsScreen.module.css';

export interface EventsScreenProps {
    /** List of events to display */
    events: GameEvent[];
    /** Current turn number */
    currentTurn: number;
    /** Whether to show the flash banner for critical events */
    showFlash?: boolean;
    /** Handler for continuing to next phase */
    onContinue?: () => void;
    /** Optional title override */
    title?: string;
}

/**
 * EventsScreen displays all game events in a scrollable list
 *
 * Features:
 * - NewsFlashBanner for critical events
 * - Chronological sorting (newest first)
 * - Scrollable event list
 * - Empty state handling
 * - Smooth animations
 */
export function EventsScreen({
    events,
    currentTurn,
    showFlash = true,
    onContinue,
    title = 'Événements du trimestre',
}: EventsScreenProps) {
    const [flashDismissed, setFlashDismissed] = useState(false);
    const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

    // Sort events by timestamp descending (newest first)
    const sortedEvents = useMemo(() => sortEventsByTimestamp(events), [events]);

    // Get the most critical event for the flash banner
    const criticalEvent = useMemo(() => {
        if (!showFlash || flashDismissed) return null;
        const mostCritical = getMostCriticalEvent(events);
        return mostCritical && isCriticalEvent(mostCritical) ? mostCritical : null;
    }, [events, showFlash, flashDismissed]);

    const handleEventClick = (eventId: string) => {
        setExpandedEventId(prev => (prev === eventId ? null : eventId));
    };

    const handleDismissFlash = () => {
        setFlashDismissed(true);
    };

    return (
        <section
            className={styles.screen}
            aria-labelledby="events-title"
        >
            {/* Header */}
            <header className={styles.header}>
                <h1 id="events-title" className={styles.title}>
                    {title}
                </h1>
                {sortedEvents.length > 0 && (
                    <span className={styles.count}>
                        {sortedEvents.length} événement{sortedEvents.length > 1 ? 's' : ''}
                    </span>
                )}
            </header>

            {/* News Flash Banner for critical events */}
            {criticalEvent && (
                <NewsFlashBanner
                    event={criticalEvent}
                    onDismiss={handleDismissFlash}
                />
            )}

            {/* Event List */}
            {sortedEvents.length === 0 ? (
                <div className={styles.emptyState}>
                    <span className={styles.emptyIcon} aria-hidden="true">
                        ☀️
                    </span>
                    <h2 className={styles.emptyTitle}>Pas d&apos;événement majeur</h2>
                    <p className={styles.emptyText}>
                        Ce trimestre se présente sous de bons auspices.
                        Aucun événement externe ne vient perturber vos opérations.
                    </p>
                </div>
            ) : (
                <div
                    className={styles.eventsList}
                    role="list"
                    aria-label="Liste des événements"
                >
                    {sortedEvents.map((event, index) => (
                        <div
                            key={event.id}
                            className={styles.eventItem}
                            style={{ animationDelay: `${index * 0.1}s` }}
                            role="listitem"
                        >
                            <EventCard
                                event={event}
                                currentTurn={currentTurn}
                                showDetails={expandedEventId === event.id}
                                onClick={() => handleEventClick(event.id)}
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Continue button */}
            {onContinue && (
                <footer className={styles.footer}>
                    <button
                        className={styles.continueButton}
                        onClick={onContinue}
                        type="button"
                    >
                        Prendre des décisions →
                    </button>
                </footer>
            )}
        </section>
    );
}

export default EventsScreen;
