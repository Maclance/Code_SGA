/**
 * Effect Timeline Component
 *
 * @module components/game/EffectTimeline
 * @description Visual timeline showing pending effects by turn (US-023)
 *
 * References:
 * - docs/20_simulation/effets_retard.md
 * - docs/000_projet/specs_fonctionnelles_mvp.md (US-023)
 */

'use client';

import React, { useMemo } from 'react';
import type { DelayedEffectDisplay } from '@/lib/engine/effects-types';
import {
    groupEffectsByTurn,
    getEffectsSummaryForTurn,
    getIntensityText,
} from '@/lib/services/delayed-effects.service';
import { CompactDelayIndicator } from './DelayedEffectIndicator';
import styles from './EffectTimeline.module.css';

// ============================================
// TYPES
// ============================================

export interface EffectTimelineProps {
    /** Array of pending effects to display */
    effects: DelayedEffectDisplay[];
    /** Current turn number */
    currentTurn: number;
    /** Maximum number of turns to show ahead */
    lookAhead?: number;
    /** Locale for text (default: 'fr') */
    locale?: string;
    /** Additional CSS class */
    className?: string;
    /** Whether to show empty turns */
    showEmptyTurns?: boolean;
    /** Callback when an effect is clicked */
    onEffectClick?: (effect: DelayedEffectDisplay) => void;
}

// ============================================
// DOMAIN ICONS
// ============================================

const DOMAIN_ICONS: Record<string, string> = {
    rh: '👥',
    it: '💻',
    prevention: '🛡️',
    reputation: '⭐',
    marketing: '📢',
    tarif: '💰',
};

const DOMAIN_LABELS: Record<string, Record<string, string>> = {
    fr: {
        rh: 'RH',
        it: 'IT/Data',
        prevention: 'Prévention',
        reputation: 'Réputation',
        marketing: 'Marketing',
        tarif: 'Tarification',
    },
    en: {
        rh: 'HR',
        it: 'IT/Data',
        prevention: 'Prevention',
        reputation: 'Reputation',
        marketing: 'Marketing',
        tarif: 'Pricing',
    },
};

// ============================================
// HELPER COMPONENTS
// ============================================

interface TimelineEffectCardProps {
    effect: DelayedEffectDisplay;
    locale: string;
    onClick?: (effect: DelayedEffectDisplay) => void;
}

function TimelineEffectCard({ effect, locale, onClick }: TimelineEffectCardProps): React.JSX.Element {
    const domainIcon = effect.domain ? DOMAIN_ICONS[effect.domain] || '📌' : '📌';
    const domainLabel = effect.domain
        ? DOMAIN_LABELS[locale]?.[effect.domain] || effect.domain
        : '';

    const impactText =
        effect.estimatedImpact.min === effect.estimatedImpact.max
            ? `${effect.estimatedImpact.min >= 0 ? '+' : ''}${effect.estimatedImpact.min}`
            : `${effect.estimatedImpact.min >= 0 ? '+' : ''}${effect.estimatedImpact.min} à ${effect.estimatedImpact.max >= 0 ? '+' : ''}${effect.estimatedImpact.max}`;

    return (
        <div
            className={`${styles.effectCard} ${styles[effect.intensity]}`}
            onClick={() => onClick?.(effect)}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={(e) => {
                if (onClick && (e.key === 'Enter' || e.key === ' ')) {
                    onClick(effect);
                }
            }}
        >
            <div className={styles.effectHeader}>
                <span className={styles.domainIcon} aria-hidden="true">
                    {domainIcon}
                </span>
                <span className={styles.domainLabel}>{domainLabel}</span>
                <span className={`${styles.intensityDot} ${styles[effect.intensity]}`} />
            </div>
            <div className={styles.effectBody}>
                <p className={styles.effectDescription}>{effect.description}</p>
                <div className={styles.effectMeta}>
                    <span className={styles.targetIndex}>{effect.targetIndex}</span>
                    <span className={styles.impactValue}>{impactText}</span>
                </div>
            </div>
        </div>
    );
}

interface TimelineTurnColumnProps {
    turn: number;
    currentTurn: number;
    effects: DelayedEffectDisplay[];
    locale: string;
    onEffectClick?: (effect: DelayedEffectDisplay) => void;
}

