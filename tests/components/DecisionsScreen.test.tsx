/**
 * DecisionsScreen Integration Tests
 *
 * @module tests/components/DecisionsScreen.test
 * @description Integration tests for DecisionsScreen with gating (US-034)
 *
 * References:
 * - docs/000_projet/specs_fonctionnelles_mvp.md (US-034 AC4)
 */

import { describe, it, expect, vi } from 'vitest';
import {
    getAvailableLevers,
    getAllLeversWithGating,
    getLeversByCategory,
    isLeverAvailable,
    getLeverConfig,
    getGatingBadgeLabel,
    LEVER_GATING_CATALOG,
    type GatingDifficulty,
} from '@/lib/engine';

// Mock CSS modules
vi.mock('@/components/game/decisions/DecisionsScreen.module.css', () => ({
    default: {
        container: 'container',
        header: 'header',
        tabs: 'tabs',
        tab: 'tab',
        activeTab: 'activeTab',
        leversGrid: 'leversGrid',
        footer: 'footer',
        confirmButton: 'confirmButton',
    },
}));

vi.mock('@/components/game/decisions/LeverCard.module.css', () => ({
    default: {
        card: 'card',
        available: 'available',
        locked: 'locked',
        selected: 'selected',
        disabled: 'disabled',
    },
}));

vi.mock('@/components/game/levers/LeverGatingBadge.module.css', () => ({
    default: {
        badge: 'badge',
        intermediate: 'intermediate',
        expert: 'expert',
    },
}));

// ============================================
// AC4: GATING BADGE FOR UNAVAILABLE LEVERS
// ============================================

describe('DecisionsScreen Integration - Gating Display', () => {
    describe('Novice mode gating (AC4)', () => {
        it('should show unavailable levers with requiredDifficulty in Novice', () => {
            const leversWithGating = getAllLeversWithGating('novice');

            // Find intermediate-only levers
            const lockedLevers = leversWithGating.filter(lwg => !lwg.available);

            expect(lockedLevers.length).toBeGreaterThan(0);

            // All locked levers should have intermediate or expert as requiredDifficulty
            for (const lwg of lockedLevers) {
                expect(['intermediate', 'expert']).toContain(lwg.requiredDifficulty);
            }
        });

        it('should have gating badge label for intermediate levers in Novice', () => {
            const leversWithGating = getAllLeversWithGating('novice');

            // Find LEV-TAR-02 (Segmentation) - should be locked in Novice
            const segmentation = leversWithGating.find(
                lwg => lwg.lever.id === 'LEV-TAR-02'
            );

            expect(segmentation).toBeDefined();
            expect(segmentation!.available).toBe(false);

            // Badge label should be "Intermédiaire+"
            const badgeLabel = getGatingBadgeLabel(
                segmentation!.requiredDifficulty,
                'fr'
            );
            expect(badgeLabel).toBe('Intermédiaire+');
        });

        it('should show all catalog levers (visible but some grayed)', () => {
            const leversWithGating = getAllLeversWithGating('novice');

            // All levers from catalog should be present
            expect(leversWithGating.length).toBe(LEVER_GATING_CATALOG.length);

            // Categories should include all levers
            const categories = getLeversByCategory('novice');
            const totalInCategories = categories.reduce(
                (sum, cat) => sum + cat.levers.length,
                0
            );
            expect(totalInCategories).toBe(LEVER_GATING_CATALOG.length);
        });
    });

    describe('Intermediate mode gating', () => {
        it('should have all novice+intermediate levers enabled in Intermediate', () => {
            const leversWithGating = getAllLeversWithGating('intermediate');

            // Find LEV-TAR-02 (Segmentation) - should be available in Intermediate
            const segmentation = leversWithGating.find(
                lwg => lwg.lever.id === 'LEV-TAR-02'
            );

            expect(segmentation).toBeDefined();
            expect(segmentation!.available).toBe(true);
        });

        it('should not show gating badge for available levers', () => {
            const leversWithGating = getAllLeversWithGating('intermediate');
            const availableLevers = leversWithGating.filter(lwg => lwg.available);

            // All available levers should not need a gating badge
            for (const lwg of availableLevers) {
                // For novice levers, badge would be empty
                // For intermediate levers in intermediate mode, they're available so no badge
                const badgeLabel = getGatingBadgeLabel(lwg.requiredDifficulty, 'fr');

                // Either empty (novice) or accessible (intermediate)
                if (lwg.lever.minDifficulty === 'novice') {
                    expect(badgeLabel).toBe('');
                }
            }
        });

        it('should still show expert levers as locked in Intermediate', () => {
            const leversWithGating = getAllLeversWithGating('intermediate');

            // Expert levers should still be locked
            const expertLevers = leversWithGating.filter(
                lwg => lwg.lever.minDifficulty === 'expert'
            );

            for (const lwg of expertLevers) {
                expect(lwg.available).toBe(false);

                const badgeLabel = getGatingBadgeLabel(lwg.requiredDifficulty, 'fr');
                expect(badgeLabel).toBe('Expert+');
            }
        });
    });
});

