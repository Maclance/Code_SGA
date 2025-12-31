/**
 * DecisionsPanel Component
 * 
 * @module components/game/DecisionsPanel
 * @description Decision-making interface for lever selection (US-014)
 */

'use client';

import React, { useState, useCallback } from 'react';
import styles from './DecisionsPanel.module.css';

interface PendingDecision {
    leverId: string;
    value: number | string | boolean;
    productId?: string;
}

interface DecisionsPanelProps {
    decisions: PendingDecision[];
    onDecisionsChange: (decisions: PendingDecision[]) => void;
    onValidate: () => void;
}

interface LeverOption {
    id: string;
    name: string;
    category: string;
    description: string;
    productSpecific: boolean;
    valueType: 'slider' | 'toggle';
    min?: number;
    max?: number;
    step?: number;
    defaultValue: number | boolean;
}

const LEVER_CATEGORIES: Record<string, { name: string; emoji: string }> = {
    tarif: { name: 'Tarification', emoji: '💵' },
    rh: { name: 'Ressources Humaines', emoji: '👥' },
    it: { name: 'IT / Data', emoji: '💻' },
    sinistres: { name: 'Gestion Sinistres', emoji: '📋' },
    distribution: { name: 'Distribution', emoji: '🏪' },
};

const AVAILABLE_LEVERS: LeverOption[] = [
    {
        id: 'LEV-TAR-01',
        name: 'Ajustement Tarifaire',
        category: 'tarif',
        description: 'Modifier le niveau de tarif global',
        productSpecific: true,
        valueType: 'slider',
        min: -10,
        max: 10,
        step: 1,
        defaultValue: 0,
    },
    {
        id: 'LEV-RH-01',
        name: 'Recrutement',
        category: 'rh',
        description: 'Ajuster les effectifs',
        productSpecific: false,
        valueType: 'slider',
        min: -20,
        max: 20,
        step: 5,
        defaultValue: 0,
    },
    {
        id: 'LEV-RH-02',
        name: 'Formation',
        category: 'rh',
        description: 'Investir dans la formation',
        productSpecific: false,
        valueType: 'slider',
        min: 0,
        max: 100,
        step: 10,
        defaultValue: 0,
    },
    {
        id: 'LEV-IT-01',
        name: 'Investissement IT',
        category: 'it',
        description: 'Modernisation des systèmes',
        productSpecific: false,
        valueType: 'slider',
        min: 0,
        max: 100,
        step: 10,
        defaultValue: 0,
    },
    {
        id: 'LEV-SIN-01',
        name: 'Capacité Traitement',
        category: 'sinistres',
        description: 'Ajuster la capacité de traitement',
        productSpecific: true,
        valueType: 'slider',
        min: -20,
        max: 20,
        step: 5,
        defaultValue: 0,
    },
    {
        id: 'LEV-DIST-01',
        name: 'Budget Marketing',
        category: 'distribution',
        description: 'Investissement publicitaire',
        productSpecific: false,
        valueType: 'slider',
        min: 0,
        max: 100,
        step: 10,
        defaultValue: 0,
    },
];

export function DecisionsPanel({
    decisions,
    onDecisionsChange,
    onValidate,
}: DecisionsPanelProps) {
    const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

    const handleValueChange = useCallback((leverId: string, value: number | boolean) => {
        const lever = AVAILABLE_LEVERS.find((l) => l.id === leverId);
        if (!lever) return;

        const existingIndex = decisions.findIndex((d) => d.leverId === leverId);

        if (value === lever.defaultValue) {
            // Remove if back to default
            if (existingIndex >= 0) {
                onDecisionsChange(decisions.filter((d) => d.leverId !== leverId));
            }
        } else {
            const newDecision: PendingDecision = {
                leverId,
                value,
                productId: lever.productSpecific ? selectedProduct || 'auto' : undefined,
            };

            if (existingIndex >= 0) {
                const updated = [...decisions];
                updated[existingIndex] = newDecision;
                onDecisionsChange(updated);
            } else {
                onDecisionsChange([...decisions, newDecision]);
            }
        }
    }, [decisions, onDecisionsChange, selectedProduct]);

    const getCurrentValue = (leverId: string): number | boolean => {
        const decision = decisions.find((d) => d.leverId === leverId);
        if (decision !== undefined) {
            return decision.value as number | boolean;
        }
        const lever = AVAILABLE_LEVERS.find((l) => l.id === leverId);
        return lever?.defaultValue ?? 0;
    };

    // Group levers by category
    const leversByCategory = AVAILABLE_LEVERS.reduce((acc, lever) => {
        if (!acc[lever.category]) {
            acc[lever.category] = [];
        }
        acc[lever.category].push(lever);
        return acc;
    }, {} as Record<string, LeverOption[]>);

    return (
        <div className={styles.container}>
            {/* Product Selector */}
            <div className={styles.productSelector}>
                <span>Produit :</span>
                <button
                    className={`${styles.productBtn} ${selectedProduct === 'auto' || !selectedProduct ? styles.active : ''}`}
                    onClick={() => setSelectedProduct('auto')}
                >
                    🚗 Auto
                </button>
                <button
                    className={`${styles.productBtn} ${selectedProduct === 'mrh' ? styles.active : ''}`}
                    onClick={() => setSelectedProduct('mrh')}
                >
                    🏠 MRH
                </button>
            </div>

            {/* Levers by Category */}
            <div className={styles.categories}>
                {Object.entries(leversByCategory).map(([category, levers]) => {
                    const catInfo = LEVER_CATEGORIES[category] || { name: category, emoji: '⚙️' };

                    return (
                        <div key={category} className={styles.category}>
                            <h3 className={styles.categoryTitle}>
                                <span>{catInfo.emoji}</span> {catInfo.name}
                            </h3>
                            <div className={styles.levers}>
                                {levers.map((lever) => {
                                    const currentValue = getCurrentValue(lever.id);
                                    const isModified = currentValue !== lever.defaultValue;

                                    return (
                                        <div
                                            key={lever.id}
                                            className={`${styles.lever} ${isModified ? styles.modified : ''}`}
                                        >
                                            <div className={styles.leverHeader}>
                                                <span className={styles.leverName}>{lever.name}</span>
                                                {lever.productSpecific && (
                                                    <span className={styles.productTag}>
                                                        Par produit
                                                    </span>
                                                )}
                                            </div>
                                            <p className={styles.leverDesc}>{lever.description}</p>

                                            {lever.valueType === 'slider' && (
                                                <div className={styles.sliderControl}>
                                                    <input
                                                        type="range"
                                                        min={lever.min}
                                                        max={lever.max}
                                                        step={lever.step}
                                                        value={currentValue as number}
                                                        onChange={(e) => handleValueChange(lever.id, parseInt(e.target.value, 10))}
                                                        className={styles.slider}
                                                    />
                                                    <span className={`${styles.sliderValue} ${(currentValue as number) > 0 ? styles.positive : (currentValue as number) < 0 ? styles.negative : ''}`}>
                                                        {(currentValue as number) > 0 ? '+' : ''}{currentValue}
                                                        {lever.id.includes('TAR') ? '%' : ''}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Summary & Validate */}
            <div className={styles.summary}>
                <div className={styles.summaryInfo}>
                    <span>{decisions.length} décision{decisions.length !== 1 ? 's' : ''} sélectionnée{decisions.length !== 1 ? 's' : ''}</span>
                </div>
                <button
                    className={styles.validateBtn}
                    onClick={onValidate}
                    disabled={decisions.length === 0}
                >
                    Valider les décisions ✓
                </button>
            </div>
        </div>
    );
}
