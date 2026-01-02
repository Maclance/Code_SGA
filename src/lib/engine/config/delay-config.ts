/**
 * Delay Configuration for Parameterized Effects
 *
 * @module lib/engine/config/delay-config
 * @description Centralized configuration for delay parameters by domain (US-023)
 *
 * References:
 * - docs/20_simulation/effets_retard.md (delay tables, speed factors)
 * - docs/000_projet/specs_fonctionnelles_mvp.md (US-023)
 *
 * @remarks
 * All delays in this file are parameterized and not hardcoded.
 * Speed multipliers affect all delays multiplicatively:
 * - fast: ×0.5
 * - medium: ×1.0
 * - slow: ×2.0
 */

// ============================================
// GAME SPEED TYPES
// ============================================

/**
 * Game speed affecting delay calculations (English)
 * Used for UI and external APIs
 */
export type GameSpeed = 'fast' | 'medium' | 'slow';

/**
 * Game speed in French (for backward compatibility with existing engine)
 */
export type GameSpeedFR = 'rapide' | 'moyenne' | 'lente';

/**
 * Mapping from English to French game speeds
 */
export const SPEED_EN_TO_FR: Record<GameSpeed, GameSpeedFR> = {
    fast: 'rapide',
    medium: 'moyenne',
    slow: 'lente',
} as const;

/**
 * Mapping from French to English game speeds
 */
export const SPEED_FR_TO_EN: Record<GameSpeedFR, GameSpeed> = {
    rapide: 'fast',
    moyenne: 'medium',
    lente: 'slow',
} as const;

// ============================================
// DELAY CONFIGURATION TYPES
// ============================================

/**
 * Configuration for delay parameters by domain
 *
 * @remarks
 * Each domain has base delays (min/max), speed multipliers,
 * decay rate, and peak turn for effect intensity.
 */
export interface DelayConfig {
    /** Business domain identifier */
    domain: string;
    /** Base delay range in turns (at medium speed) */
    baseDelay: { min: number; max: number };
    /** Multipliers applied per game speed */
    speedMultiplier: Record<GameSpeed, number>;
    /** Per-turn decay rate [0, 1] */
    decayRate: number;
    /** Turn at which effect reaches peak intensity */
    peakTurn: number;
}

// ============================================
// DELAY CONFIGURATIONS BY DOMAIN
// ============================================

/**
 * Delay configurations for each business domain
 *
 * Table des délais (vitesse Moyenne = trimestre):
 * | Domaine    | Délai min | Délai max | Decay Rate | Peak Turn |
 * |------------|:---------:|:---------:|:----------:|:---------:|
 * | RH         | 2         | 3         | 0.2        | 3         |
 * | IT/Data    | 3         | 6         | 0.15       | 5         |
 * | Prévention | 4         | 8         | 0.1        | 6         |
 * | Réputation | 1         | 3         | 0.25       | 2         |
 * | Marketing  | 1         | 2         | 0.3        | 2         |
 * | Tarif      | 0         | 1         | 0.4        | 1         |
 *
 * @remarks
 * Speed multipliers:
 * - fast: ×0.5 (1 year/turn)
 * - medium: ×1.0 (1 quarter/turn)
 * - slow: ×2.0 (1 month/turn)
 */
export const DELAY_CONFIGS: Record<string, DelayConfig> = {
    rh: {
        domain: 'rh',
        baseDelay: { min: 2, max: 3 },
        speedMultiplier: { fast: 0.5, medium: 1, slow: 2 },
        decayRate: 0.2,
        peakTurn: 3,
    },
    it: {
        domain: 'it',
        baseDelay: { min: 3, max: 6 },
        speedMultiplier: { fast: 0.5, medium: 1, slow: 2 },
        decayRate: 0.15,
        peakTurn: 5,
    },
    prevention: {
        domain: 'prevention',
        baseDelay: { min: 4, max: 8 },
        speedMultiplier: { fast: 0.5, medium: 1, slow: 2 },
        decayRate: 0.1,
        peakTurn: 6,
    },
    reputation: {
        domain: 'reputation',
        baseDelay: { min: 1, max: 3 },
        speedMultiplier: { fast: 0.5, medium: 1, slow: 2 },
        decayRate: 0.25,
        peakTurn: 2,
    },
    marketing: {
        domain: 'marketing',
        baseDelay: { min: 1, max: 2 },
        speedMultiplier: { fast: 0.5, medium: 1, slow: 2 },
        decayRate: 0.3,
        peakTurn: 2,
    },
    tarif: {
        domain: 'tarif',
        baseDelay: { min: 0, max: 1 },
        speedMultiplier: { fast: 0.5, medium: 1, slow: 2 },
        decayRate: 0.4,
        peakTurn: 1,
    },
} as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Gets the delay configuration for a domain
 *
 * @param domain - The business domain
 * @returns DelayConfig for the domain, or default config if not found
 */
