/**
 * EffectHistoryPanel Component
 *
 * @module components/game/EffectHistoryPanel
 * @description Displays history of past decisions and their current effects (US-024)
 *
 * Features:
 * - Shows last 10 turns of decisions
 * - Visual status indicators (active/depleted/compensated)
 * - Compensation options for active effects
 */

'use client';

import React, { useMemo } from 'react';
import styles from './EffectHistoryPanel.module.css';
import type { EffectHistoryEntry, EffectHistoryStatus } from '@/lib/engine/effects-types';
import type { CompensationOption } from '@/lib/engine/compensation';

// ============================================
// TYPES
// ============================================

export interface EffectHistoryPanelProps {
    /** History entries to display */
    entries: EffectHistoryEntry[];
    /** Current turn number */
    currentTurn: number;
    /** Compensation options for viable effects */
    compensationOptions?: CompensationOption[];
    /** Callback when compensation is requested */
    onCompensate?: (decisionId: string, option: CompensationOption) => void;
    /** Callback when an entry is clicked */
    onEntryClick?: (entry: EffectHistoryEntry) => void;
    /** Locale for i18n */
    locale?: string;
    /** Custom class name */
    className?: string;
}

// ============================================
// HELPERS
// ============================================

function getStatusText(status: EffectHistoryStatus, locale: string = 'fr'): string {
    const texts: Record<string, Record<EffectHistoryStatus, string>> = {
        fr: {
            active: 'Actif',
            depleted: 'Épuisé',
            compensated: 'Compensé',
        },
        en: {
            active: 'Active',
            depleted: 'Depleted',
            compensated: 'Compensated',
        },
    };
    return texts[locale]?.[status] || texts.en[status];
}

function formatValue(value: number): string {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}`;
}

// ============================================
// COMPONENT
// ============================================

export default function EffectHistoryPanel({
    entries,
    currentTurn,
    compensationOptions = [],
    onCompensate,
    onEntryClick,
    locale = 'fr',
    className,
}: EffectHistoryPanelProps) {
    // Map compensation options by decision ID for quick lookup
    const compensationMap = useMemo(() => {
        const map = new Map<string, CompensationOption>();
        for (const option of compensationOptions) {
            map.set(option.originalDecisionId, option);
        }
        return map;
    }, [compensationOptions]);

    // Group entries by status for summary
    const summary = useMemo(() => {
        return entries.reduce(
            (acc, entry) => {
                acc[entry.status]++;
                return acc;
            },
            { active: 0, depleted: 0, compensated: 0 }
        );
    }, [entries]);

    // Handle entry click
    const handleEntryClick = (entry: EffectHistoryEntry) => {
        if (onEntryClick) {
            onEntryClick(entry);
        }
    };

    // Handle compensation click
    const handleCompensateClick = (
        e: React.MouseEvent,
        entry: EffectHistoryEntry,
        option: CompensationOption
    ) => {
        e.stopPropagation();
        if (onCompensate) {
            onCompensate(entry.decisionId, option);
        }
    };

    return (
        <div className={`${styles.panel} ${className || ''}`}>
            {/* Header */}
            <div className={styles.header}>
                <h3 className={styles.title}>
                    <span className={styles.icon}>📜</span>
                    {locale === 'fr' ? 'Historique des effets' : 'Effect History'}
                </h3>
                <span className={styles.badge}>
                    {summary.active} {locale === 'fr' ? 'actifs' : 'active'}
                </span>
            </div>

            {/* Effect List */}
            {entries.length === 0 ? (
                <div className={styles.emptyState}>
                    {locale === 'fr'
                        ? 'Aucune décision passée'
                        : 'No past decisions'}
                </div>
            ) : (
                <div className={styles.effectList}>
                    {entries.map((entry) => {
                        const option = compensationMap.get(entry.decisionId);
                        const canCompensate = entry.canCompensate && option?.isViable;

                        return (
                            <div
                                key={`${entry.decisionId}-${entry.turnNumber}`}
                                className={`${styles.effectItem} ${styles[entry.status]}`}
                                onClick={() => handleEntryClick(entry)}
                            >
                                {/* Content */}
                                <div className={styles.itemContent}>
                                    <div className={styles.itemHeader}>
                                        <span className={styles.turnBadge}>
                                            T{entry.turnNumber}
                                        </span>
                                        <span className={styles.description}>
                                            {entry.decisionDescription}
                                        </span>
                                    </div>
                                    <span className={styles.targetIndex}>
                                        {entry.targetIndex}
                                    </span>

                                    {/* Compensation Button */}
                                    {canCompensate && option && (
                                        <button
                                            className={styles.compensateButton}
                                            onClick={(e) =>
                                                handleCompensateClick(e, entry, option)
                                            }
                                        >
                                            {locale === 'fr' ? 'Compenser' : 'Compensate'} ({option.currentCost} €)
                                        </button>
                                    )}
                                </div>

                                {/* Values */}
                                <div className={styles.values}>
                                    <span
                                        className={`${styles.currentValue} ${entry.currentEffect >= 0
                                                ? styles.positive
                                                : styles.negative
                                            }`}
                                    >
                                        {formatValue(entry.currentEffect)}
                                    </span>
                                    <span className={styles.originalValue}>
                                        {locale === 'fr' ? 'initial' : 'initial'}:{' '}
                                        {formatValue(entry.initialEffect)}
                                    </span>
                                    <span
                                        className={`${styles.statusBadge} ${styles[entry.status]
                                            }`}
                                    >
                                        {getStatusText(entry.status, locale)}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
