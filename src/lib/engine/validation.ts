/**
 * Engine Version Validation
 * 
 * @module lib/engine/validation
 * @description Version validation and error handling (US-006)
 * 
 * Key invariant: Sessions created with one engine version cannot
 * be recalculated with a different version.
 * 
 * References:
 * - docs/20_simulation/overview.md (INV-ENGINE-01, INV-ENGINE-05)
 */

import { ENGINE_VERSION } from './version';

// ============================================
// Error Classes
// ============================================

/**
 * Error thrown when engine version mismatch is detected
 * 
 * @example
 * ```typescript
 * try {
 *   validateEngineVersion(session.engine_version);
 * } catch (error) {
 *   if (error instanceof EngineVersionMismatchError) {
 *     console.log(error.sessionVersion, error.currentVersion);
 *   }
 * }
 * ```
 */
export class EngineVersionMismatchError extends Error {
    public readonly code = 'ENGINE_VERSION_MISMATCH';
    public readonly statusCode = 409; // Conflict

    constructor(
        public readonly sessionVersion: string,
        public readonly currentVersion: string
    ) {
        super(
            `Engine version mismatch: session uses v${sessionVersion}, ` +
            `current engine is v${currentVersion}. ` +
            `Recalculation not allowed - results would be inconsistent.`
        );
        this.name = 'EngineVersionMismatchError';
    }
}

// ============================================
// Validation Functions
// ============================================

/**
 * Validate that session engine version matches current engine version
 * 
 * This MUST be called before any recalculation or result comparison.
 * Implements INV-ENGINE-01: Recalcul rétroactif interdit.
 * 
 * @param sessionVersion - Engine version stored in the session
 * @param currentVersion - Current engine version (defaults to ENGINE_VERSION)
 * @throws {EngineVersionMismatchError} If versions don't match
 * 
 * @example
 * ```typescript
 * // Before recalculating a session
 * validateEngineVersion(session.engine_version);
 * 
 * // Before comparing scores
 * validateEngineVersion(session1.engine_version);
 * validateEngineVersion(session2.engine_version);
 * ```
 */
export function validateEngineVersion(
    sessionVersion: string,
    currentVersion: string = ENGINE_VERSION
): void {
    if (sessionVersion !== currentVersion) {
        throw new EngineVersionMismatchError(sessionVersion, currentVersion);
    }
}

/**
 * Check if a session's engine version is compatible with current engine
 * 
 * Unlike validateEngineVersion, this returns a boolean instead of throwing.
 * Useful for UI warnings or conditional logic.
 * 
 * @param sessionVersion - Engine version stored in the session
 * @param currentVersion - Current engine version (defaults to ENGINE_VERSION)
 * @returns True if versions match exactly
 */
export function isVersionCompatible(
    sessionVersion: string,
    currentVersion: string = ENGINE_VERSION
): boolean {
    return sessionVersion === currentVersion;
}

/**
 * Check if two sessions can have their results compared
 * 
 * Sessions with different engine versions should not have their
 * scores directly compared, as the calculation logic may differ.
 * 
 * @param version1 - First session's engine version
 * @param version2 - Second session's engine version
 * @returns True if results are comparable
 */
export function areResultsComparable(
    version1: string,
    version2: string
): boolean {
    return version1 === version2;
}

/**
 * Generate a warning message for version mismatch (for UI display)
 * 
 * @param sessionVersion - Session's engine version
 * @param currentVersion - Current engine version
 * @returns Warning message or null if versions match
 */
export function getVersionWarning(
    sessionVersion: string,
    currentVersion: string = ENGINE_VERSION
): string | null {
    if (sessionVersion === currentVersion) {
        return null;
    }

    return `Cette session a été créée avec le moteur v${sessionVersion}. ` +
        `La version actuelle est v${currentVersion}. ` +
        `Les scores ne sont pas comparables entre versions différentes.`;
}
