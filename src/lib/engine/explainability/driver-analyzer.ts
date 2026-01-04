/**
 * Driver Analyzer - Explainability Core Logic
 *
 * @module lib/engine/explainability/driver-analyzer
 * @description Identifies the top 3 drivers for major index variations (US-037)
 */

import type { IndexId } from '../types';
import { DriverType, type Driver, type AnalysisContext, type AnalysisResult } from './driver-types';

/**
 * Minimum variation required to trigger analysis
 * Specified in US-037: "Variation seuil : déclencher analyse si |Δindice| ≥ 5 points"
 */
export const ANALYSIS_THRESHOLD = 5;

/**
 * Human-readable labels for common lever IDs
 * Can be extended or replaced with i18n keys
 */
const LEVER_LABELS: Record<string, string> = {
    'LEV-TAR-01': 'Ajustement tarif',
    'LEV-TAR-02': 'Segmentation prix',
    'LEV-DIS-01': 'Mix canaux',
    'LEV-DIS-02': 'Commissions réseau',
    'LEV-RH-01': 'Recrutement sinistres',
    'LEV-RH-02': 'Recrutement IT/Data',
    'LEV-RH-03': 'Recrutement distribution',
    'LEV-RH-04': 'Formation',
    'LEV-IT-01': 'Stabilité SI',
    'LEV-IT-02': 'Automatisation',
    'LEV-IT-03': 'Qualité données',
    'LEV-MKT-01': 'Marketing',
    'LEV-PREV-01': 'Prévention habitat',
    'LEV-PREV-02': 'Prévention auto',
    'LEV-SIN-01': 'Organisation sinistres',
    'LEV-SIN-02': 'Lutte fraude',
    'LEV-REA-01': 'Réassurance',
    'LEV-PROV-01': 'Politique provisions',
    'LEV-GAR-01': 'Extension garanties',
    'LEV-UND-01': 'Politique souscription',
};

/**
 * Analyzes the causes of an index variation
 * 
 * @param indexId - The identifier of the index
 * @param previousValue - Value at turn N-1
 * @param currentValue - Value at turn N
 * @param context - Context containing decisions, events, and effects
 * @returns Analysis result with top 3 drivers, or empty drivers if variation is small
 */
export function analyzeDrivers(
    indexId: IndexId,
    previousValue: number,
    currentValue: number,
    context: AnalysisContext
): AnalysisResult {
    const variation = currentValue - previousValue;

    // AC Constraint: Trigger only if |Δindice| ≥ 5
    if (Math.abs(variation) < ANALYSIS_THRESHOLD) {
        return {
            indexId,
            previousValue,
            currentValue,
            variation,
            drivers: []
        };
    }

    const rawDrivers: Array<Omit<Driver, 'contributionPercent'>> = [];

    // 1. Analyze Decisions (Immediate Effects)
    context.currentDecisions.forEach(decision => {
        if (decision.delay === 0 && decision.targetIndex === indexId) {
            let contribution = decision.value;
            if (decision.effectType === 'relative') {
                contribution = (previousValue * decision.value) / 100;
            }

            rawDrivers.push({
                sourceId: decision.id,
                type: DriverType.DECISION,
                label: getDecisionLabel(decision),
                contribution,
                direction: contribution >= 0 ? 'up' : 'down'
            });
        }
    });

    // 2. Analyze Events
    context.activeEvents.forEach(event => {
        const impact = event.impacts.find(i => i.target === indexId);
        if (impact) {
            let contribution = impact.value;
            if (impact.type === 'relative') {
                contribution = (previousValue * impact.value) / 100;
            }

            rawDrivers.push({
                sourceId: event.id,
                type: DriverType.EVENT,
                label: event.name,
                contribution,
                direction: contribution >= 0 ? 'up' : 'down'
            });
        }
    });

    // 3. Analyze Delayed Effects
    context.appliedEffects.forEach(effect => {
        if (effect.targetIndex === indexId) {
            let contribution = effect.value;
            if (effect.effectType === 'relative') {
                contribution = (previousValue * effect.value) / 100;
            }

            rawDrivers.push({
                sourceId: effect.id,
                type: DriverType.DELAYED_EFFECT,
                label: effect.description || 'Effet différé',
                contribution,
                direction: contribution >= 0 ? 'up' : 'down'
            });
        }
    });

    // 4. Sort by absolute contribution (AC4)
    const sortedDrivers = rawDrivers.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

    // 5. Calculate contribution percent (AC3) and take top 3
    const topDrivers: Driver[] = sortedDrivers.slice(0, 3).map(d => {
        let percent = 0;
        if (variation !== 0) {
            // Cap percentage at 100% (or -100%) to avoid confusing display if estimated contribution > actual variation
            // This happens when multiple drivers cancel each other out or if estimation is imperfect
            const rawPercent = (d.contribution / variation) * 100;
            percent = Math.round(rawPercent);
        }

        return {
            ...d,
            contributionPercent: percent
        };
    });

    return {
        indexId,
        previousValue,
        currentValue,
        variation,
        drivers: topDrivers
    };
}

/**
 * Generate a readable label for a decision
 */
function getDecisionLabel(decision: import('../product-types').ProductDecision): string {
    // Use mapped label if available
    const baseName = LEVER_LABELS[decision.id] || decision.id;
    const sign = decision.value > 0 ? '+' : '';
    const unit = decision.effectType === 'relative' ? '%' : ' pts';
    return `${baseName} (${sign}${decision.value}${unit})`;
}

