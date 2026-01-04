/**
 * Lever Helper Functions
 *
 * @module lib/engine/levers/levers-helper
 * @description Utilities for lever options and progressive levels logic (US-035)
 */

import { LeverGatingConfig } from './lever-config';
import {
    ActiveLeversState,
    LevelStatus,
    LeverAction,
    LeverEffectDefinition,
    LeverLevel,
    LeverOption,
    LeverPrerequisite,
    LeverWithLevels,
    LeverWithOptions
} from './option-types';
import { IndicesState } from '../types';

// ============================================
// TYPE GUARDS
// ============================================

/**
 * Check if a lever has options
 */
export function hasOptions(lever: any): lever is LeverWithOptions {
    return 'options' in lever && Array.isArray(lever.options) && lever.options.length > 0;
}

/**
 * Check if a lever has progressive levels
 */
export function hasLevels(lever: any): lever is LeverWithLevels {
    return 'levels' in lever && typeof lever.levels === 'object';
}

// ============================================
// PREREQUISITES LOGIC
// ============================================

/**
 * Check if a single prerequisite is met
 */
function checkPrerequisite(
    prerequisite: LeverPrerequisite,
    activeLevers: ActiveLeversState,
    indices?: IndicesState
): boolean {
    const { type, target, value } = prerequisite;

    switch (type) {
        case 'lever_active':
            // Check if lever is present in active map
            return !!activeLevers[target];

        case 'lever_level':
            // Check if lever is active AND at specific level
            // Note: activeLevers value is either boolean (true) or string (levelId)
            if (typeof value !== 'string') return false;
            return activeLevers[target] === value;

        case 'index_min':
            // Check if index value meets threshold
            if (!indices || typeof value !== 'number') return true; // Fail safe if no indices provided
            return (indices[target as keyof IndicesState] || 0) >= value;

        default:
            return true;
    }
}

/**
 * Check if all prerequisites for a level are met
 */
export function checkLevelPrerequisites(
    levelConfig: LeverLevel,
    activeLevers: ActiveLeversState,
    indices?: IndicesState
): boolean {
    if (!levelConfig.prerequisites || levelConfig.prerequisites.length === 0) {
        return true;
    }

    return levelConfig.prerequisites.every(p =>
        checkPrerequisite(p, activeLevers, indices)
    );
}

/**
 * Get list of missing prerequisites (for tooltip)
 */
export function getLevelMissingPrerequisites(
    levelConfig: LeverLevel,
    activeLevers: ActiveLeversState,
    indices?: IndicesState
): string[] {
    if (!levelConfig.prerequisites) return [];

    return levelConfig.prerequisites
        .filter(p => !checkPrerequisite(p, activeLevers, indices))
        .map(p => {
            switch (p.type) {
                case 'lever_active':
                    return `Levier ${p.target} requis`;
                case 'lever_level':
                    return `Levier ${p.target} niveau ${p.value} requis`;
                case 'index_min':
                    return `Indice ${p.target} >= ${p.value} requis`;
                default:
                    return 'Prérequis manquant';
            }
        });
}

/**
 * Determine the status of a level (acquired, available, locked)
 */
export function getLevelStatus(
    leverId: string,
    levelId: string,
    activeLevers: ActiveLeversState,
    levelConfig: LeverLevel,
    indices?: IndicesState
): LevelStatus {
    // 1. Check if already acquired
    // activeLevers[leverId] stores the current acquired level (e.g. 'N1')
    // A level is acquired if it matches the current active level
    // OR if it's a lower level than the current active level (e.g. N1 is acquired if N2 is active)
    const currentLevel = activeLevers[leverId];

    if (currentLevel === levelId) {
        return 'acquired';
    }

    // Logic for lower levels: N1 is acquired if we are at N2
    if (typeof currentLevel === 'string') {
        // Simple comparison assuming N1 < N2 < N3 format
        if (levelId < currentLevel) {
            return 'acquired';
        }
    }

    // 2. Check prerequisites
    const unlocked = checkLevelPrerequisites(levelConfig, activeLevers, indices);

    return unlocked ? 'available' : 'locked';
}

// ============================================
// EFFECT RESOLUTION LOGIC
// ============================================

/**
 * Resolve effects based on selected option or level
 */
export function resolveLeverEffects(
    lever: LeverGatingConfig & Partial<LeverWithOptions> & Partial<LeverWithLevels>,
    action: LeverAction
): LeverEffectDefinition[] {
    // 1. Progressive Levels
    if (hasLevels(lever) && action.levelId) {
        const levelConfig = lever.levels[action.levelId];
        return levelConfig ? levelConfig.effects : [];
    }

    // 2. Mutually Exclusive Options
    if (hasOptions(lever) && action.optionId) {
        const optionConfig = lever.options.find(o => o.id === action.optionId);
        return optionConfig && optionConfig.effects ? optionConfig.effects : [];
    }

    // 3. Fallback: Standard Effects (managed externally for simple levers? or stored on lever?)
    // Note: LeverGatingConfig currently doesn't store 'effects', they are in the full catalog definition
    // For now, we return empty array if no specific option/level behavior found
    return [];
}
