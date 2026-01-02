/**
 * FraudLeverN1 Component
 *
 * @module components/game/levers/FraudLeverN1
 * @description Fraud Level 1 lever UI component (US-025)
 *
 * Displays:
 * - 3 fraud N1 actions with costs and effects
 * - Prerequisites chain visualization
 * - Cap indicator (5% S/P)
 * - N2 badge marked [V1] (disabled, info only)
 */

'use client';

import React, { useCallback, useMemo } from 'react';
import styles from './FraudLeverN1.module.css';
import {
    FraudActionN1,
    FraudN1State,
    FRAUD_N1_ACTIONS,
    FRAUD_N1_CAP,
    FRAUD_N1_ACTION_IDS,
    checkPrerequisites,
    getMissingPrerequisites,
} from '@/lib/engine';

// ============================================
// TYPES
// ============================================

export interface FraudLeverN1Props {
    /** Current fraud N1 state */
    state: FraudN1State;
    /** Available budget in K€ */
    availableBudget: number;
    /** Callback when an action is activated */
    onActivate?: (action: FraudActionN1) => void;
    /** Locale for i18n (default: 'fr') */
    locale?: 'fr' | 'en';
    /** Whether the lever is in read-only mode */
    readOnly?: boolean;
}

// ============================================
// TRANSLATIONS
// ============================================

const translations = {
    fr: {
        title: 'Lutte anti-fraude',
        level1: 'Niveau 1',
        level2: 'Niveau 2',
        v1Badge: 'V1',
        active: 'Actif',
        activate: 'Activer',
        locked: 'Verrouillé',
        capLabel: 'Réduction S/P',
        capReached: 'Cap atteint',
        capNotification: 'Cap fraude N1 atteint ! Maximum 5% de réduction S/P obtenu.',
        prerequisite: 'Prérequis:',
        insufficientBudget: 'Budget insuffisant',
        effectLabel: 'Effet: S/P',
        delayLabel: 'Délai:',
        costLabel: 'Coût:',
        turn: 'tour',
        turns: 'tours',
        n2Description: 'Fonctionnalités avancées de détection - disponible en version 1',
    },
    en: {
        title: 'Fraud Prevention',
        level1: 'Level 1',
        level2: 'Level 2',
        v1Badge: 'V1',
        active: 'Active',
        activate: 'Activate',
        locked: 'Locked',
        capLabel: 'S/P Reduction',
        capReached: 'Cap reached',
        capNotification: 'Fraud N1 cap reached! Maximum 5% S/P reduction achieved.',
        prerequisite: 'Prerequisite:',
        insufficientBudget: 'Insufficient budget',
        effectLabel: 'Effect: S/P',
        delayLabel: 'Delay:',
        costLabel: 'Cost:',
        turn: 'turn',
        turns: 'turns',
        n2Description: 'Advanced detection features - available in version 1',
    },
};

// ============================================
// COMPONENT
// ============================================

