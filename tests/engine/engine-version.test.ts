/**
 * Engine Version Unit Tests
 * 
 * @module tests/engine/engine-version.test
 * @description Unit tests for engine versioning (US-006)
 */

import { describe, it, expect } from 'vitest';
import {
    ENGINE_VERSION,
    ENGINE_METADATA,
    parseVersion,
    isSameMajorVersion,
    validateEngineVersion,
    isVersionCompatible,
    areResultsComparable,
    getVersionWarning,
    EngineVersionMismatchError,
} from '@/lib/engine';

// ============================================
// Version Constants Tests
// ============================================

describe('Engine Version Constants', () => {
    describe('ENGINE_VERSION', () => {
        it('should be a valid semver string (MAJOR.MINOR.PATCH)', () => {
            expect(ENGINE_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
        });

        it('should be 1.0.0 for MVP', () => {
            expect(ENGINE_VERSION).toBe('1.0.0');
        });
    });

    describe('ENGINE_METADATA', () => {
        it('should have version matching ENGINE_VERSION', () => {
            expect(ENGINE_METADATA.version).toBe(ENGINE_VERSION);
        });

        it('should have a valid release date', () => {
            expect(ENGINE_METADATA.releaseDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });

        it('should have breaking flag as boolean', () => {
            expect(typeof ENGINE_METADATA.breaking).toBe('boolean');
        });

        it('should have a description', () => {
            expect(ENGINE_METADATA.description).toBeTruthy();
            expect(typeof ENGINE_METADATA.description).toBe('string');
        });
    });
});

// ============================================
// Version Parsing Tests
// ============================================

describe('parseVersion', () => {
    it('should parse valid version string', () => {
        const result = parseVersion('1.2.3');

        expect(result).toEqual({
            major: 1,
            minor: 2,
            patch: 3,
        });
    });

    it('should parse ENGINE_VERSION', () => {
        const result = parseVersion(ENGINE_VERSION);

        expect(result).not.toBeNull();
        expect(result?.major).toBe(1);
        expect(result?.minor).toBe(0);
        expect(result?.patch).toBe(0);
    });

    it('should return null for invalid version format', () => {
        expect(parseVersion('invalid')).toBeNull();
        expect(parseVersion('1.2')).toBeNull();
        expect(parseVersion('1.2.3.4')).toBeNull();
        expect(parseVersion('')).toBeNull();
        expect(parseVersion('v1.0.0')).toBeNull(); // No 'v' prefix
    });

    it('should handle large version numbers', () => {
        const result = parseVersion('100.200.300');

        expect(result).toEqual({
            major: 100,
            minor: 200,
            patch: 300,
        });
    });
});

describe('isSameMajorVersion', () => {
    it('should return true for same major version', () => {
        expect(isSameMajorVersion('1.0.0', '1.2.3')).toBe(true);
        expect(isSameMajorVersion('2.0.0', '2.99.99')).toBe(true);
    });

    it('should return false for different major versions', () => {
        expect(isSameMajorVersion('1.0.0', '2.0.0')).toBe(false);
        expect(isSameMajorVersion('0.9.9', '1.0.0')).toBe(false);
    });

    it('should return false for invalid versions', () => {
        expect(isSameMajorVersion('invalid', '1.0.0')).toBe(false);
        expect(isSameMajorVersion('1.0.0', 'invalid')).toBe(false);
    });
});

// ============================================
// Validation Tests
// ============================================

describe('validateEngineVersion', () => {
    it('should not throw when versions match', () => {
        expect(() => validateEngineVersion(ENGINE_VERSION)).not.toThrow();
        expect(() => validateEngineVersion('1.0.0', '1.0.0')).not.toThrow();
    });

    it('should throw EngineVersionMismatchError when versions differ', () => {
        expect(() => validateEngineVersion('0.9.0')).toThrow(EngineVersionMismatchError);
        expect(() => validateEngineVersion('2.0.0')).toThrow(EngineVersionMismatchError);
    });

    it('should include version info in error', () => {
        try {
            validateEngineVersion('0.9.0', '1.0.0');
            expect.fail('Should have thrown');
        } catch (error) {
            expect(error).toBeInstanceOf(EngineVersionMismatchError);
            const e = error as EngineVersionMismatchError;
            expect(e.sessionVersion).toBe('0.9.0');
            expect(e.currentVersion).toBe('1.0.0');
            expect(e.code).toBe('ENGINE_VERSION_MISMATCH');
            expect(e.statusCode).toBe(409);
        }
    });

    it('should have descriptive error message', () => {
        try {
            validateEngineVersion('0.9.0', '1.0.0');
        } catch (error) {
            const e = error as EngineVersionMismatchError;
            expect(e.message).toContain('0.9.0');
            expect(e.message).toContain('1.0.0');
            expect(e.message).toContain('Recalculation not allowed');
        }
    });
});

describe('isVersionCompatible', () => {
    it('should return true for matching versions', () => {
        expect(isVersionCompatible(ENGINE_VERSION)).toBe(true);
        expect(isVersionCompatible('1.0.0', '1.0.0')).toBe(true);
    });

    it('should return false for different versions', () => {
        expect(isVersionCompatible('0.9.0')).toBe(false);
        expect(isVersionCompatible('1.0.1')).toBe(false);
    });
});

describe('areResultsComparable', () => {
    it('should return true for identical versions', () => {
        expect(areResultsComparable('1.0.0', '1.0.0')).toBe(true);
        expect(areResultsComparable('2.1.3', '2.1.3')).toBe(true);
    });

    it('should return false for different versions', () => {
        expect(areResultsComparable('1.0.0', '1.0.1')).toBe(false);
        expect(areResultsComparable('1.0.0', '2.0.0')).toBe(false);
    });
});

describe('getVersionWarning', () => {
    it('should return null when versions match', () => {
        expect(getVersionWarning(ENGINE_VERSION)).toBeNull();
        expect(getVersionWarning('1.0.0', '1.0.0')).toBeNull();
    });

    it('should return warning message when versions differ', () => {
        const warning = getVersionWarning('0.9.0', '1.0.0');

        expect(warning).not.toBeNull();
        expect(warning).toContain('0.9.0');
        expect(warning).toContain('1.0.0');
    });

    it('should be in French for UI display', () => {
        const warning = getVersionWarning('0.9.0');

        expect(warning).toContain('Cette session');
    });
});

// ============================================
// EngineVersionMismatchError Tests
// ============================================

describe('EngineVersionMismatchError', () => {
    it('should have correct name', () => {
        const error = new EngineVersionMismatchError('0.9.0', '1.0.0');

        expect(error.name).toBe('EngineVersionMismatchError');
    });

    it('should be an instance of Error', () => {
        const error = new EngineVersionMismatchError('0.9.0', '1.0.0');

        expect(error).toBeInstanceOf(Error);
    });

    it('should have statusCode 409 (Conflict)', () => {
        const error = new EngineVersionMismatchError('0.9.0', '1.0.0');

        expect(error.statusCode).toBe(409);
    });

    it('should have code ENGINE_VERSION_MISMATCH', () => {
        const error = new EngineVersionMismatchError('0.9.0', '1.0.0');

        expect(error.code).toBe('ENGINE_VERSION_MISMATCH');
    });
});
