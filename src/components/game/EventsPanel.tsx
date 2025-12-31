/**
 * EventsPanel Component
 * 
 * @module components/game/EventsPanel
 * @description Shows active market and company events (US-014)
 */

'use client';

import React from 'react';
import styles from './EventsPanel.module.css';

interface ActiveEvent {
    eventId: string;
    eventType: 'marche' | 'compagnie';
    name?: string;
    description?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    impacts: Record<string, number>;
    durationTurns: number;
    turnTriggered: number;
}

interface EventsPanelProps {
    events: ActiveEvent[];
    turnNumber: number;
    onContinue: () => void;
}

const EVENT_TYPE_LABELS = {
    marche: { name: 'Événement Marché', emoji: '🌍' },
    compagnie: { name: 'Événement Compagnie', emoji: '🏢' },
};

const SEVERITY_COLORS = {
    low: '#4ade80',
    medium: '#facc15',
    high: '#fb923c',
    critical: '#f87171',
};

const SAMPLE_EVENTS: ActiveEvent[] = [
    {
        eventId: 'EVT-INF-01',
        eventType: 'marche',
        name: 'Inflation Persistante',
        description: 'La hausse des coûts impacte la sévérité des sinistres',
        severity: 'medium',
        impacts: { IPP: -3, IS: -2 },
        durationTurns: 4,
        turnTriggered: 1,
    },
    {
        eventId: 'EVT-CLI-01',
        eventType: 'marche',
        name: 'Épisode Climatique',
        description: 'Tempête hivernale - sinistralité MRH en hausse',
        severity: 'high',
        impacts: { IPP: -5, IRF: -3 },
        durationTurns: 2,
        turnTriggered: 1,
    },
];

export function EventsPanel({ events, turnNumber: _turnNumber, onContinue }: EventsPanelProps) {
    // Use sample events if no events provided
    const displayEvents = events.length > 0 ? events : SAMPLE_EVENTS;

    return (
        <div className={styles.container}>
            <div className={styles.intro}>
                <p>
                    Ces événements affectent votre compagnie ce trimestre.
                    Prenez-les en compte dans vos décisions.
                </p>
            </div>

            {displayEvents.length === 0 ? (
                <div className={styles.noEvents}>
                    <span className={styles.noEventsEmoji}>☀️</span>
                    <h3>Pas d&apos;événement majeur</h3>
                    <p>Ce trimestre se présente sous de bons auspices.</p>
                </div>
            ) : (
                <div className={styles.eventsList}>
                    {displayEvents.map((event) => {
                        const typeInfo = EVENT_TYPE_LABELS[event.eventType];
                        const severityColor = event.severity
                            ? SEVERITY_COLORS[event.severity]
                            : SEVERITY_COLORS.medium;

                        return (
                            <div
                                key={event.eventId}
                                className={styles.eventCard}
                                style={{ borderLeftColor: severityColor }}
                            >
                                <div className={styles.eventHeader}>
                                    <span className={styles.eventEmoji}>{typeInfo.emoji}</span>
                                    <div className={styles.eventMeta}>
                                        <span className={styles.eventType}>{typeInfo.name}</span>
                                        <span
                                            className={styles.severity}
                                            style={{ backgroundColor: severityColor }}
                                        >
                                            {event.severity || 'medium'}
                                        </span>
                                    </div>
                                </div>

                                <h4 className={styles.eventName}>
                                    {event.name || event.eventId}
                                </h4>

                                <p className={styles.eventDesc}>
                                    {event.description || 'Impact sur la performance'}
                                </p>

                                <div className={styles.eventDetails}>
                                    <div className={styles.impacts}>
                                        {Object.entries(event.impacts).map(([key, value]) => (
                                            <span
                                                key={key}
                                                className={styles.impact}
                                                style={{ color: value < 0 ? '#f87171' : '#4ade80' }}
                                            >
                                                {key}: {value > 0 ? '+' : ''}{value}
                                            </span>
                                        ))}
                                    </div>
                                    <span className={styles.duration}>
                                        ⏱️ {event.durationTurns} tour{event.durationTurns > 1 ? 's' : ''}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className={styles.actions}>
                <button className={styles.continueBtn} onClick={onContinue}>
                    Prendre des décisions →
                </button>
            </div>
        </div>
    );
}
