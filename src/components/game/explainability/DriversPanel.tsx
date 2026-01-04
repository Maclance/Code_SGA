/**
 * DriversPanel Component
 *
 * @description Panel displaying top 3 drivers for an index variation (US-037)
 */

import React from 'react';
import { type Driver, type IndexId } from '@/lib/engine';
import { DriverCard } from './DriverCard';
import styles from './DriversPanel.module.css';

interface DriversPanelProps {
    /** The index being analyzed */
    indexName: IndexId | string;
    /** The variation value */
    variation: number;
    /** The top drivers to display */
    drivers: Driver[];
}

export const DriversPanel: React.FC<DriversPanelProps> = ({
    indexName,
    variation,
    drivers
}) => {
    // Determine variation sign and color
    const sign = variation > 0 ? '+' : '';
    const variationClass = variation > 0
        ? styles.positive
        : variation < 0
            ? styles.negative
            : styles.neutral;

    // AC1: Display top 3 drivers
    const topDrivers = drivers.slice(0, 3);

    return (
        <div className={styles.panel}>
            <div className={styles.header}>
                <h3 className={styles.title}>
                    Pourquoi {indexName}
                    <span className={`${styles.variation} ${variationClass}`}>
                        {sign}{Math.abs(variation).toFixed(1)}
                    </span> ?
                </h3>
            </div>

            {topDrivers.length > 0 ? (
                <ul className={styles.list} role="list">
                    {topDrivers.map((driver) => (
                        <DriverCard
                            key={`${driver.type}-${driver.sourceId}`}
                            driver={driver}
                        />
                    ))}
                </ul>
            ) : (
                <div className={styles.empty}>
                    <p>
                        {Math.abs(variation) >= 5
                            ? "Causes multiples ou effet de conjoncture."
                            : "Variation mineure expliquée par de multiples facteurs."
                        }
                    </p>
                </div>
            )}
        </div>
    );
};
