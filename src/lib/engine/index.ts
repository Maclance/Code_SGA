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

// ============================================
// EFFECTS SYSTEM (US-021)
// ============================================

export type {
    DelayedEffect,
    EffectStack,
    EffectConfig,
    EffectDomain,
    EffectType,
    GameSpeed,
    DelayedEffectsQueue,
} from './effects-types';

export {
    DEFAULT_EFFECT_CONFIGS,
    RELATIVE_EFFECT_CAP,
    SPEED_MULTIPLIERS,
    DELAYED_INDICES,
    createEmptyEffectsQueue,
} from './effects-types';

export type { CreateEffectParams } from './delayed-effects';

export {
    createDelayedEffect,
    generateEffectId,
    resetEffectCounter,
    seededRandom,
    calculateDelay,
    applyDecay,
    getEffectiveValue,
    getActiveEffects,
    getEffectsByTarget,
    getEffectsByDomain,
    getUpcomingEffects,
    addEffectToQueue,
    markEffectsApplied,
    cleanupEffectHistory,
} from './delayed-effects';

export type { EffectResult } from './effect-stacking';

export {
    stackEffects,
    stackEffectsFromQueue,
    applyCap,
    applyCaps,
    calculateStackResult,
    calculateNetEffects,
    calculateNetEffect,
    hasCapTriggered,
    getCappedStacks,
    summarizeEffects,
} from './effect-stacking';

// ============================================
// RESOURCE MANAGEMENT (US-022)
// ============================================

export type {
    ProductId,
    ResourcePool,
    BudgetTour,
    EffectifsPool,
    PendingInvestmentEffect,
    InvestissementsPool,
    CapitalPool,
    ProductMetrics,
    AggregatedState,
    BudgetConsumeResult,
    EffectifDepartment,
    EffectifAllocateResult,
    ResourcePoolConfig,
} from './resource-types';

export {
    PRODUCT_IDS,
    DEFAULT_RESOURCE_CONFIG,
} from './resource-types';

export {
    initializeResourcePool,
    consumeBudget,
    getRemainingBudget,
    resetBudgetForTurn,
    allocateEffectifs,
    getProductEffectifs,
    getDepartmentTotal,
    addDataITInvestment,
    getActiveInvestmentEffects,
} from './resources';

// ============================================
// PRODUCT ENGINE (US-022)
// ============================================

export type { ProductInputs } from './product-engine';

export {
    calculateRatioSP,
    calculateFrequence,
    calculateCoutMoyen,
    calculateProductMetrics,
    isProductAffected,
    applyRateChange,
    DEFAULT_AUTO_INPUTS,
    DEFAULT_MRH_INPUTS,
} from './product-engine';

// ============================================
// AGGREGATION (US-022)
// ============================================

export {
    calculateWeights,
    validateWeightsSum,
    aggregateIndices,
    aggregatePnL,
    calculateAggregatedState,
    getDominantProduct,
    isBalancedPortfolio,
    createEmptyAggregatedState,
} from './aggregation';

