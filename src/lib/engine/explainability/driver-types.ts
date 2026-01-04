/**
 * Explainability Types - Driver Analysis Definitions
 *
 * @module lib/engine/explainability/driver-types
 * @description Type definitions for the explainability system (US-037)
 */

import type { IndexId } from '../types';
import type { ProductDecision } from '../product-types';
import type { GameEvent } from '../events/event-types';
import type { DelayedEffect } from '../effects-types';

// ============================================
// DRIVER TYPES
// ============================================

/**
 * Type of driver (cause of variation)
 */
export enum DriverType {
    DECISION = 'DECISION',
    EVENT = 'EVENT',
    DELAYED_EFFECT = 'DELAYED_EFFECT'
}

/**
 * Direction of the contribution
 */
export type ContributionDirection = 'up' | 'down' | 'neutral';

/**
 * A driver explaining an index variation
 * AC2: Driver types = decision / event / delayed effect
 */
export interface Driver {
    /** Unique ID of the driver source (decision ID, event ID, etc.) */
    sourceId: string;
    /** Type of driver */
    type: DriverType;
    /** Human-readable description (e.g. "Baisse tarif (-3%)") */
    label: string;
    /** Contribution value (can be positive or negative) */
    contribution: number;
    /** AC3: Contribution as percentage of total variation */
    contributionPercent: number;
    /** Impact direction */
    direction: ContributionDirection;
}

/**
 * Formatted driver for UI display
 */
export interface FormattedDriver extends Driver {
    /** Icon representing the driver type (📊, 🌍, ⏳) */
    icon: string;
    /** Formatted contribution string (e.g. "+5", "-3") */
    formattedContribution: string;
}

// ============================================
// ANALYSIS CONTEXT
// ============================================

/**
 * Context required to analyze drivers
 */
export interface AnalysisContext {
    /** Decisions made in the current turn (immediate effects) */
    currentDecisions: ProductDecision[];
    /** Events active in the current turn */
    activeEvents: GameEvent[];
    /** Delayed effects applied in the current turn */
    appliedEffects: DelayedEffect[];
}

/**
 * Result of the driver analysis
 * AC1: Top 3 drivers displayed
 */
export interface AnalysisResult {
    /** The index being analyzed */
    indexId: IndexId;
    /** Previous value of the index */
    previousValue: number;
    /** Current value of the index */
    currentValue: number;
    /** Total variation */
    variation: number;
    /** Top contributing drivers (max 3) */
    drivers: Driver[];
}
