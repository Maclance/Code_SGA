/**
 * ProductGrid Component
 *
 * @module components/game/dashboard/ProductGrid
 * @description Grid displaying product metrics (Auto, MRH) with totals (US-030)
 */

'use client';

import React from 'react';
import styles from './ProductGrid.module.css';
import type { ProductDisplayMetrics, Difficulty } from '@/lib/engine';
import { getDashboardConfig, PRODUCT_NAMES } from '@/lib/engine';

// ============================================
// TYPES
// ============================================

export interface ProductGridProps {
    /** Product metrics to display */
    products: ProductDisplayMetrics[];
    /** Current difficulty level */
    difficulty: Difficulty;
    /** Loading state */
    isLoading?: boolean;
    /** Locale for formatting */
    locale?: 'fr' | 'en';
}

// ============================================
// FORMATTERS
// ============================================

function formatNumber(value: number, locale: string = 'fr'): string {
    return new Intl.NumberFormat(locale, {
        maximumFractionDigits: 0,
    }).format(value);
}

function formatCurrency(value: number, locale: string = 'fr'): string {
    if (value >= 1_000_000) {
        return `${(value / 1_000_000).toFixed(1)}M€`;
    }
    if (value >= 1_000) {
        return `${(value / 1_000).toFixed(0)}k€`;
    }
    return `${value.toFixed(0)}€`;
}

function formatPercent(value: number): string {
    return `${value.toFixed(1)}%`;
}

function formatFlux(value: number): string {
    const prefix = value >= 0 ? '+' : '';
    return `${prefix}${formatNumber(value)}`;
}

// ============================================
// PRODUCT ICONS
// ============================================

const PRODUCT_ICONS: Record<string, string> = {
    auto: '🚗',
    mrh: '🏠',
};

// ============================================
// LABELS
// ============================================

const LABELS = {
    fr: {
        nbContrats: 'Contrats',
        primesCollectees: 'Primes',
        stockSinistres: 'Stock sinistres',
        fluxEntrees: 'Entrées',
        fluxSorties: 'Sorties',
        frequence: 'Fréquence',
        coutMoyen: 'Coût moyen',
        total: 'Total',
    },
    en: {
        nbContrats: 'Contracts',
        primesCollectees: 'Premiums',
        stockSinistres: 'Claims Stock',
        fluxEntrees: 'Inflow',
        fluxSorties: 'Outflow',
        frequence: 'Frequency',
        coutMoyen: 'Average Cost',
        total: 'Total',
    },
};

// ============================================
// COMPONENT
// ============================================

