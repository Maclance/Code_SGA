import React from 'react';
import { PriceTrendPoint } from '@/lib/engine/market/market-types';
import styles from './PriceTrendChart.module.css';

interface PriceTrendChartProps {
    data: PriceTrendPoint[];
    currentGap: number;
    className?: string;
}

export const PriceTrendChart: React.FC<PriceTrendChartProps> = ({ data, currentGap, className }) => {
    // Chart dimensions logic
    const getCoordinates = (points: PriceTrendPoint[]) => {
        if (points.length === 0) return { playerPath: '', marketPath: '', minPrice: 0, maxPrice: 100 };

        // Determine range with padding
        const allPrices = points.flatMap(p => [p.playerPrice, p.marketAvg]);
        const minPrice = Math.min(...allPrices) * 0.95;
        const maxPrice = Math.max(...allPrices) * 1.05;
        const range = maxPrice - minPrice;

        const normalizeX = (index: number) => (index / (points.length - 1)) * 100;
        const normalizeY = (price: number) => 100 - ((price - minPrice) / range) * 100;

        const createPath = (key: 'playerPrice' | 'marketAvg') => {
            return points.map((p, i) =>
                `${i === 0 ? 'M' : 'L'} ${normalizeX(i)} ${normalizeY(p[key])}`
            ).join(' ');
        };

        return {
            playerPath: createPath('playerPrice'),
            marketPath: createPath('marketAvg'),
            minPrice,
            maxPrice
        };
    };

    const { playerPath, marketPath, minPrice, maxPrice } = getCoordinates(data);

    // Format gap text
    const getGapBadge = (gap: number) => {
        const sign = gap > 0 ? '+' : '';
        const style = gap > 0 ? styles.gapPositive : gap < 0 ? styles.gapNegative : styles.gapNeutral;
        const text = gap === 0 ? 'Aligné' : `${sign}${gap}% vs Marché`;

        return (
            <div className={`${styles.gapBadge} ${style}`}>
                {text}
            </div>
        );
    };

    // Calculate grid lines (3 lines)
    const midPrice = (minPrice + maxPrice) / 2;
    const gridPrices = [maxPrice, midPrice, minPrice];

    return (
        <div className={`${styles.chartContainer} ${className || ''}`} data-testid="price-trend-chart">
            <div className={styles.header}>
                <h3 className={styles.title}>Évolution Tarifaire</h3>
                {getGapBadge(currentGap)}
            </div>

            <div className={styles.chartArea}>
                {/* SVG Chart Layer */}
                <svg className={styles.lineSvg} viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d={marketPath} className={`${styles.trendLine} ${styles.lineMarket}`} />
                    <path d={playerPath} className={`${styles.trendLine} ${styles.linePlayer}`} />
                </svg>

                {/* Y-Axis Labels */}
                {gridPrices.map(price => (
                    <div
                        key={price}
                        className={styles.priceLabel}
                        style={{ top: `${100 - ((price - minPrice) / (maxPrice - minPrice)) * 100}%` }}
                    >
                        {Math.round(price)} €
                    </div>
                ))}

                {/* X-Axis Labels (Turns) */}
                {data.map((p, i) => (
                    <div
                        key={p.turn}
                        className={styles.turnLabel}
                        style={{ left: `${(i / (data.length - 1)) * 100}%` }}
                    >
                        T{p.turn}
                    </div>
                ))}

                {/* Horizontal Grid lines */}
                {gridPrices.map(price => (
                    <div
                        key={`grid-${price}`}
                        className={styles.gridLine}
                        style={{ top: `${100 - ((price - minPrice) / (maxPrice - minPrice)) * 100}%` }}
                    />
                ))}
            </div>

            <div className={styles.legend}>
                <div className={styles.legendItem}>
                    <div className={`${styles.legendLine} bg-blue-500`} />
                    <span>Votre prix</span>
                </div>
                <div className={styles.legendItem}>
                    <div className={`${styles.legendLine} bg-slate-500 border-b border-dashed border-slate-700`} />
                    <span>Moyenne marché</span>
                </div>
            </div>
        </div>
    );
};
