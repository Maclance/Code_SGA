import React, { useState, useMemo } from 'react';
import { calculateMarketShares, calculatePriceTrends, calculateGapVsMarket } from '@/lib/engine/market/market-calculator';
import { MarketShareChart } from './MarketShareChart';
import { PriceTrendChart } from './PriceTrendChart';
import { ProductType, PRODUCT_TYPES } from '@/lib/engine/market/market-types';
import styles from './MarketScreen.module.css';

// Mock types for props - in real integration this will come from TurnState
interface MarketScreenProps {
    data?: any; // Replace with proper GameState/TurnState type
    className?: string;
}

export const MarketScreen: React.FC<MarketScreenProps> = ({ data, className }) => {
    const [selectedProduct, setSelectedProduct] = useState<ProductType>('AUTO');

    // Simulate data derivation from props (or use real calculators if data available)
    // For MVP View, we use the calculator with a mock global IAC if data is missing
    const marketData = useMemo(() => {
        // Safe access to IAC (default 60 if missing)
        const playerIAC = data?.indices?.IAC ?? 60;

        // Calculate shares
        const shares = calculateMarketShares(playerIAC);

        // Calculate trends
        // We simulate turn history for now as it might be complex to extract from `data` in this snippet
        const trends = calculatePriceTrends([], data?.turnNumber ?? 10); // Mock history

        // Calculate gap
        // In real app, extract specific product price
        const currentTrend = trends[trends.length - 1];
        const gap = calculateGapVsMarket(currentTrend.playerPrice, currentTrend.marketAvg);

        return {
            shares,
            trends,
            gap
        };
    }, [data, selectedProduct]);

    return (
        <div className={`${styles.container} ${className || ''}`} data-testid="market-screen">
            <header className={styles.header}>
                <div>
                    <h2 className={styles.title}>Analyse du Marché</h2>
                    <p className={styles.subtitle}>Positionnement concurrentiel et tendances tarifaires</p>
                </div>

                <div className={styles.controls}>
                    {PRODUCT_TYPES.map(type => (
                        <button
                            key={type}
                            onClick={() => setSelectedProduct(type)}
                            className={`${styles.controlButton} ${selectedProduct === type ? styles.controlActive : ''}`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </header>

            <div className={styles.grid}>
                <div className={styles.card}>
                    <MarketShareChart data={marketData.shares} />
                </div>

                <div className={styles.card}>
                    <PriceTrendChart
                        data={marketData.trends}
                        currentGap={marketData.gap}
                    />
                </div>
            </div>
        </div>
    );
};
