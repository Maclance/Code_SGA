/**
 * Engine Module - Public API
 *
 * @module lib/engine
 * @description Simulation engine core exports (US-006, US-020)
 */

// ============================================
// VERSION MANAGEMENT (US-006)
// ============================================

export {
    ENGINE_VERSION,
    ENGINE_METADATA,
    parseVersion,
    isSameMajorVersion,
    type EngineMetadata,
} from './version';

export {
    validateEngineVersion,
    isVersionCompatible,
    areResultsComparable,
    getVersionWarning,
    EngineVersionMismatchError,
} from './validation';

// ============================================
// TYPES (US-020)
// ============================================

export type {
    IndicesState,
    IndexId,
    CompanyVariables,
    PnLState,
    Difficulty,
} from './types';

export {
    INDEX_IDS,
    VARIATION_MAX_BY_DIFFICULTY,
    DEFAULT_INDICES,
} from './types';

// ============================================
// UTILITIES (US-020)
// ============================================

export {
    clamp,
    clampIndex,
    safeDiv,
    safeDivMin,
    debugCalc,
} from './utils';

// ============================================
// INDICES CALCULATIONS (US-020)
// ============================================

export {
    calculateIAC,
    calculateIPQO,
    calculateIERH,
    calculateIRF,
    calculateIMD,
    calculateIS,
    calculateIPP,
    calculateAllIndices,
} from './indices';

// ============================================
// P&L CALCULATIONS (US-020)
// ============================================

export {
    calculatePnL,
    validatePnLFormula,
    isProfitable,
    getCombinedRatioZone,
} from './pnl';
