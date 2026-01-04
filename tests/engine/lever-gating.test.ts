/**
 * Lever Gating Unit Tests
 *
 * @module tests/engine/lever-gating.test
 * @description Unit tests for lever gating by difficulty (US-034)
 *
 * References:
 * - docs/000_projet/specs_fonctionnelles_mvp.md (US-034)
 * - docs/20_simulation/leviers_catalogue.md
 * - docs/10_game_design/modes_difficultes.md
 */

import { describe, it, expect } from 'vitest';
import {
    getAvailableLevers,
    getAllLeversWithGating,
    getLeversByCategory,
    isLeverAvailable,
    getLeverMinDifficulty,
    getLeverConfig,
    getAvailableLeverIds,
    getGatingBadgeLabel,
    getLeverCounts,
    LEVER_GATING_CATALOG,
    type GatingDifficulty,
} from '@/lib/engine';

// ============================================
// AC1: NOVICE MODE (8-10 levers)
// ============================================

describe('getAvailableLevers - Novice', () => {
    it('should return 8-10 levers for Novice difficulty (AC1)', () => {
        const levers = getAvailableLevers('novice');

        expect(levers.length).toBeGreaterThanOrEqual(8);
        expect(levers.length).toBeLessThanOrEqual(10);
    });

    it('should only include levers with minDifficulty novice', () => {
        const levers = getAvailableLevers('novice');

        for (const lever of levers) {
            expect(lever.minDifficulty).toBe('novice');
        }
    });

    it('should include essential novice levers', () => {
        const levers = getAvailableLevers('novice');
        const leverIds = levers.map(l => l.id);

        // Core novice levers from leviers_catalogue.md
        expect(leverIds).toContain('LEV-TAR-01'); // Niveau de prime
        expect(leverIds).toContain('LEV-DIS-01'); // Mix canaux
        expect(leverIds).toContain('LEV-RH-01');  // Recrutement sinistres
        expect(leverIds).toContain('LEV-REA-01'); // Réassurance
    });
});

// ============================================
// AC2: INTERMEDIATE MODE (15-18 levers)
// ============================================

describe('getAvailableLevers - Intermediate', () => {
    it('should return 15-18 levers for Intermediate difficulty (AC2)', () => {
        const levers = getAvailableLevers('intermediate');

        expect(levers.length).toBeGreaterThanOrEqual(15);
        expect(levers.length).toBeLessThanOrEqual(18);
    });

    it('should include all Novice levers in Intermediate', () => {
        const noviceLevers = getAvailableLevers('novice');
        const intermediateLevers = getAvailableLevers('intermediate');

        for (const noviceLever of noviceLevers) {
            expect(intermediateLevers).toContainEqual(
                expect.objectContaining({ id: noviceLever.id })
            );
        }
    });

    it('should include intermediate-only levers', () => {
        const levers = getAvailableLevers('intermediate');
        const leverIds = levers.map(l => l.id);

        // Intermediate-only levers
        expect(leverIds).toContain('LEV-TAR-02'); // Segmentation
        expect(leverIds).toContain('LEV-RH-04');  // Formation
    });

    it('should have more levers than Novice', () => {
        const noviceCount = getAvailableLevers('novice').length;
        const intermediateCount = getAvailableLevers('intermediate').length;

        expect(intermediateCount).toBeGreaterThan(noviceCount);
    });
});

// ============================================
// LEVER AVAILABILITY CHECK
// ============================================

describe('isLeverAvailable', () => {
    it('should correctly identify novice lever availability', () => {
        expect(isLeverAvailable('LEV-TAR-01', 'novice')).toBe(true);
        expect(isLeverAvailable('LEV-TAR-01', 'intermediate')).toBe(true);
        expect(isLeverAvailable('LEV-TAR-01', 'expert')).toBe(true);
    });

    it('should correctly identify intermediate lever unavailable in novice', () => {
        // LEV-TAR-02 (Segmentation) is Intermediate only
        expect(isLeverAvailable('LEV-TAR-02', 'novice')).toBe(false);
        expect(isLeverAvailable('LEV-TAR-02', 'intermediate')).toBe(true);
        expect(isLeverAvailable('LEV-TAR-02', 'expert')).toBe(true);
    });

    it('should return false for unknown lever ID', () => {
        expect(isLeverAvailable('LEV-UNKNOWN-99', 'novice')).toBe(false);
        expect(isLeverAvailable('LEV-UNKNOWN-99', 'intermediate')).toBe(false);
    });
});

// ============================================
// GATING WITH AVAILABILITY STATUS
// ============================================