function TimelineTurnColumn({
    turn,
    currentTurn,
    effects,
    locale,
    onEffectClick,
}: TimelineTurnColumnProps): React.JSX.Element {
    const turnsRemaining = turn - currentTurn;
    const summary = getEffectsSummaryForTurn(effects, turn);
    const isCurrentTurn = turn === currentTurn;

    const turnLabel =
        locale === 'fr'
            ? isCurrentTurn
                ? 'Ce tour'
                : `Tour ${turn}`
            : isCurrentTurn
                ? 'This turn'
                : `Turn ${turn}`;

    return (
        <div
            className={`${styles.turnColumn} ${isCurrentTurn ? styles.current : ''}`}
            data-turn={turn}
        >
            <div className={styles.turnHeader}>
                <span className={styles.turnLabel}>{turnLabel}</span>
                <CompactDelayIndicator
                    turnsRemaining={turnsRemaining}
                    intensity={summary.count > 0 ? 'high' : 'low'}
                />
            </div>
            <div className={styles.turnSummary}>
                {summary.count > 0 && (
                    <>
                        <span className={styles.effectCount}>
                            {summary.count} {locale === 'fr' ? 'effet(s)' : 'effect(s)'}
                        </span>
                        {summary.totalPositive > 0 && (
                            <span className={styles.positiveImpact}>+{summary.totalPositive}</span>
                        )}
                        {summary.totalNegative < 0 && (
                            <span className={styles.negativeImpact}>{summary.totalNegative}</span>
                        )}
                    </>
                )}
            </div>
            <div className={styles.effectsList}>
                {effects
                    .filter((e) => e.expectedTurn === turn)
                    .map((effect) => (
                        <TimelineEffectCard
                            key={effect.effectId}
                            effect={effect}
                            locale={locale}
                            onClick={onEffectClick}
                        />
                    ))}
            </div>
        </div>
    );
}

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * EffectTimeline - Visual timeline of pending effects
 *
 * @remarks
 * Displays pending effects grouped by turn with visual indicators
 * for domain, intensity, and estimated impact.
 *
 * @example
 * ```tsx
 * <EffectTimeline
 *   effects={pendingEffects}
 *   currentTurn={3}
 *   lookAhead={5}
 *   onEffectClick={(effect) => console.log('Clicked:', effect)}
 * />
 * ```
 */
export function EffectTimeline({
    effects,
    currentTurn,
    lookAhead = 4,
    locale = 'fr',
    className = '',
    showEmptyTurns = false,
    onEffectClick,
}: EffectTimelineProps): React.JSX.Element {
    // Group effects by turn
    const groupedEffects = useMemo(() => groupEffectsByTurn(effects), [effects]);

    // Determine which turns to display
    const turnsToShow = useMemo(() => {
        const turns: number[] = [];
        for (let t = currentTurn; t <= currentTurn + lookAhead; t++) {
            const hasEffects = groupedEffects.has(t);
            if (hasEffects || showEmptyTurns) {
                turns.push(t);
            }
        }
        return turns;
    }, [currentTurn, lookAhead, groupedEffects, showEmptyTurns]);

    // Empty state
    if (effects.length === 0) {
        return (
            <div className={`${styles.timeline} ${styles.empty} ${className}`} data-testid="effect-timeline-empty">
                <div className={styles.emptyState}>
                    <span className={styles.emptyIcon}>📅</span>
                    <p className={styles.emptyText}>
                        {locale === 'fr'
                            ? 'Aucun effet en attente'
                            : 'No pending effects'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`${styles.timeline} ${className}`}
            data-testid="effect-timeline"
            role="region"
            aria-label={locale === 'fr' ? 'Timeline des effets' : 'Effects timeline'}
        >
            <div className={styles.timelineHeader}>
                <h3 className={styles.title}>
                    {locale === 'fr' ? 'Effets planifiés' : 'Scheduled Effects'}
                </h3>
                <span className={styles.totalCount}>
                    {effects.length} {locale === 'fr' ? 'effet(s) en attente' : 'pending effect(s)'}
                </span>
            </div>

            <div className={styles.timelineTrack}>
                <div className={styles.connector} aria-hidden="true" />
                <div className={styles.columns}>
                    {turnsToShow.map((turn) => (
                        <TimelineTurnColumn
                            key={turn}
                            turn={turn}
                            currentTurn={currentTurn}
                            effects={effects}
                            locale={locale}
                            onEffectClick={onEffectClick}
                        />
                    ))}
                </div>
            </div>

            <div className={styles.legend}>
                <span className={styles.legendTitle}>
                    {locale === 'fr' ? 'Intensité:' : 'Intensity:'}
                </span>
                <span className={`${styles.legendItem} ${styles.high}`}>
                    {getIntensityText('high', locale)}
                </span>
                <span className={`${styles.legendItem} ${styles.medium}`}>
                    {getIntensityText('medium', locale)}
                </span>
                <span className={`${styles.legendItem} ${styles.low}`}>
                    {getIntensityText('low', locale)}
                </span>
            </div>
        </div>
    );
}

export default EffectTimeline;
