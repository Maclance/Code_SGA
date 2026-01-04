/**
 * LeverGatingBadge Component
 *
 * @module components/game/levers/LeverGatingBadge
 * @description Badge indicating required difficulty level for locked levers (US-034)
 */

'use client';

import React from 'react';
import styles from './LeverGatingBadge.module.css';

// ============================================
// TYPES
// ============================================

export interface LeverGatingBadgeProps {
    /** Required difficulty level to unlock this lever */
    requiredDifficulty: 'intermediate' | 'expert';
    /** Locale for translation */
    locale?: 'fr' | 'en';
    /** Size variant */
    size?: 'small' | 'medium';
}

// ============================================
// TRANSLATIONS
// ============================================

const translations = {
    fr: {
        intermediate: 'Intermédiaire+',
        expert: 'Expert+',
    },
    en: {
        intermediate: 'Intermediate+',
        expert: 'Expert+',
    },
};

// ============================================
// COMPONENT
// ============================================

/**
 * Badge component showing required difficulty level for a locked lever
 * Used to indicate that a lever is visible but not accessible at current difficulty
 */
export function LeverGatingBadge({
    requiredDifficulty,
    locale = 'fr',
    size = 'medium',
}: LeverGatingBadgeProps): React.ReactElement {
    const t = translations[locale];
    const label = t[requiredDifficulty];

    return (
        <span
            className={`${styles.badge} ${styles[requiredDifficulty]} ${styles[size]}`}
            title={locale === 'fr'
                ? `Disponible en mode ${requiredDifficulty === 'intermediate' ? 'Intermédiaire' : 'Expert'}`
                : `Available in ${requiredDifficulty === 'intermediate' ? 'Intermediate' : 'Expert'} mode`
            }
            role="status"
            aria-label={label}
        >
            🔒 {label}
        </span>
    );
}

export default LeverGatingBadge;
