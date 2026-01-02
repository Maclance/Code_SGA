/**
 * Dashboard Types - Enriched Dashboard Display Types
 *
 * @module lib/engine/dashboard-types
 * @description Type definitions for enriched dashboard (US-030)
 *
 * References:
 * - docs/000_projet/specs_fonctionnelles_mvp.md (US-030)
 * - docs/30_ux_ui/screens_spec.md (S05 Cockpit)
 */

import type { ProductId } from './resource-types';
import type { IndicesState } from './types';

/**
 * Re-export Difficulty from types.ts for consistency
 */
export type { Difficulty } from './types';
import type { Difficulty } from './types';

/**
 * Dashboard display configuration based on difficulty
 */
export interface DashboardConfig {
    /** Current difficulty level */
    difficulty: Difficulty;
    /** Show detailed metrics (flux, frequence, cout_moyen) */
    showDetailedMetrics: boolean;
    /** Show flux metrics (entrées/sorties) */
    showFluxMetrics: boolean;
    /** Show alert badges */
    showAlerts: boolean;
    /** Alert threshold configuration */
    alertThresholds: AlertThresholds;
}

/**
 * Get dashboard config for difficulty level
 */
export function getDashboardConfig(difficulty: Difficulty): DashboardConfig {
    const baseConfig: DashboardConfig = {
        difficulty,
        showDetailedMetrics: false,
        showFluxMetrics: false,
        showAlerts: true,
        alertThresholds: DEFAULT_ALERT_THRESHOLDS,
    };

    switch (difficulty) {
        case 'novice':
            return baseConfig;
        case 'intermediaire':
        case 'expert':
        case 'survie':
            return {
                ...baseConfig,
                showDetailedMetrics: true,
                showFluxMetrics: true,
            };
        default:
            return baseConfig;
    }
}

// ============================================
// PRODUCT DISPLAY METRICS
// ============================================

/**
 * Product metrics for dashboard display
 * 
 * Includes optional fields for intermediate/expert modes
 */
export interface ProductDisplayMetrics {
    /** Product identifier */
    productId: ProductId;
    /** Product display name */
    productName: string;
    /** Number of contracts */
    nbContrats: number;
    /** Collected premiums (€) */
    primesCollectees: number;
    /** Stock of pending claims */
    stockSinistres: number;
    /** Inflow count - Intermediate+ only */
    fluxEntrees?: number;
    /** Outflow count - Intermediate+ only */
    fluxSorties?: number;
    /** Claim frequency (%) - Intermediate+ only */
    frequence?: number;
    /** Average claim cost (€) - Intermediate+ only */
    coutMoyen?: number;
}

/**
 * Product display names
 */
export const PRODUCT_NAMES: Record<ProductId, string> = {
    auto: 'Automobile',
    mrh: 'Multirisque Habitation',
} as const;

// ============================================
// INDEX DISPLAY
// ============================================

/**
 * Index status based on value thresholds
 */
export type IndexStatus = 'critical' | 'warning' | 'ok' | 'good';

/**
 * Enriched index data for gauge display
 */
export interface IndexDisplay {
    /** Index identifier */
    indexId: keyof IndicesState;
    /** Display label */
    label: string;
    /** Current value */
    value: number;
    /** Previous turn value */
    previousValue: number;
    /** Absolute delta */
    delta: number;
    /** Delta as percentage */
    deltaPercent: number;
    /** Status based on thresholds */
    status: IndexStatus;
    /** Thresholds for status calculation */
    thresholds: IndexThresholds;
}

/**
 * Thresholds for index status determination
 */
export interface IndexThresholds {
    /** Below this = critical (red) */
    critical: number;
    /** Below this = warning (orange) */
    warning: number;
    /** Above this = good (green) */
    good: number;
}

/**
 * Default thresholds for all indices
 */
export const DEFAULT_INDEX_THRESHOLDS: IndexThresholds = {
    critical: 30,
    warning: 50,
    good: 70,
} as const;

/**
 * Calculate index status from value
 */
export function getIndexStatus(value: number, thresholds: IndexThresholds = DEFAULT_INDEX_THRESHOLDS): IndexStatus {
    if (value < thresholds.critical) return 'critical';
    if (value < thresholds.warning) return 'warning';
    if (value < thresholds.good) return 'ok';
    return 'good';
}

/**
 * Index labels for display
 */
export const INDEX_LABELS: Record<keyof IndicesState, string> = {
    IAC: 'Attractivité Commerciale',
    IPQO: 'Performance Opérationnelle',
    IERH: 'Équilibre RH',
    IRF: 'Résilience Financière',
    IMD: 'Maturité Data',
    IS: 'Sincérité',
    IPP: 'Performance P&L',
} as const;

/**
 * Index icons/emojis for display
 */
