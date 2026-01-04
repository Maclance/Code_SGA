/**
 * Event Types - Game Event Definitions
 *
 * @module lib/engine/events/event-types
 * @description Type definitions for game events (US-033)
 *
 * References:
 * - docs/20_simulation/events_catalogue.md (event specifications)
 * - docs/000_projet/specs_fonctionnelles_mvp.md (US-033)
 */

// ============================================
// EVENT CATEGORIES
// ============================================

/**
 * Event category types based on events_catalogue.md
 */
export type EventCategory =
    | 'CLIMAT'
    | 'ECONOMIQUE'
    | 'REGLEMENTAIRE'
    | 'TECHNOLOGIQUE'
    | 'RH'
    | 'OPERATIONNEL'
    | 'CYBER';

/**
 * Event type: market (systemic) or company (idiosyncratic)
 */
export type EventType = 'market' | 'company';

/**
 * Event severity levels
 */
export type EventSeverity = 'low' | 'medium' | 'high' | 'critical';

// ============================================
// EVENT IMPACT
// ============================================

/**
 * Individual impact of an event on a target index or variable
 */
export interface EventImpact {
    /** Target index or variable name */
    target: string;
    /** Impact value (positive or negative) */
    value: number;
    /** Type of impact: absolute points or relative percentage */
    type: 'absolute' | 'relative';
}

// ============================================
// GAME EVENT
// ============================================

/**
 * Complete game event structure
 */
export interface GameEvent {
    /** Unique event identifier */
    id: string;
    /** Event type: market (systemic) or company (idiosyncratic) */
    type: EventType;
    /** Event category */
    category: EventCategory;
    /** Event name/title */
    name: string;
    /** Event severity level */
    severity: EventSeverity;
    /** List of impacts on indices/variables */
    impacts: EventImpact[];
    /** Duration in turns */
    duration: number;
    /** ISO timestamp when event was triggered */
    timestamp: string;
    /** Turn number when event was triggered */
    turnTriggered: number;
    /** Optional narrative description */
    narrative?: string;
}

// ============================================
// EVENT DISPLAY HELPERS
// ============================================

/**
 * Event type display configuration
 */
export const EVENT_TYPE_CONFIG: Record<EventType, { icon: string; label: string }> = {
    market: { icon: '🌍', label: 'Événement Marché' },
    company: { icon: '🏢', label: 'Événement Compagnie' },
} as const;

/**
 * Event severity display configuration
 */
export const EVENT_SEVERITY_CONFIG: Record<EventSeverity, { icon: string; color: string; label: string }> = {
    low: { icon: '🟢', color: '#4ade80', label: 'Faible' },
    medium: { icon: '🟡', color: '#facc15', label: 'Modéré' },
    high: { icon: '🟠', color: '#fb923c', label: 'Élevé' },
    critical: { icon: '🔴', color: '#f87171', label: 'Critique' },
} as const;

/**
 * Event category display configuration
 */
export const EVENT_CATEGORY_CONFIG: Record<EventCategory, { icon: string; label: string }> = {
    CLIMAT: { icon: '🌪️', label: 'Climat' },
    ECONOMIQUE: { icon: '📈', label: 'Économique' },
    REGLEMENTAIRE: { icon: '⚖️', label: 'Réglementaire' },
    TECHNOLOGIQUE: { icon: '💻', label: 'Technologique' },
    RH: { icon: '👥', label: 'Ressources Humaines' },
    OPERATIONNEL: { icon: '⚙️', label: 'Opérationnel' },
    CYBER: { icon: '🔓', label: 'Cyber' },
} as const;

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get the icon for an event type
 */
export function getEventTypeIcon(type: EventType): string {
    return EVENT_TYPE_CONFIG[type].icon;
}

/**
 * Get the label for an event type
 */
export function getEventTypeLabel(type: EventType): string {
    return EVENT_TYPE_CONFIG[type].label;
}

/**
 * Get the severity color
 */
export function getSeverityColor(severity: EventSeverity): string {
    return EVENT_SEVERITY_CONFIG[severity].color;
}

/**
 * Check if an event is critical
 */
export function isCriticalEvent(event: GameEvent): boolean {
    return event.severity === 'critical';
}

/**
 * Sort events by timestamp descending (newest first)
 */
export function sortEventsByTimestamp(events: GameEvent[]): GameEvent[] {
    return [...events].sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
}

/**
 * Filter events by type
 */
export function filterEventsByType(events: GameEvent[], type: EventType): GameEvent[] {
    return events.filter(e => e.type === type);
}

/**
 * Get the most critical event from a list
 */
export function getMostCriticalEvent(events: GameEvent[]): GameEvent | null {
    const severityOrder: EventSeverity[] = ['critical', 'high', 'medium', 'low'];

    for (const severity of severityOrder) {
        const event = events.find(e => e.severity === severity);
        if (event) return event;
    }

    return events[0] || null;
}
