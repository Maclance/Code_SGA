/**
 * Engine Version Constants
 * 
 * @module lib/engine/version
 * @description Single source of truth for simulation engine version (US-006)
 * 
 * Version Format: MAJOR.MINOR.PATCH
 * - MAJOR: Breaking changes (formulas, indices recalculated)
 * - MINOR: New features, backwards compatible
 * - PATCH: Bug fixes, balance adjustments
 * 
 * References:
 * - docs/20_simulation/overview.md (section 7: Versionning du Moteur)
 * - docs/000_projet/specs_fonctionnelles_mvp.md (US-006)
 */

/**
 * Current engine version - single source of truth
 * 
 * @example
 * ```typescript
 * import { ENGINE_VERSION } from '@/lib/engine';
 * 
 * // Use when creating a session
 * const session = await createSession({
 *   ...config,
 *   engine_version: ENGINE_VERSION,
 * });
 * ```
 */
export const ENGINE_VERSION = '1.0.0' as const;

/**
 * Engine metadata interface
 */
export interface EngineMetadata {
    /** Current engine version string */
    version: typeof ENGINE_VERSION;
    /** Release date in ISO format */
    releaseDate: string;
    /** True if this version has breaking changes from previous */
    breaking: boolean;
    /** Short description of this version */
    description: string;
}

/**
 * Current engine metadata
 */
export const ENGINE_METADATA: EngineMetadata = {
    version: ENGINE_VERSION,
    releaseDate: '2025-01-15',
    breaking: false,
    description: 'MVP Release - 7 indices, Auto + MRH products, basic delay effects',
};

/**
 * Parse semantic version into components
 * 
 * @param version - Version string (e.g., "1.2.3")
 * @returns Object with major, minor, patch numbers or null if invalid
 */
export function parseVersion(version: string): { major: number; minor: number; patch: number } | null {
    const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
    if (!match) return null;

    return {
        major: parseInt(match[1], 10),
        minor: parseInt(match[2], 10),
        patch: parseInt(match[3], 10),
    };
}

/**
 * Check if two versions have the same major version (compatible for comparison)
 * 
 * @param v1 - First version
 * @param v2 - Second version
 * @returns True if major versions match
 */
export function isSameMajorVersion(v1: string, v2: string): boolean {
    const parsed1 = parseVersion(v1);
    const parsed2 = parseVersion(v2);

    if (!parsed1 || !parsed2) return false;

    return parsed1.major === parsed2.major;
}