export const INDEX_ICONS: Record<keyof IndicesState, string> = {
    IAC: '📈',
    IPQO: '⚙️',
    IERH: '👥',
    IRF: '🛡️',
    IMD: '📊',
    IS: '✅',
    IPP: '💰',
} as const;

// ============================================
// ALERTS
// ============================================

/**
 * Alert type based on severity
 */
export type AlertType = 'critical' | 'warning' | 'info';

/**
 * Alert thresholds configuration
 */
export interface AlertThresholds {
    /** IERH below this triggers critical alert */
    ierh_critical: number;
    /** IMD below this triggers critical alert */
    imd_critical: number;
    /** IRF below this triggers critical alert */
    irf_critical: number;
    /** Stock sinistres increase above this (%) triggers warning */
    stock_increase_warning: number;
}

/**
 * Default alert thresholds per specs
 */
export const DEFAULT_ALERT_THRESHOLDS: AlertThresholds = {
    ierh_critical: 40,
    imd_critical: 30,
    irf_critical: 35,
    stock_increase_warning: 20,
} as const;

/**
 * Dashboard alert structure
 */
export interface DashboardAlert {
    /** Unique alert ID */
    id: string;
    /** Alert severity */
    type: AlertType;
    /** Alert title */
    title: string;
    /** Detailed description */
    description: string;
    /** Related index if applicable */
    relatedIndex?: keyof IndicesState;
    /** Suggested corrective actions */
    suggestedActions: string[];
}

/**
 * Check indices and generate alerts
 */
export function generateAlerts(
    indices: IndicesState,
    previousStockSinistres: number,
    currentStockSinistres: number,
    thresholds: AlertThresholds = DEFAULT_ALERT_THRESHOLDS
): DashboardAlert[] {
    const alerts: DashboardAlert[] = [];

    // IERH critical
    if (indices.IERH < thresholds.ierh_critical) {
        alerts.push({
            id: 'alert-ierh-critical',
            type: 'critical',
            title: 'Capacité insuffisante',
            description: `L'indice IERH (${Math.round(indices.IERH)}) est en dessous du seuil critique de ${thresholds.ierh_critical}.`,
            relatedIndex: 'IERH',
            suggestedActions: [
                'Recruter du personnel supplémentaire',
                'Améliorer les conditions de travail',
                'Investir en formation',
            ],
        });
    }

    // IMD critical
    if (indices.IMD < thresholds.imd_critical) {
        alerts.push({
            id: 'alert-imd-critical',
            type: 'critical',
            title: 'Risque cyber/panne',
            description: `L'indice IMD (${Math.round(indices.IMD)}) est en dessous du seuil critique de ${thresholds.imd_critical}.`,
            relatedIndex: 'IMD',
            suggestedActions: [
                'Investir en infrastructure IT',
                'Améliorer la gouvernance data',
                'Réduire la dette technique',
            ],
        });
    }

    // IRF critical
    if (indices.IRF < thresholds.irf_critical) {
        alerts.push({
            id: 'alert-irf-critical',
            type: 'critical',
            title: 'Vulnérabilité aux chocs',
            description: `L'indice IRF (${Math.round(indices.IRF)}) est en dessous du seuil critique de ${thresholds.irf_critical}.`,
            relatedIndex: 'IRF',
            suggestedActions: [
                'Renforcer la réassurance',
                'Augmenter les provisions',
                'Améliorer la qualité des placements',
            ],
        });
    }

    // Stock sinistres increase
    if (previousStockSinistres > 0) {
        const increase = ((currentStockSinistres - previousStockSinistres) / previousStockSinistres) * 100;
        if (increase >= thresholds.stock_increase_warning) {
            alerts.push({
                id: 'alert-stock-warning',
                type: 'warning',
                title: 'Backlog en hausse',
                description: `Le stock de sinistres a augmenté de ${Math.round(increase)}% par rapport au tour précédent.`,
                suggestedActions: [
                    'Augmenter la capacité de traitement',
                    'Recruter des gestionnaires sinistres',
                    'Améliorer les processus',
                ],
            });
        }
    }

    return alerts;
}

// ============================================
// EFFECTIFS DISTRIBUTION
// ============================================

/**
 * Effectif segment for donut chart display
 */
export interface EffectifSegment {
    /** Segment identifier */
    id: string;
    /** Display label */
    label: string;
    /** Effectif count (ETP) */
    value: number;
    /** Percentage of total */
    percentage: number;
    /** Color for display */
    color: string;
}

/**
 * Effectif segment colors
 */
export const EFFECTIF_COLORS: Record<string, string> = {
    sinistres: '#3b82f6',      // Blue
    distribution: '#10b981',    // Green
    dataIT: '#8b5cf6',          // Purple
    support: '#f59e0b',         // Orange
} as const;
