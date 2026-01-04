/**
 * DecisionsScreen Component
 *
 * @module components/game/decisions/DecisionsScreen
 * @description Full decisions screen with category tabs and gating (US-034)
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import styles from './DecisionsScreen.module.css';
import { LeverCard } from './LeverCard';
import {
    getLeversByCategory,
    type GatingDifficulty,
    type LeverCategory,
} from '@/lib/engine';

// ============================================
// TYPES
// ============================================

export interface SelectedDecision {
    leverId: string;
    value?: number | string;
}

export interface DecisionsScreenProps {
    /** Current session difficulty */
    difficulty: GatingDifficulty;
    /** Currently selected decisions */
    selectedDecisions?: SelectedDecision[];
    /** Callback when decisions change */
    onDecisionsChange?: (decisions: SelectedDecision[]) => void;
    /** Callback when decisions are confirmed */
    onConfirm?: (decisions: SelectedDecision[]) => void;
    /** Available budget in units */
    availableBudget?: number;
    /** Current turn number */
    currentTurn?: number;
    /** Locale for i18n */
    locale?: 'fr' | 'en';
    /** Read-only mode (viewing history) */
    readOnly?: boolean;
}

// ============================================
// TRANSLATIONS
// ============================================

const translations = {
    fr: {
        title: 'Décisions',
        subtitle: 'Sélectionnez les leviers à activer ce tour',
        allCategories: 'Tous',
        availableLevers: 'leviers disponibles',
        lockedLevers: 'leviers verrouillés',
        budgetLabel: 'Budget disponible',
        budgetUnits: 'unités',
        selectedCount: 'décision(s) sélectionnée(s)',
        confirm: 'Valider les décisions',
        noSelection: 'Aucune sélection',
        emptyCategory: 'Aucun levier dans cette catégorie',
    },
    en: {
        title: 'Decisions',
        subtitle: 'Select levers to activate this turn',
        allCategories: 'All',
        availableLevers: 'available levers',
        lockedLevers: 'locked levers',
        budgetLabel: 'Available budget',
        budgetUnits: 'units',
        selectedCount: 'decision(s) selected',
        confirm: 'Confirm decisions',
        noSelection: 'No selection',
        emptyCategory: 'No levers in this category',
    },
};

// ============================================
// COMPONENT
// ============================================

export function DecisionsScreen({
    difficulty,
    selectedDecisions = [],
    onDecisionsChange,
    onConfirm,
    availableBudget = 10,
    currentTurn: _currentTurn = 1,
    locale = 'fr',
    readOnly = false,
}: DecisionsScreenProps): React.ReactElement {
    const t = translations[locale];

    // Current category filter
    const [activeCategory, setActiveCategory] = useState<LeverCategory | 'all'>('all');

    // Get levers grouped by category with gating
    const leversByCategory = useMemo(() => {
        return getLeversByCategory(difficulty);
    }, [difficulty]);

    // Get all categories for tabs
    const categories = useMemo(() => {
        return leversByCategory.map(cat => ({
            id: cat.category,
            name: cat.categoryName,
            emoji: cat.categoryEmoji,
            count: cat.levers.length,
            availableCount: cat.levers.filter(l => l.available).length,
        }));
    }, [leversByCategory]);

    // Get filtered levers based on active category
    const displayedLevers = useMemo(() => {
        if (activeCategory === 'all') {
            return leversByCategory.flatMap(cat => cat.levers);
        }
        const category = leversByCategory.find(c => c.category === activeCategory);
        return category ? category.levers : [];
    }, [leversByCategory, activeCategory]);

    // Statistics
    const stats = useMemo(() => {
        const all = displayedLevers;
        return {
            total: all.length,
            available: all.filter(l => l.available).length,
            locked: all.filter(l => !l.available).length,
        };
    }, [displayedLevers]);

    // Check if lever is selected
    const isSelected = useCallback((leverId: string) => {
        return selectedDecisions.some(d => d.leverId === leverId);
    }, [selectedDecisions]);

    // Handle lever selection toggle
    const handleLeverSelect = useCallback((leverId: string) => {
        if (readOnly) return;

        const existing = selectedDecisions.find(d => d.leverId === leverId);
        let newDecisions: SelectedDecision[];

        if (existing) {
            // Deselect
            newDecisions = selectedDecisions.filter(d => d.leverId !== leverId);
        } else {
            // Select
            newDecisions = [...selectedDecisions, { leverId }];
        }

        onDecisionsChange?.(newDecisions);
    }, [selectedDecisions, onDecisionsChange, readOnly]);

    // Handle confirm
    const handleConfirm = useCallback(() => {
        if (!readOnly && onConfirm) {
            onConfirm(selectedDecisions);
        }
    }, [readOnly, onConfirm, selectedDecisions]);

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h2 className={styles.title}>{t.title}</h2>
                    <p className={styles.subtitle}>{t.subtitle}</p>
                </div>
                <div className={styles.headerRight}>
                    <div className={styles.budgetBadge}>
                        <span className={styles.budgetLabel}>{t.budgetLabel}</span>
                        <span className={styles.budgetValue}>
                            {availableBudget} {t.budgetUnits}
                        </span>
                    </div>
                </div>
            </div>

            {/* Category Tabs */}
            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeCategory === 'all' ? styles.activeTab : ''}`}
                    onClick={() => setActiveCategory('all')}
                >
                    {t.allCategories}
                </button>
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        className={`${styles.tab} ${activeCategory === cat.id ? styles.activeTab : ''}`}
                        onClick={() => setActiveCategory(cat.id)}
                    >
                        <span className={styles.tabEmoji}>{cat.emoji}</span>
                        <span className={styles.tabName}>{cat.name}</span>
                        <span className={styles.tabCount}>
                            {cat.availableCount}/{cat.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* Stats bar */}
            <div className={styles.statsBar}>
                <span className={styles.stat}>
                    ✓ {stats.available} {t.availableLevers}
                </span>
                {stats.locked > 0 && (
                    <span className={styles.statLocked}>
                        🔒 {stats.locked} {t.lockedLevers}
                    </span>
                )}
            </div>

            {/* Levers Grid */}
            <div className={styles.leversGrid}>
                {displayedLevers.length === 0 ? (
                    <div className={styles.empty}>{t.emptyCategory}</div>
                ) : (
                    displayedLevers.map(lwg => (
                        <LeverCard
                            key={lwg.lever.id}
                            lever={lwg.lever}
                            available={lwg.available}
                            requiredDifficulty={lwg.requiredDifficulty}
                            selected={isSelected(lwg.lever.id)}
                            onSelect={handleLeverSelect}
                            locale={locale}
                            readOnly={readOnly}
                        />
                    ))
                )}
            </div>

            {/* Footer with confirm */}
            {!readOnly && (
                <div className={styles.footer}>
                    <div className={styles.footerLeft}>
                        <span className={styles.selectionCount}>
                            {selectedDecisions.length > 0
                                ? `${selectedDecisions.length} ${t.selectedCount}`
                                : t.noSelection
                            }
                        </span>
                    </div>
                    <button
                        className={styles.confirmButton}
                        onClick={handleConfirm}
                        disabled={selectedDecisions.length === 0}
                    >
                        {t.confirm} ✓
                    </button>
                </div>
            )}
        </div>
    );
}

export default DecisionsScreen;