// ============================================
// AC3: LEVER SELECTION INFO DISPLAY
// ============================================

describe('DecisionsScreen Integration - Lever Info Display', () => {
    it('should have cost information for all levers', () => {
        for (const lever of LEVER_GATING_CATALOG) {
            expect(lever.cost).toBeDefined();
            expect(typeof lever.cost.budgetUnits).toBe('number');
            expect(typeof lever.cost.recurring).toBe('boolean');
        }
    });

    it('should have impact preview for all levers (AC3)', () => {
        for (const lever of LEVER_GATING_CATALOG) {
            expect(lever.impactPreview).toBeDefined();
            expect(lever.impactPreview.target).toBeDefined();
            expect(['positive', 'negative', 'neutral', 'mixed']).toContain(
                lever.impactPreview.type
            );
            expect(lever.impactPreview.description).toBeDefined();
        }
    });

    it('should have description for all levers', () => {
        for (const lever of LEVER_GATING_CATALOG) {
            expect(lever.description).toBeDefined();
            expect(lever.description.length).toBeGreaterThan(10);
        }
    });
});

// ============================================
// CATEGORY TABS INTEGRATION
// ============================================

describe('DecisionsScreen Integration - Category Tabs', () => {
    it('should group levers into multiple categories', () => {
        const categories = getLeversByCategory('intermediate');

        expect(categories.length).toBeGreaterThan(3);

        // Each category should have name and emoji
        for (const cat of categories) {
            expect(cat.categoryName).toBeDefined();
            expect(cat.categoryEmoji).toBeDefined();
        }
    });

    it('should have active/available counts per category', () => {
        const categories = getLeversByCategory('novice');

        for (const cat of categories) {
            const available = cat.levers.filter(l => l.available).length;
            const total = cat.levers.length;

            // Each category can have from 0 to all levers available
            expect(available).toBeLessThanOrEqual(total);
            expect(available).toBeGreaterThanOrEqual(0);
        }
    });
});

// ============================================
// DATA-TESTID FOR E2E TESTING
// ============================================

describe('DecisionsScreen Integration - Test IDs', () => {
    it('should have unique IDs for all levers (for E2E testing)', () => {
        const leversWithGating = getAllLeversWithGating('intermediate');
        const leverIds = leversWithGating.map(lwg => `lever-${lwg.lever.id}`);

        // All IDs should be unique
        const uniqueIds = new Set(leverIds);
        expect(uniqueIds.size).toBe(leverIds.length);
    });

    it('should have consistent test IDs format', () => {
        const leversWithGating = getAllLeversWithGating('intermediate');

        for (const lwg of leversWithGating) {
            const testId = `lever-${lwg.lever.id}`;
            // Format: lever-LEV-XXX-NNN or lever-LEV-XXX-NNN-XX (e.g., LEV-SIN-02-N3)
            expect(testId).toMatch(/^lever-LEV-[A-Z]+-\d+[a-z]?(-[A-Z0-9]+)?$/);
        }
    });
});
