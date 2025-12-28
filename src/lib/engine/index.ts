/**
 * Engine Module - Public API
 * 
 * @module lib/engine
 * @description Simulation engine core exports (US-006)
 */

// Version management
export {
    ENGINE_VERSION,
    ENGINE_METADATA,
    parseVersion,
    isSameMajorVersion,
    type EngineMetadata,
} from './version';

// Version validation
export {
    validateEngineVersion,
    isVersionCompatible,
    areResultsComparable,
    getVersionWarning,
    EngineVersionMismatchError,
} from './validation';
