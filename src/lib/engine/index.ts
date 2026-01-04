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
// PRODUCT TYPES (US-023)
// ============================================

export type {
    ProductDecision,
    DecisionApplicationResult,
    DecisionDomain,
} from './product-types';

export {
    SHARED_DOMAINS,
    isSharedDomain,
} from './product-types';

// ============================================
// PRODUCT ENGINE (US-022, US-023)
// ============================================

export type { ProductInputs } from './product-engine';

export {
    calculateRatioSP,
    calculateFrequence,
    calculateCoutMoyen,
    calculateProductMetrics,
    isProductAffected,
    applyRateChange,
    applyDecisionToProduct,
    applyDecisionsToProduct,
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

// ============================================
// FRAUD N1 SYSTEM (US-025)
// ============================================

export type {
    FraudActionN1,
    FraudCostLevel,
    FraudN1Config,
    FraudN1State,
    FraudActivationResult,
    FraudLogEntry,
} from './fraud-types';

export {
    FRAUD_N1_ACTIONS,
    FRAUD_N1_CAP,
    FRAUD_N1_ACTION_IDS,
} from './fraud-types';

export {
    initializeFraudN1State,
    checkPrerequisites,
    getMissingPrerequisites,
    checkN1Cap,
    calculateFraudEffect,
    activateFraudAction,
    getAvailableActions,
    getActionConfig,
    getFraudLogs,
    clearFraudLogs,
    getFraudN1Summary,
    getTotalFraudCost,
} from './fraud-n1';

// ============================================
// DASHBOARD TYPES (US-030)
// ============================================

export type {
    DashboardConfig,
    ProductDisplayMetrics,
    IndexStatus,
    IndexDisplay,
    IndexThresholds,
    AlertType,
    AlertThresholds,
    DashboardAlert,
    EffectifSegment,
} from './dashboard-types';

export {
    getDashboardConfig,
    PRODUCT_NAMES,
    DEFAULT_INDEX_THRESHOLDS,
    getIndexStatus,
    INDEX_LABELS,
    INDEX_ICONS,
    DEFAULT_ALERT_THRESHOLDS,
    generateAlerts,
    EFFECTIF_COLORS,
} from './dashboard-types';

// ============================================
// ALERTS SYSTEM (US-032)
// ============================================

export type {
    AlertSeverity,
    AlertCategory,
    Alert,
    IndexAlertThreshold,
    PercentageAlertThreshold,
    AlertCategoryConfig,
    AlertThresholdsByDifficulty,
    AlertDetectionInput,
    AlertDifficulty,
} from './alerts';

export {
    ALERT_CATEGORIES,
    SEVERITY_PRIORITY,
    SEVERITY_ICONS,
    RECOMMENDED_LEVERS,
    ALERT_MESSAGES,
    ALERT_THRESHOLDS,
    getAlertConfig,
    getAllAlertConfigs,
    detectAlerts,
    sortAlertsBySeverity,
    isAlertResolved,
    filterAlertsBySeverity,
    filterAlertsByCategory,
    getCriticalAlerts,
    getWarningAlerts,
    ALERT_SEVERITY_VALUES,
} from './alerts';

// ============================================
// EXPLAINABILITY (US-037)
// ============================================

export type {
    Driver,
    FormattedDriver,
    AnalysisContext,
    AnalysisResult,
    ContributionDirection,
} from './explainability/driver-types';

export { DriverType } from './explainability/driver-types';

export { analyzeDrivers } from './explainability/driver-analyzer';
export { formatDriver, getDriverIcon, formatContribution, getDriverDirectionArrow } from './explainability/driver-formatter';

// ============================================
// EVENTS SYSTEM (US-033)
// ============================================

export type {
    EventCategory,
    EventType,
    EventSeverity,
    EventImpact,
    GameEvent,
    ImpactBadgeResult,
} from './events';

export {
    EVENT_TYPE_CONFIG,
    EVENT_SEVERITY_CONFIG,
    EVENT_CATEGORY_CONFIG,
    getEventTypeIcon,
    getEventTypeLabel,
    getSeverityColor,
    isCriticalEvent,
    sortEventsByTimestamp,
    filterEventsByType,
    getMostCriticalEvent,
    EventTypeEnum,
    formatEventNarrative,
    formatImpactBadge,
    formatSingleImpact,
    getEventNarrative,
    getRemainingDuration,
    formatDuration,
    isEventActive,
} from './events';

// ============================================
// LEVER GATING SYSTEM (US-034)
// ============================================

export type {
    LeverCategory,
    GatingDifficulty,
    ImpactType,
    ImpactPreview,
    LeverCost,
    LeverGatingConfig,
} from './levers/lever-config';

export {
    LEVER_CATEGORY_CONFIG,
    LEVER_GATING_CATALOG,
    LEVER_IDS_BY_DIFFICULTY,
    LEVER_COUNTS,
} from './levers/lever-config';

export type {
    LeverWithGating,
    LeversByCategory,
} from './levers/lever-gating';

export {
    getAvailableLevers,
    getAllLeversWithGating,
    getLeversByCategory,
    isLeverAvailable,
    getLeverMinDifficulty,
    getLeverConfig,
    getAvailableLeverIds,
    getGatingBadgeLabel,
    getLeverCounts,
} from './levers/lever-gating';

export type {
    LeverOption,
    LeverLevel,
    LeverPrerequisite,
    LeverWithOptions,
    LeverWithLevels,
    LeverAction,
    LevelStatus,
    ActiveLeversState,
} from './levers/option-types';

export {
    hasOptions,
    hasLevels,
    checkLevelPrerequisites,
    getLevelMissingPrerequisites,
    getLevelStatus,
    resolveLeverEffects,
} from './levers/levers-helper';