export function ProductGrid({
    products,
    difficulty,
    isLoading = false,
    locale = 'fr',
}: ProductGridProps) {
    const config = getDashboardConfig(difficulty);
    const labels = LABELS[locale];

    // Calculate totals
    const totals: ProductDisplayMetrics = {
        productId: 'auto', // placeholder for type
        productName: labels.total,
        nbContrats: products.reduce((sum, p) => sum + p.nbContrats, 0),
        primesCollectees: products.reduce((sum, p) => sum + p.primesCollectees, 0),
        stockSinistres: products.reduce((sum, p) => sum + p.stockSinistres, 0),
        fluxEntrees: config.showFluxMetrics
            ? products.reduce((sum, p) => sum + (p.fluxEntrees ?? 0), 0)
            : undefined,
        fluxSorties: config.showFluxMetrics
            ? products.reduce((sum, p) => sum + (p.fluxSorties ?? 0), 0)
            : undefined,
        frequence: config.showDetailedMetrics
            ? products.reduce((sum, p) => sum + (p.frequence ?? 0), 0) / products.length
            : undefined,
        coutMoyen: config.showDetailedMetrics
            ? products.reduce((sum, p) => sum + (p.coutMoyen ?? 0), 0) / products.length
            : undefined,
    };

    if (isLoading) {
        return (
            <div className={styles.grid} aria-busy="true" aria-label="Chargement des produits">
                {[1, 2, 3].map((i) => (
                    <div key={i} className={`${styles.card} ${styles.skeleton}`}>
                        <div className={styles.skeletonHeader} />
                        <div className={styles.skeletonBody} />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div
            className={styles.grid}
            role="region"
            aria-label="Indicateurs par produit"
        >
            {/* Product Cards */}
            {products.map((product) => (
                <article
                    key={product.productId}
                    className={styles.card}
                    aria-labelledby={`product-${product.productId}`}
                >
                    <header className={styles.cardHeader}>
                        <span className={styles.productIcon}>
                            {PRODUCT_ICONS[product.productId] ?? '📦'}
                        </span>
                        <h3 id={`product-${product.productId}`} className={styles.productName}>
                            {PRODUCT_NAMES[product.productId] ?? product.productName}
                        </h3>
                    </header>

                    <div className={styles.metrics}>
                        {/* Base Metrics - Always visible */}
                        <div className={styles.metric}>
                            <span className={styles.metricLabel}>{labels.nbContrats}</span>
                            <span className={styles.metricValue}>
                                {formatNumber(product.nbContrats, locale)}
                            </span>
                        </div>

                        <div className={styles.metric}>
                            <span className={styles.metricLabel}>{labels.primesCollectees}</span>
                            <span className={styles.metricValue}>
                                {formatCurrency(product.primesCollectees, locale)}
                            </span>
                        </div>

                        <div className={styles.metric}>
                            <span className={styles.metricLabel}>{labels.stockSinistres}</span>
                            <span className={styles.metricValue}>
                                {formatNumber(product.stockSinistres, locale)}
                            </span>
                        </div>

                        {/* Detailed Metrics - Intermediate+ only */}
                        {config.showFluxMetrics && (
                            <>
                                <div className={styles.metric}>
                                    <span className={styles.metricLabel}>{labels.fluxEntrees}</span>
                                    <span className={`${styles.metricValue} ${styles.positive}`}>
                                        {formatFlux(product.fluxEntrees ?? 0)}
                                    </span>
                                </div>

                                <div className={styles.metric}>
                                    <span className={styles.metricLabel}>{labels.fluxSorties}</span>
                                    <span className={`${styles.metricValue} ${styles.negative}`}>
                                        {formatFlux(-(product.fluxSorties ?? 0))}
                                    </span>
                                </div>
                            </>
                        )}

                        {config.showDetailedMetrics && (
                            <>
                                <div className={styles.metric}>
                                    <span className={styles.metricLabel}>{labels.frequence}</span>
                                    <span className={styles.metricValue}>
                                        {formatPercent(product.frequence ?? 0)}
                                    </span>
                                </div>

                                <div className={styles.metric}>
                                    <span className={styles.metricLabel}>{labels.coutMoyen}</span>
                                    <span className={styles.metricValue}>
                                        {formatCurrency(product.coutMoyen ?? 0, locale)}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                </article>
            ))}

            {/* Totals Card */}
            <article className={`${styles.card} ${styles.totalCard}`} aria-labelledby="product-total">
                <header className={styles.cardHeader}>
                    <span className={styles.productIcon}>📊</span>
                    <h3 id="product-total" className={styles.productName}>
                        {labels.total}
                    </h3>
                </header>

                <div className={styles.metrics}>
                    <div className={styles.metric}>
                        <span className={styles.metricLabel}>{labels.nbContrats}</span>
                        <span className={styles.metricValue}>{formatNumber(totals.nbContrats, locale)}</span>
                    </div>

                    <div className={styles.metric}>
                        <span className={styles.metricLabel}>{labels.primesCollectees}</span>
                        <span className={styles.metricValue}>{formatCurrency(totals.primesCollectees, locale)}</span>
                    </div>

                    <div className={styles.metric}>
                        <span className={styles.metricLabel}>{labels.stockSinistres}</span>
                        <span className={styles.metricValue}>{formatNumber(totals.stockSinistres, locale)}</span>
                    </div>

                    {config.showFluxMetrics && (
                        <>
                            <div className={styles.metric}>
                                <span className={styles.metricLabel}>{labels.fluxEntrees}</span>
                                <span className={`${styles.metricValue} ${styles.positive}`}>
                                    {formatFlux(totals.fluxEntrees ?? 0)}
                                </span>
                            </div>
                            <div className={styles.metric}>
                                <span className={styles.metricLabel}>{labels.fluxSorties}</span>
                                <span className={`${styles.metricValue} ${styles.negative}`}>
                                    {formatFlux(-(totals.fluxSorties ?? 0))}
                                </span>
                            </div>
                        </>
                    )}

                    {config.showDetailedMetrics && (
                        <>
                            <div className={styles.metric}>
                                <span className={styles.metricLabel}>{labels.frequence}</span>
                                <span className={styles.metricValue}>{formatPercent(totals.frequence ?? 0)}</span>
                            </div>
                            <div className={styles.metric}>
                                <span className={styles.metricLabel}>{labels.coutMoyen}</span>
                                <span className={styles.metricValue}>{formatCurrency(totals.coutMoyen ?? 0, locale)}</span>
                            </div>
                        </>
                    )}
                </div>
            </article>
        </div>
    );
}

export default ProductGrid;