export function getDelayConfig(domain: string): DelayConfig {
    const config = DELAY_CONFIGS[domain.toLowerCase()];
    if (config) {
        return config;
    }

    // Default config for unknown domains
    console.warn(`[DELAY-CONFIG] Unknown domain "${domain}", using default config`);
    return {
        domain,
        baseDelay: { min: 1, max: 2 },
        speedMultiplier: { fast: 0.5, medium: 1, slow: 2 },
        decayRate: 0.2,
        peakTurn: 2,
    };
}

/**
 * Calculates the effective delay for a domain at a given game speed
 *
 * @param domain - The business domain
 * @param speed - Game speed (fast, medium, slow)
 * @param useMax - If true, use max delay; otherwise use min delay
 * @returns Calculated delay in turns (minimum 1 for most effects)
 *
 * @example
 * ```ts
 * // RH domain at medium speed
 * const delay = getDelayForDomain('rh', 'medium');
 * // delay === 2 (min) or 3 (max with useMax=true)
 *
 * // IT domain at fast speed
 * const fastDelay = getDelayForDomain('it', 'fast');
 * // fastDelay === 2 (3 × 0.5 = 1.5, rounded up)
 * ```
 */
export function getDelayForDomain(
    domain: string,
    speed: GameSpeed = 'medium',
    useMax: boolean = false
): number {
    const config = getDelayConfig(domain);
    const multiplier = config.speedMultiplier[speed];
    const baseDelay = useMax ? config.baseDelay.max : config.baseDelay.min;

    const calculatedDelay = baseDelay * multiplier;

    // Minimum delay of 0 for tarif domain, 1 for others
    const minDelay = domain.toLowerCase() === 'tarif' ? 0 : 1;
    return Math.max(minDelay, Math.ceil(calculatedDelay));
}

/**
 * Gets the delay range for a domain at a given game speed
 *
 * @param domain - The business domain
 * @param speed - Game speed
 * @returns Object with min and max delay values
 *
 * @example
 * ```ts
 * const range = getDelayRange('rh', 'medium');
 * // range === { min: 2, max: 3 }
 *
 * const fastRange = getDelayRange('it', 'fast');
 * // fastRange === { min: 2, max: 3 } (3×0.5=1.5→2, 6×0.5=3)
 * ```
 */
export function getDelayRange(
    domain: string,
    speed: GameSpeed = 'medium'
): { min: number; max: number } {
    return {
        min: getDelayForDomain(domain, speed, false),
        max: getDelayForDomain(domain, speed, true),
    };
}

/**
 * Gets the decay rate for a domain
 *
 * @param domain - The business domain
 * @returns Decay rate [0, 1]
 */
export function getDecayRate(domain: string): number {
    return getDelayConfig(domain).decayRate;
}

/**
 * Converts GameSpeed from English to French
 */
export function toFrenchSpeed(speed: GameSpeed): GameSpeedFR {
    return SPEED_EN_TO_FR[speed];
}

/**
 * Converts GameSpeed from French to English
 */
export function toEnglishSpeed(speed: GameSpeedFR): GameSpeed {
    return SPEED_FR_TO_EN[speed];
}

/**
 * Validates if a string is a valid GameSpeed (English)
 */
export function isValidGameSpeed(speed: string): speed is GameSpeed {
    return speed === 'fast' || speed === 'medium' || speed === 'slow';
}

/**
 * Validates if a string is a valid GameSpeedFR (French)
 */
export function isValidGameSpeedFR(speed: string): speed is GameSpeedFR {
    return speed === 'rapide' || speed === 'moyenne' || speed === 'lente';
}
