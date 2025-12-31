/**
 * ResolutionScreen Component
 * 
 * @module components/game/ResolutionScreen
 * @description Calculation animation during turn resolution (US-014)
 */

'use client';

import React from 'react';
import styles from './ResolutionScreen.module.css';

interface ResolutionScreenProps {
    isResolving: boolean;
    error: string | null;
}

export function ResolutionScreen({ isResolving, error }: ResolutionScreenProps) {
    return (
        <div className={styles.container}>
            {isResolving && !error && (
                <div className={styles.resolving}>
                    <div className={styles.animation}>
                        <div className={styles.circle}></div>
                        <div className={styles.circle}></div>
                        <div className={styles.circle}></div>
                    </div>
                    <h2 className={styles.title}>Calcul en cours...</h2>
                    <p className={styles.subtitle}>
                        Le moteur de simulation analyse vos décisions
                    </p>
                    <div className={styles.steps}>
                        <div className={styles.step}>
                            <span className={styles.stepCheck}>✓</span>
                            <span>Analyse des décisions</span>
                        </div>
                        <div className={styles.step}>
                            <span className={styles.stepSpinner}></span>
                            <span>Calcul des indices</span>
                        </div>
                        <div className={styles.step}>
                            <span className={styles.stepPending}>○</span>
                            <span>Génération du P&L</span>
                        </div>
                        <div className={styles.step}>
                            <span className={styles.stepPending}>○</span>
                            <span>Préparation du rapport</span>
                        </div>
                    </div>
                </div>
            )}

            {error && (
                <div className={styles.error}>
                    <span className={styles.errorIcon}>❌</span>
                    <h2>Erreur de résolution</h2>
                    <p>{error}</p>
                </div>
            )}
        </div>
    );
}
