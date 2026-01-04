/**
 * Driver Formatter - UI Formatting Utilities
 *
 * @module lib/engine/explainability/driver-formatter
 * @description Formats driver data for display (US-037)
 */

import { type Driver, type FormattedDriver, DriverType, type ContributionDirection } from './driver-types';

/**
 * Icons mapping for driver types
 * AC: "Icône type (📊 décision, 🌍 événement, ⏳ retard)"
 */
const DRIVER_ICONS: Record<DriverType, string> = {
    [DriverType.DECISION]: '📊',
    [DriverType.EVENT]: '🌍',
    [DriverType.DELAYED_EFFECT]: '⏳'
};

/**
 * Formats a driver for UI display
 * 
 * @param driver - The raw driver object
 * @returns The formatted driver with icon and string contribution
 */
export function formatDriver(driver: Driver): FormattedDriver {
    return {
        ...driver,
        icon: getDriverIcon(driver.type),
        // AC3: Display formatted percentage (e.g. "+50%")
        formattedContribution: `${formatContribution(driver.contributionPercent)}%`
    };
}

/**
 * Gets the icon for a driver type
 */
export function getDriverIcon(type: DriverType): string {
    return DRIVER_ICONS[type];
}

/**
 * Formats the contribution value
 * Ex: 5 -> "+5"
 * Ex: -3.2 -> "-3" (rounded for clarity as per "Langage clair" constraint)
 */
export function formatContribution(value: number): string {
    const rounded = Math.round(value);
    const sign = rounded > 0 ? '+' : ''; // No sign for negative numbers as Math.round includes it (except 0)
    // Actually, Math.round(-3) is -3. String( -3 ) is "-3".
    // We just want explicit plus for positive.
    return rounded === 0 ? '0' : `${sign}${rounded}`;
}

/**
 * Gets the direction arrow
 */
export function getDriverDirectionArrow(direction: ContributionDirection): string {
    switch (direction) {
        case 'up': return '↑';
        case 'down': return '↓';
        default: return '→';
    }
}
