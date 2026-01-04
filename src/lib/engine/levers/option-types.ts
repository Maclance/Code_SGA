/**
 * Lever Option Types
 *
 * @module lib/engine/levers/option-types
 * @description Type definitions for lever options and progressive levels (US-035)
 */

import { EffectType, IndexId } from '../effects-types';
import { LeverCost } from './lever-config';

// ============================================
// PRIMITIVE TYPES
// ============================================

/**
 * Definition of an effect applied by a lever
 */
export interface LeverEffectDefinition {
    target: IndexId;
    type: EffectType;
    value: number;
    delay?: number;
}

/**
 * Status of a progressive level
 */
export type LevelStatus = 'acquired' | 'available' | 'locked';

/**
 * Type of prerequisite for unlocking a level
 */
export type PrerequisiteType = 'index_min' | 'lever_active' | 'lever_level';

// ============================================
// CONFIGURATION TYPES
// ============================================

/**
 * Prerequisite definition
 */
export interface LeverPrerequisite {
    type: PrerequisiteType;
    target: string;
    value?: number | string;
}

/**
 * Mutually exclusive option (e.g. Price: Low / Standard / High)
 */
export interface LeverOption {
    id: string;
    label: string;
    effects?: LeverEffectDefinition[];
    meta?: Record<string, string>;
}

/**
 * Progressive level definition (e.g. Fraud N1 / N2 / N3)
 */
export interface LeverLevel {
    /** Level identifier (N1, N2, N3) */
    id: string;
    /** Cost specific to this level */
    cost: LeverCost;
    /** Effects applied by this level */
    effects: LeverEffectDefinition[];
    /** Prerequisites to unlock this level */
    prerequisites?: LeverPrerequisite[];
    /** Start availability difficulty */
    availableAt?: 'novice' | 'intermediate' | 'expert';
    /** Description for tooltip */
    description: string;
}

// ============================================
// EXTENDED LEVER CONFIG
// ============================================

/**
 * Mixin for levers with options
 */
export interface LeverWithOptions {
    options: LeverOption[];
    defaultOptionId?: string;
}

/**
 * Mixin for levers with progressive levels
 */
export interface LeverWithLevels {
    levels: Record<string, LeverLevel>;
}

// ============================================
// ACTION & STATE TYPES
// ============================================

/**
 * Action payload with optional sub-selection
 */
export interface LeverAction {
    /** ID of the lever activated */
    leverId: string;
    /** ID of the selected option (if mutually exclusive) */
    optionId?: string;
    /** ID of the target level (if progressive) */
    levelId?: string;
}

/**
 * State of active commercial levers
 * Used for prerequisite checking
 */
export interface ActiveLeversState {
    /** Map of leverId -> selected levelId (or true if basic lever) */
    [leverId: string]: boolean | string;
}