export function FraudLeverN1({
    state,
    availableBudget,
    onActivate,
    locale = 'fr',
    readOnly = false,
}: FraudLeverN1Props): React.ReactElement {
    const t = translations[locale];

    // Calculate cap percentage
    const capPercentage = useMemo(() => {
        return Math.min((state.totalReduction / FRAUD_N1_CAP) * 100, 100);
    }, [state.totalReduction]);

    // Get cap status
    const capStatus = useMemo(() => {
        if (state.capReached) return 'reached';
        if (capPercentage >= 60) return 'warning';
        return 'normal';
    }, [state.capReached, capPercentage]);

    // Check action availability
    const getActionStatus = useCallback((action: FraudActionN1): 'active' | 'available' | 'locked' | 'insufficient' => {
        if (state.activeActions.includes(action)) {
            return 'active';
        }
        if (!checkPrerequisites(action, state)) {
            return 'locked';
        }
        const config = FRAUD_N1_ACTIONS[action];
        if (availableBudget < config.costValue) {
            return 'insufficient';
        }
        return 'available';
    }, [state, availableBudget]);

    // Handle action click
    const handleActionClick = useCallback((action: FraudActionN1) => {
        if (readOnly) return;
        const status = getActionStatus(action);
        if (status === 'available' && onActivate) {
            onActivate(action);
        }
    }, [readOnly, getActionStatus, onActivate]);

    // Format delay text
    const formatDelay = (min: number, max: number): string => {
        if (min === max) {
            return `${min} ${min === 1 ? t.turn : t.turns}`;
        }
        return `${min}-${max} ${t.turns}`;
    };

    return (
        <div className={styles.fraudLeverContainer}>
            {/* Header */}
            <div className={styles.header}>
                <h3 className={styles.title}>
                    <span className={styles.titleIcon}>🔍</span>
                    {t.title} - {t.level1}
                </h3>
                <div className={`${styles.capIndicator} ${styles[capStatus]}`}>
                    {t.capLabel}: {state.totalReduction.toFixed(1)}% / {FRAUD_N1_CAP}%
                    {state.capReached && ` ✓`}
                </div>
            </div>

            {/* Progress bar */}
            <div className={styles.progressBar}>
                <div
                    className={`${styles.progressFill} ${styles[capStatus]}`}
                    style={{ width: `${capPercentage}%` }}
                />
            </div>

            {/* Cap notification */}
            {state.capReached && (
                <div className={`${styles.capNotification} ${styles.reached}`}>
                    ✓ {t.capNotification}
                </div>
            )}

            {/* Actions grid */}
            <div className={styles.actionsGrid}>
                {FRAUD_N1_ACTION_IDS.map((actionId, index) => {
                    const config = FRAUD_N1_ACTIONS[actionId];
                    const status = getActionStatus(actionId);
                    const missingPrereqs = getMissingPrerequisites(actionId, state);
                    const isClickable = status === 'available' && !readOnly;

                    return (
                        <div
                            key={actionId}
                            className={`${styles.actionCard} ${styles[status]} ${isClickable ? styles.available : ''}`}
                            onClick={() => handleActionClick(actionId)}
                            role={isClickable ? 'button' : undefined}
                            tabIndex={isClickable ? 0 : undefined}
                            onKeyDown={(e) => {
                                if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
                                    handleActionClick(actionId);
                                }
                            }}
                        >
                            {/* Action number */}
                            <div className={styles.actionNumber}>
                                {status === 'active' ? '✓' : index + 1}
                            </div>

                            {/* Content */}
                            <div className={styles.actionContent}>
                                <div className={styles.actionHeader}>
                                    <span className={styles.actionLabel}>
                                        {config.label}
                                    </span>
                                    <div className={styles.actionMeta}>
                                        <span className={`${styles.costBadge} ${styles[config.cost]}`}>
                                            {config.costValue}K€
                                        </span>
                                        <span className={styles.delayBadge}>
                                            ⏱ {formatDelay(config.delay.min, config.delay.max)}
                                        </span>
                                    </div>
                                </div>

                                <p className={styles.actionDescription}>
                                    {config.description}
                                </p>

                                <span className={styles.effectRange}>
                                    {t.effectLabel} -{config.effectRange.min}% à -{config.effectRange.max}%
                                </span>

                                {/* Prerequisite warning */}
                                {missingPrereqs.length > 0 && (
                                    <div className={styles.prerequisiteWarning}>
                                        🔒 {t.prerequisite} {missingPrereqs.map(p => FRAUD_N1_ACTIONS[p].label).join(', ')}
                                    </div>
                                )}

                                {/* Insufficient budget warning */}
                                {status === 'insufficient' && (
                                    <div className={styles.prerequisiteWarning}>
                                        💰 {t.insufficientBudget}
                                    </div>
                                )}
                            </div>

                            {/* Status badge */}
                            {status === 'active' && (
                                <span className={`${styles.statusBadge} ${styles.active}`}>
                                    {t.active}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* N2 Section (V1 indicator) */}
            <div className={styles.n2Section}>
                <div className={styles.n2Header}>
                    <span className={styles.n2Title}>
                        🔒 {t.title} - {t.level2}
                    </span>
                    <span className={styles.n2Badge}>{t.v1Badge}</span>
                </div>
                <p className={styles.n2Description}>
                    {t.n2Description}
                </p>
            </div>
        </div>
    );
}

export default FraudLeverN1;
