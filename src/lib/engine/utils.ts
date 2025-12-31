/**
 * Engine Utilities - Core helper functions
 *
 * @module lib/engine/utils
 * @description Utility functions for simulation engine (US-020)
 *
 * References:
 * - docs/20_simulation/indices.md §1.1 (clamp notation)
 * - INV-IMPL-05: Guard division by zero
 */

// ============================================
// CLAMPING
// ============================================

/**
 * Clamp a value between min and max bounds
 *
 * Implements INV-IDX-01: 0 ≤ indice ≤ 100
 *
 * @param value - The value to clamp
 * @param min - Minimum bound (inclusive)
 * @param max - Maximum bound (inclusive)
 * @returns The clamped value
 *
 * @example
 * clamp(150, 0, 100) // returns 100
 * clamp(-10, 0, 100) // returns 0
 * clamp(50, 0, 100)  // returns 50
 */
export function clamp(value: number, min: number, max: number): number {
    if (min > max) {
        throw new Error(`Invalid clamp bounds: min (${min}) > max (${max})`);
    }
    return Math.max(min, Math.min(max, value));
}

/**
 * Clamp a value to the standard index range [0, 100]
 *
 * @param value - The value to clamp
 * @returns Value clamped to [0, 100]
 */
export function clampIndex(value: number): number {
    return clamp(value, 0, 100);
}

// ============================================
// SAFE DIVISION
// ============================================

/**
 * Safe division with zero guard
 *
 * Implements INV-IMPL-05: ∀ division par variable : max(variable, 1)
 *
 * @param numerator - The numerator
 * @param denominator - The denominator (will be guarded against zero)
 * @param fallback - Value to return if denominator is zero (default: 0)
 * @returns Result of division or fallback
 *
 * @example
 * safeDiv(100, 0)        // returns 0
 * safeDiv(100, 0, 100)   // returns 100
 * safeDiv(100, 50)       // returns 2
 */
export function safeDiv(
    numerator: number,
    denominator: number,
    fallback: number = 0
): number {
    if (denominator === 0) {
        return fallback;
    }
    return numerator / denominator;
}

/**
 * Safe division using max(denominator, minDenominator)
 *
 * Per INV-IMPL-05: max(variable, 1) pour éviter NaN/Infinity
 *
 * @param numerator - The numerator
 * @param denominator - The denominator
 * @param minDenominator - Minimum value for denominator (default: 1)
 * @returns Result of numerator / max(denominator, minDenominator)
 *
 * @example
 * safeDivMin(100, 0)    // returns 100 (100 / 1)
 * safeDivMin(100, 0, 2) // returns 50 (100 / 2)
 * safeDivMin(100, 50)   // returns 2 (100 / 50)
 */
export function safeDivMin(
    numerator: number,
    denominator: number,
    minDenominator: number = 1
): number {
    return numerator / Math.max(denominator, minDenominator);
}

// ============================================
// DEBUG LOGGING
// ============================================

/**
 * Log calculation details in development mode
 *
 * @param label - Label for the calculation
 * @param value - The calculated value
 * @param details - Optional details object
 */
export function debugCalc(
    label: string,
    value: number,
    details?: Record<string, number>
): void {
    if (process.env.NODE_ENV === 'development') {
        console.debug(`[Engine] ${label}: ${value}`, details ?? '');
    }
}
