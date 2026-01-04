/**
 * LeverCard Component
 *
 * @module components/game/decisions/LeverCard
 * @description Individual lever card with gating, cost, and impact display (US-034)
 */

'use client';

import React, { useCallback, useMemo } from 'react';
import styles from './LeverCard.module.css';
import { LeverGatingBadge } from '../levers/LeverGatingBadge';
import type { LeverGatingConfig, GatingDifficulty } from '@/lib/engine';

// ============================================
// TYPES
// ============================================

export interface LeverCardProps {
    /** Lever configuration */
    lever: LeverGatingConfig;
    /** Whether this lever is available at current difficulty */
    available: boolean;
    /** Required difficulty if not available */
    requiredDifficulty: GatingDifficulty;
    /** Whether this lever is currently selected */
    selected?: boolean;
    /** Current selected option value (if any) */
    selectedValue?: number | string;
    /** Callback when lever is clicked */
    onSelect?: (leverId: string) => void;
    /** Callback when lever option changes */
    onValueChange?: (leverId: string, value: number | string) => void;
    /** Locale for i18n */
    locale?: 'fr' | 'en';
    /** Read-only mode */
    readOnly?: boolean;
}

// ============================================
// TRANSLATIONS
// ============================================

const translations = {
    fr: {
        cost: 'Coût',
        budgetUnits: 'unités budget',
        recurring: 'récurrent',
        delay: 'Délai',
        turn: 'tour',
        turns: 'tours',
        impact: 'Impact',
        immediate: 'immédiat',
        lockedTitle: 'Levier verrouillé',
    },
    en: {
        cost: 'Cost',
        budgetUnits: 'budget units',
        recurring: 'recurring',
        delay: 'Delay',
        turn: 'turn',
        turns: 'turns',
        impact: 'Impact',
        immediate: 'immediate',
        lockedTitle: 'Locked lever',
    },
};

// ============================================
// HELPERS
// ============================================

const IMPACT_COLORS: Record<string, string> = {
    positive: '#10b981',
    negative: '#ef4444',
    neutral: '#6b7280',
    mixed: '#f59e0b',
};

const IMPACT_ICONS: Record<string, string> = {
    positive: '↑',
    negative: '↓',
    neutral: '→',
    mixed: '↕',
};

// ============================================
// COMPONENT
// ============================================

export function LeverCard({
    lever,
    available,
    requiredDifficulty,
    selected = false,
    onSelect,
    onValueChange: _onValueChange,
    locale = 'fr',
    readOnly = false,
}: LeverCardProps): React.ReactElement {
    const t = translations[locale];

    // Handle card click
    const handleClick = useCallback(() => {
        if (available && !readOnly && onSelect) {
            onSelect(lever.id);
        }
    }, [available, readOnly, onSelect, lever.id]);

    // Handle keyboard interaction
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if ((e.key === 'Enter' || e.key === ' ') && available && !readOnly && onSelect) {
            e.preventDefault();
            onSelect(lever.id);
        }
    }, [available, readOnly, onSelect, lever.id]);

    // Format delay display
    const delayText = useMemo(() => {
        if (!lever.delay || lever.delay === 0) {
            return t.immediate;
        }
        return `${lever.delay} ${lever.delay === 1 ? t.turn : t.turns}`;
    }, [lever.delay, t]);

    // Format cost display
    const costText = useMemo(() => {
        if (lever.cost.budgetUnits === 0) {
            return locale === 'fr' ? 'Gratuit' : 'Free';
        }
        const base = `${lever.cost.budgetUnits} ${t.budgetUnits}`;
        return lever.cost.recurring ? `${base} (${t.recurring})` : base;
    }, [lever.cost, t, locale]);

    return (
        <div
            className={`
                ${styles.card}
                ${available ? styles.available : styles.locked}
                ${selected ? styles.selected : ''}
                ${readOnly ? styles.readOnly : ''}
            `}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            role={available && !readOnly ? 'button' : 'article'}
            tabIndex={available && !readOnly ? 0 : -1}
            aria-disabled={!available || readOnly}
            data-testid={`lever-${lever.id}`}
        >
            {/* Header */}
            <div className={styles.header}>
                <h4 className={styles.name}>{lever.name}</h4>
                {!available && requiredDifficulty !== 'novice' && (
                    <LeverGatingBadge
                        requiredDifficulty={requiredDifficulty as 'intermediate' | 'expert'}
                        locale={locale}
                        size="small"
                    />
                )}
            </div>

            {/* Description */}
            <p className={styles.description}>{lever.description}</p>

            {/* Meta info */}
            <div className={styles.meta}>
                {/* Cost */}
                <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>💰 {t.cost}:</span>
                    <span className={`${styles.metaValue} ${lever.cost.budgetUnits === 0 ? styles.free : ''}`}>
                        {costText}
                    </span>
                </div>

                {/* Delay */}
                <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>⏱ {t.delay}:</span>
                    <span className={styles.metaValue}>{delayText}</span>
                </div>
            </div>

            {/* Impact preview */}
            <div
                className={styles.impact}
                style={{ borderLeftColor: IMPACT_COLORS[lever.impactPreview.type] }}
            >
                <span className={styles.impactIcon}>
                    {IMPACT_ICONS[lever.impactPreview.type]}
                </span>
                <span className={styles.impactText}>
                    <strong>{lever.impactPreview.target}</strong>: {lever.impactPreview.description}
                </span>
            </div>

            {/* Selection indicator */}
            {selected && (
                <div className={styles.selectedIndicator}>
                    ✓
                </div>
            )}

            {/* Locked overlay */}
            {!available && (
                <div className={styles.lockedOverlay} aria-hidden="true" />
            )}
        </div>
    );
}

export default LeverCard;
