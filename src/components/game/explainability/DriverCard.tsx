/**
 * DriverCard Component
 *
 * @description Individual card displaying a driver's details (US-037)
 */

import React from 'react';
import { type FormattedDriver, formatDriver, type Driver } from '@/lib/engine';
import styles from './DriverCard.module.css';

interface DriverCardProps {
    /** The driver data to display */
    driver: Driver;
}

export const DriverCard: React.FC<DriverCardProps> = ({ driver }) => {
    // Format the driver data using the engine utility
    const formatted: FormattedDriver = formatDriver(driver);

    // Determine trend class (up/down/neutral)
    const trendClass = driver.contribution > 0
        ? styles.trendUp
        : driver.contribution < 0
            ? styles.trendDown
            : styles.trendNeutral;

    return (
        <li className={styles.card} role="listitem">
            <div className={styles.iconWrapper} aria-hidden="true">
                <span className={styles.icon}>{formatted.icon}</span>
            </div>

            <div className={styles.content}>
                <span className={styles.label}>{formatted.label}</span>
            </div>

            <div className={`${styles.contribution} ${trendClass}`}>
                <span className={styles.value}>
                    {formatted.formattedContribution}
                </span>
                {/* Visual indicator (optional, maybe arrow or color bar) */}
            </div>
        </li>
    );
};
