import React from 'react';
import { MarketShareEntry } from '@/lib/engine/market/market-types';
import styles from './MarketShareChart.module.css';

interface MarketShareChartProps {
    data: MarketShareEntry[];
    className?: string;
}

export const MarketShareChart: React.FC<MarketShareChartProps> = ({ data, className }) => {
    // Calculate gradient stops for the conic-gradient
    // Format: "color start%, color end%, nextColor start%, ..."
    const calculateGradient = (shares: MarketShareEntry[]) => {
        let currentDeg = 0;
        const stops = shares.map(item => {
            const start = currentDeg;
            const deg = (item.share / 100) * 360;
            const end = currentDeg + deg;
            currentDeg = end;
            return `${item.color} ${start}deg ${end}deg`;
        }).join(', ');
        return stops;
    };

    const gradientStops = calculateGradient(data);
    const playerEntry = data.find(d => d.isPlayer);

    return (
        <div className={`${styles.chartContainer} ${className || ''}`}>
            <h3 className={styles.title}>Répartition de marché</h3>

            <div className={styles.chartContent}>
                {/* Visual Pie Chart using Conic Gradient */}
                <div
                    className={styles.chartPlaceholder}
                    style={{ '--gradient-stops': gradientStops } as React.CSSProperties}
                >
                    {/* Inner hole for Donut effect */}
                    <div className="absolute inset-2 bg-slate-900 rounded-full" />

                    <div className={styles.centerValue}>
                        <span className={styles.centerLabel}>Votre part</span>
                        <span className={styles.centerNumber}>{playerEntry?.share}%</span>
                    </div>
                </div>

                {/* Legend */}
                <div className={styles.legend}>
                    {data.map((item) => (
                        <div
                            key={item.name}
                            className={`${styles.legendItem} ${item.isPlayer ? styles.legendPlayer : ''}`}
                        >
                            <div className="flex items-center">
                                <span
                                    className={styles.colorDot}
                                    style={{ backgroundColor: item.color }}
                                />
                                <span className={styles.name}>
                                    {item.name} {item.isPlayer && '(Vous)'}
                                </span>
                            </div>
                            <span className={styles.share}>{item.share.toFixed(1)}%</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
