/**
 * Session Code Utility Unit Tests (US-011)
 * 
 * @module tests/utils/session-code.test
 * @description Unit tests for session code generation and formatting
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    generateSessionCode,
    generateUniqueCode,
    formatCodeForDisplay,
    parseDisplayCode,
    isValidSessionCode,
    SESSION_CODE_CHARSET,
    SESSION_CODE_LENGTH,
    MAX_CODE_GENERATION_RETRIES,
    CodeGenerationError,
} from '@/lib/utils/session-code';

// ============================================
// Mock Supabase Client
// ============================================

function createMockSupabase(existingCodes: string[] = []) {
    const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockImplementation(async () => {
            // Get the last code that was checked (from the eq call)
            const lastCall = mockChain.eq.mock.calls[mockChain.eq.mock.calls.length - 1];
            const codeToCheck = lastCall?.[1];

            if (existingCodes.includes(codeToCheck)) {
                return { data: { id: 'existing-id' }, error: null };
            }
            return { data: null, error: { code: 'PGRST116' } };
        }),
    };

    return {
        from: vi.fn().mockReturnValue(mockChain),
        _mockChain: mockChain,
    };
}

// ============================================
// generateSessionCode Tests
// ============================================

describe('generateSessionCode', () => {
    it('should generate a 6-character code by default', () => {
        const code = generateSessionCode();

        expect(code).toHaveLength(SESSION_CODE_LENGTH);
        expect(code).toHaveLength(6);
    });

    it('should generate a code with custom length', () => {
        const code = generateSessionCode(8);

        expect(code).toHaveLength(8);
    });

    it('should only use characters from the allowed charset', () => {
        // Generate multiple codes to increase confidence
        for (let i = 0; i < 100; i++) {
            const code = generateSessionCode();

            for (const char of code) {
                expect(SESSION_CODE_CHARSET).toContain(char);
            }
        }
    });

    it('should NOT contain ambiguous characters (O, 0, I, 1)', () => {
        const ambiguousChars = ['O', '0', 'I', '1'];

        // Generate many codes to check
        for (let i = 0; i < 100; i++) {
            const code = generateSessionCode();

            for (const char of code) {
                expect(ambiguousChars).not.toContain(char);
            }
        }
    });

    it('should generate uppercase characters only', () => {
        for (let i = 0; i < 50; i++) {
            const code = generateSessionCode();

            expect(code).toBe(code.toUpperCase());
        }
    });

    it('should generate different codes (randomness test)', () => {
        const codes = new Set<string>();

        // Generate 50 codes and check they're mostly unique
        for (let i = 0; i < 50; i++) {
            codes.add(generateSessionCode());
        }

        // With 32 chars and 6 positions, collision chance is very low
        // We should have at least 45 unique codes out of 50
        expect(codes.size).toBeGreaterThan(45);
    });
});

// ============================================
// generateUniqueCode Tests
// ============================================

describe('generateUniqueCode', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return a unique code when no collision', async () => {
        const mockSupabase = createMockSupabase([]);

        const code = await generateUniqueCode(mockSupabase as never);

        expect(code).toHaveLength(6);
        expect(mockSupabase.from).toHaveBeenCalledWith('sessions');
    });

    it('should retry when collision occurs', async () => {
        // First code will collide, second won't
        let callCount = 0;
        const mockChain = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockImplementation(async () => {
                callCount++;
                if (callCount === 1) {
                    return { data: { id: 'existing' }, error: null };
                }
                return { data: null, error: { code: 'PGRST116' } };
            }),
        };

        const mockSupabase = {
            from: vi.fn().mockReturnValue(mockChain),
        };

        const code = await generateUniqueCode(mockSupabase as never);

        expect(code).toHaveLength(6);
        expect(callCount).toBe(2);
    });

    it('should throw CodeGenerationError after max retries', async () => {
        // All codes collide
        const mockChain = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: 'existing' }, error: null }),
        };

        const mockSupabase = {
            from: vi.fn().mockReturnValue(mockChain),
        };

        await expect(
            generateUniqueCode(mockSupabase as never, 3)
        ).rejects.toThrow(CodeGenerationError);
    });

    it('should respect custom maxRetries parameter', async () => {
        let callCount = 0;
        const mockChain = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockImplementation(async () => {
                callCount++;
                return { data: { id: 'existing' }, error: null };
            }),
        };

        const mockSupabase = {
            from: vi.fn().mockReturnValue(mockChain),
        };

        try {
            await generateUniqueCode(mockSupabase as never, 5);
        } catch {
            // Expected to throw
        }

        expect(callCount).toBe(5);
    });

    it('should use default max retries of 10', () => {
        expect(MAX_CODE_GENERATION_RETRIES).toBe(10);
    });
});

// ============================================
// formatCodeForDisplay Tests
// ============================================

describe('formatCodeForDisplay', () => {
    it('should format 6-char code as ABC-123', () => {
        expect(formatCodeForDisplay('A7K9B2')).toBe('A7K-9B2');
        expect(formatCodeForDisplay('ABCDEF')).toBe('ABC-DEF');
        expect(formatCodeForDisplay('X3M8F4')).toBe('X3M-8F4');
    });

    it('should convert to uppercase', () => {
        expect(formatCodeForDisplay('a7k9b2')).toBe('A7K-9B2');
        expect(formatCodeForDisplay('AbCdEf')).toBe('ABC-DEF');
    });

    it('should handle short codes gracefully', () => {
        expect(formatCodeForDisplay('AB')).toBe('AB');
        expect(formatCodeForDisplay('ABC')).toBe('ABC');
    });

    it('should handle empty string', () => {
        expect(formatCodeForDisplay('')).toBe('');
    });

    it('should handle longer codes', () => {
        expect(formatCodeForDisplay('ABCDEFGH')).toBe('ABCD-EFGH');
    });
});

// ============================================
// parseDisplayCode Tests
// ============================================

describe('parseDisplayCode', () => {
    it('should parse formatted code back to raw', () => {
        expect(parseDisplayCode('A7K-9B2')).toBe('A7K9B2');
        expect(parseDisplayCode('ABC-DEF')).toBe('ABCDEF');
    });

    it('should handle code without separator', () => {
        expect(parseDisplayCode('A7K9B2')).toBe('A7K9B2');
    });

    it('should convert to uppercase', () => {
        expect(parseDisplayCode('a7k-9b2')).toBe('A7K9B2');
    });

    it('should handle multiple separators', () => {
        expect(parseDisplayCode('A-B-C-D')).toBe('ABCD');
    });
});

// ============================================
// isValidSessionCode Tests
// ============================================

describe('isValidSessionCode', () => {
    it('should return true for valid codes', () => {
        expect(isValidSessionCode('A7K9B2')).toBe(true);
        expect(isValidSessionCode('ABCDEF')).toBe(true);
        expect(isValidSessionCode('234567')).toBe(true);
        expect(isValidSessionCode('X3M8F4')).toBe(true);
    });

    it('should return false for codes with ambiguous characters', () => {
        expect(isValidSessionCode('A0K9B2')).toBe(false); // contains 0
        expect(isValidSessionCode('A1K9B2')).toBe(false); // contains 1
        expect(isValidSessionCode('AOK9B2')).toBe(false); // contains O
        expect(isValidSessionCode('AIK9B2')).toBe(false); // contains I
    });

    it('should return false for wrong length', () => {
        expect(isValidSessionCode('ABC')).toBe(false);
        expect(isValidSessionCode('ABCDEFGH')).toBe(false);
        expect(isValidSessionCode('')).toBe(false);
    });

    it('should return false for codes with invalid characters', () => {
        expect(isValidSessionCode('ABC-DE')).toBe(false); // contains -
        expect(isValidSessionCode('ABC DE')).toBe(false); // contains space
        expect(isValidSessionCode('ABC@EF')).toBe(false); // contains @
    });

    it('should be case-insensitive', () => {
        expect(isValidSessionCode('a7k9b2')).toBe(true);
        expect(isValidSessionCode('AbCdEf')).toBe(true);
    });
});

// ============================================
// Charset Validation Tests
// ============================================

describe('SESSION_CODE_CHARSET', () => {
    it('should have 32 characters', () => {
        // 24 letters (A-Z minus I and O) + 8 digits (2-9)
        expect(SESSION_CODE_CHARSET).toHaveLength(32);
    });

    it('should not contain O, 0, I, or 1', () => {
        expect(SESSION_CODE_CHARSET).not.toContain('O');
        expect(SESSION_CODE_CHARSET).not.toContain('0');
        expect(SESSION_CODE_CHARSET).not.toContain('I');
        expect(SESSION_CODE_CHARSET).not.toContain('1');
    });

    it('should contain all expected letters', () => {
        const expectedLetters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
        for (const letter of expectedLetters) {
            expect(SESSION_CODE_CHARSET).toContain(letter);
        }
    });

    it('should contain digits 2-9', () => {
        for (let i = 2; i <= 9; i++) {
            expect(SESSION_CODE_CHARSET).toContain(String(i));
        }
    });
});
