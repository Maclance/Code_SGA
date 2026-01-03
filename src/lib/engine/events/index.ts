/**
 * Events Module - Public API
 *
 * @module lib/engine/events
 * @description Events system exports (US-033)
 */

// Event Types
export type {
    EventCategory,
    EventType,
    EventSeverity,
    EventImpact,
    GameEvent,
} from './event-types';

export {
    EVENT_TYPE_CONFIG,
    EVENT_SEVERITY_CONFIG,
    EVENT_CATEGORY_CONFIG,
    getEventTypeIcon,
    getEventTypeLabel,
    getSeverityColor,
    isCriticalEvent,
    sortEventsByTimestamp,
    filterEventsByType,
    getMostCriticalEvent,
} from './event-types';

// Event Formatter
export type { ImpactBadgeResult } from './event-formatter';

export {
    EventTypeEnum,
    formatEventNarrative,
    formatImpactBadge,
    formatSingleImpact,
    getEventNarrative,
    getRemainingDuration,
    formatDuration,
    isEventActive,
} from './event-formatter';