describe('getAllLeversWithGating', () => {
    it('should return all levers with availability status for Novice', () => {
        const leversWithGating = getAllLeversWithGating('novice');

        // Should include all levers from catalog
        expect(leversWithGating.length).toBe(LEVER_GATING_CATALOG.length);

        // Check availability flags
        const available = leversWithGating.filter(lwg => lwg.available);
        const locked = leversWithGating.filter(lwg => !lwg.available);

        expect(available.length).toBeGreaterThanOrEqual(8);
        expect(locked.length).toBeGreaterThan(0);
    });

    it('should mark intermediate levers as unavailable in Novice mode', () => {
        const leversWithGating = getAllLeversWithGating('novice');

        const segmentation = leversWithGating.find(lwg => lwg.lever.id === 'LEV-TAR-02');
        expect(segmentation).toBeDefined();
        expect(segmentation!.available).toBe(false);
        expect(segmentation!.requiredDifficulty).toBe('intermediate');
    });

    it('should mark all available in Intermediate for novice+intermediate levers', () => {
        const leversWithGating = getAllLeversWithGating('intermediate');

        const noviceAndIntermediate = leversWithGating.filter(
            lwg => lwg.lever.minDifficulty !== 'expert'
        );

        for (const lwg of noviceAndIntermediate) {
            expect(lwg.available).toBe(true);
        }
    });
});

// ============================================
// CATEGORY GROUPING
// ============================================

describe('getLeversByCategory', () => {
    it('should group levers by category', () => {
        const categories = getLeversByCategory('novice');

        expect(categories.length).toBeGreaterThan(0);

        for (const cat of categories) {
            expect(cat.category).toBeDefined();
            expect(cat.categoryName).toBeDefined();
            expect(cat.categoryEmoji).toBeDefined();
            expect(cat.levers.length).toBeGreaterThan(0);
        }
    });

    it('should include both available and locked levers per category', () => {
        const categories = getLeversByCategory('novice');

        // At least one category should have levers
        const totalLevers = categories.reduce(
            (sum, cat) => sum + cat.levers.length,
            0
        );
        expect(totalLevers).toBe(LEVER_GATING_CATALOG.length);
    });
});

// ============================================
// HELPER FUNCTIONS
// ============================================

describe('getLeverMinDifficulty', () => {
    it('should return correct difficulty for known levers', () => {
        expect(getLeverMinDifficulty('LEV-TAR-01')).toBe('novice');
        expect(getLeverMinDifficulty('LEV-TAR-02')).toBe('intermediate');
    });

    it('should return undefined for unknown lever', () => {
        expect(getLeverMinDifficulty('LEV-UNKNOWN')).toBeUndefined();
    });
});

describe('getLeverConfig', () => {
    it('should return full config for known lever', () => {
        const config = getLeverConfig('LEV-TAR-01');

        expect(config).toBeDefined();
        expect(config!.id).toBe('LEV-TAR-01');
        expect(config!.name).toBeDefined();
        expect(config!.description).toBeDefined();
        expect(config!.cost).toBeDefined();
        expect(config!.impactPreview).toBeDefined();
    });

    it('should return undefined for unknown lever', () => {
        expect(getLeverConfig('LEV-UNKNOWN')).toBeUndefined();
    });
});

describe('getGatingBadgeLabel', () => {
    it('should return correct French labels', () => {
        expect(getGatingBadgeLabel('intermediate', 'fr')).toBe('Intermédiaire+');
        expect(getGatingBadgeLabel('expert', 'fr')).toBe('Expert+');
    });

    it('should return correct English labels', () => {
        expect(getGatingBadgeLabel('intermediate', 'en')).toBe('Intermediate+');
        expect(getGatingBadgeLabel('expert', 'en')).toBe('Expert+');
    });

    it('should return empty string for novice', () => {
        expect(getGatingBadgeLabel('novice', 'fr')).toBe('');
    });
});

describe('getLeverCounts', () => {
    it('should return correct counts for Novice', () => {
        const counts = getLeverCounts('novice');

        expect(counts.available).toBeGreaterThanOrEqual(8);
        expect(counts.available).toBeLessThanOrEqual(10);
        expect(counts.locked).toBeGreaterThan(0);
        expect(counts.total).toBe(LEVER_GATING_CATALOG.length);
        expect(counts.available + counts.locked).toBe(counts.total);
    });

    it('should return correct counts for Intermediate', () => {
        const counts = getLeverCounts('intermediate');

        expect(counts.available).toBeGreaterThanOrEqual(15);
        expect(counts.available).toBeLessThanOrEqual(18);
        expect(counts.available + counts.locked).toBe(counts.total);
    });
});

// ============================================
// PERFORMANCE TEST
// ============================================

describe('Performance', () => {
    it('should filter levers in under 20ms', () => {
        const start = performance.now();

        // Run filtering 100 times
        for (let i = 0; i < 100; i++) {
            getAvailableLevers('intermediate');
        }

        const elapsed = performance.now() - start;
        const avgTime = elapsed / 100;

        expect(avgTime).toBeLessThan(20);
    });
});
