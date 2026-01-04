/**
 * Lever Gating Logic
 *
 * @module lib/engine/levers/lever-gating
 * @description Lever filtering by difficulty level (US-034)
 *
 * Exports:
 * - getAvailableLevers(difficulty) — Returns levers accessible at given difficulty
 * - getAllLeversWithGating(difficulty) — Returns all levers with availability status
 * - isLeverAvailable(leverId, difficulty) — Checks if specific lever is available
 * - getLeverMinDifficulty(leverId) — Returns minimum difficulty for a lever
 */

import {
    LEVER_GATING_CATALOG,
    LEVER_IDS_BY_DIFFICULTY,
    type LeverGatingConfig,
    type GatingDifficulty,
    type LeverCategory,
    LEVER_CATEGORY_CONFIG,
} from './lever-config';

// ============================================
// TYPES
// ============================================

/**
 * Lever with gating status for UI display
 */
export interface LeverWithGating {
    lever: LeverGatingConfig;
    available: boolean;
    requiredDifficulty: GatingDifficulty;
}

/**
 * Levers grouped by category with gating status
 */
export interface LeversByCategory {
    category: LeverCategory;
    categoryName: string;
    categoryEmoji: string;
    levers: LeverWithGating[];
}

// ============================================
// DIFFICULTY HIERARCHY
// ============================================

const DIFFICULTY_LEVEL: Record<GatingDifficulty, number> = {
    novice: 1,
    intermediate: 2,
    expert: 3,
};

/**
 * Check if a difficulty meets or exceeds a required level
 */
function difficultyMeetsRequirement(
    sessionDifficulty: GatingDifficulty,
    requiredDifficulty: GatingDifficulty
): boolean {
    return DIFFICULTY_LEVEL[sessionDifficulty] >= DIFFICULTY_LEVEL[requiredDifficulty];
}

// ============================================
// CORE FUNCTIONS
// ============================================

/**
 * Get all levers available at the given difficulty level
 * 
 * @param difficulty - Session difficulty (novice, intermediate, expert)
 * @returns Array of lever configurations accessible at this difficulty
 * 
 * @example
 * const noviceLevers = getAvailableLevers('novice');
 * // Returns 10 levers
 * 
 * const intermediateLevers = getAvailableLevers('intermediate');
 * // Returns 18 levers (10 novice + 8 intermediate)
 */
export function getAvailableLevers(difficulty: GatingDifficulty): LeverGatingConfig[] {
    return LEVER_GATING_CATALOG.filter(
        lever => difficultyMeetsRequirement(difficulty, lever.minDifficulty)
    );
}

/**
 * Get all levers with their availability status for the given difficulty
 * Used for UI to show locked levers as "teaser"
 * 
 * @param difficulty - Session difficulty
 * @returns Array of levers with availability flag
 */
export function getAllLeversWithGating(difficulty: GatingDifficulty): LeverWithGating[] {
    return LEVER_GATING_CATALOG.map(lever => ({
        lever,
        available: difficultyMeetsRequirement(difficulty, lever.minDifficulty),
        requiredDifficulty: lever.minDifficulty,
    }));
}

/**
 * Get levers grouped by category with gating status
 * Optimized for tab-based UI display
 * 
 * @param difficulty - Session difficulty
 * @returns Array of categories with their levers and gating status
 */
export function getLeversByCategory(difficulty: GatingDifficulty): LeversByCategory[] {
    const leversWithGating = getAllLeversWithGating(difficulty);

    // Group by category
    const grouped = new Map<LeverCategory, LeverWithGating[]>();

    for (const lwg of leversWithGating) {
        const cat = lwg.lever.category;
        if (!grouped.has(cat)) {
            grouped.set(cat, []);
        }
        grouped.get(cat)!.push(lwg);
    }

    // Convert to array and sort by category order
    const result: LeversByCategory[] = [];

    for (const [category, levers] of grouped) {
        const config = LEVER_CATEGORY_CONFIG[category];
        result.push({
            category,
            categoryName: config.name,
            categoryEmoji: config.emoji,
            levers,
        });
    }

    // Sort by category order
    result.sort((a, b) =>
        LEVER_CATEGORY_CONFIG[a.category].order - LEVER_CATEGORY_CONFIG[b.category].order
    );

    return result;
}

/**
 * Check if a specific lever is available at the given difficulty
 * 
 * @param leverId - Lever ID (e.g., 'LEV-TAR-01')
 * @param difficulty - Session difficulty
 * @returns true if the lever can be activated
 * 
 * @example
 * isLeverAvailable('LEV-TAR-01', 'novice') // true
 * isLeverAvailable('LEV-TAR-02', 'novice') // false (requires intermediate)
 * isLeverAvailable('LEV-TAR-02', 'intermediate') // true
 */
export function isLeverAvailable(leverId: string, difficulty: GatingDifficulty): boolean {
    const lever = LEVER_GATING_CATALOG.find(l => l.id === leverId);
    if (!lever) {
        return false;
    }
    return difficultyMeetsRequirement(difficulty, lever.minDifficulty);
}

/**
 * Get the minimum difficulty required for a lever
 * 
 * @param leverId - Lever ID
 * @returns Minimum difficulty or undefined if lever not found
 */
export function getLeverMinDifficulty(leverId: string): GatingDifficulty | undefined {
    const lever = LEVER_GATING_CATALOG.find(l => l.id === leverId);
    return lever?.minDifficulty;
}

/**
 * Get lever configuration by ID
 * 
 * @param leverId - Lever ID
 * @returns Lever configuration or undefined if not found
 */
export function getLeverConfig(leverId: string): LeverGatingConfig | undefined {
    return LEVER_GATING_CATALOG.find(l => l.id === leverId);
}

/**
 * Get lever IDs available at a difficulty level (for quick lookups)
 * 
 * @param difficulty - Session difficulty
 * @returns Array of lever IDs
 */
export function getAvailableLeverIds(difficulty: GatingDifficulty): string[] {
    return LEVER_IDS_BY_DIFFICULTY[difficulty];
}

/**
 * Get the display label for a gating badge
 * 
 * @param requiredDifficulty - The required difficulty level
 * @param locale - Locale for translation (default: 'fr')
 * @returns Badge label string
 */
export function getGatingBadgeLabel(
    requiredDifficulty: GatingDifficulty,
    locale: 'fr' | 'en' = 'fr'
): string {
    const labels = {
        fr: {
            intermediate: 'Intermédiaire+',
            expert: 'Expert+',
        },
        en: {
            intermediate: 'Intermediate+',
            expert: 'Expert+',
        },
    };

    if (requiredDifficulty === 'novice') {
        return ''; // No badge needed for novice levers
    }

    return labels[locale][requiredDifficulty];
}

// ============================================
// STATISTICS HELPERS
// ============================================

/**
 * Get lever counts for a difficulty level
 * Used to verify AC1/AC2 (8-10 novice, 15-18 intermediate)
 */
export function getLeverCounts(difficulty: GatingDifficulty): {
    total: number;
    available: number;
    locked: number;
} {
    const all = LEVER_GATING_CATALOG.length;
    const available = getAvailableLevers(difficulty).length;

    return {
        total: all,
        available,
        locked: all - available,
    };
}
