/**
 * Session Code Generator (US-011)
 * 
 * @module lib/utils/session-code
 * @description Generate and format unique session join codes
 * 
 * Format: 6 alphanumeric characters (e.g., A7K9B2)
 * Charset: ABCDEFGHJKLMNPQRSTUVWXYZ23456789 (no O/0/I/1 for readability)
 * Display: ABC-123 format with separator for better legibility
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// ============================================
// Constants
// ============================================

/**
 * Unambiguous character set for session codes
 * Excludes: O (confused with 0), I (confused with 1), 0, 1
 */
export const SESSION_CODE_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Default length for session codes
 */
export const SESSION_CODE_LENGTH = 6;

/**
 * Maximum retry attempts for unique code generation
 */
export const MAX_CODE_GENERATION_RETRIES = 10;

// ============================================
// Error Classes
// ============================================

/**
 * Error thrown when unique code generation fails after max retries
 */
export class CodeGenerationError extends Error {
    constructor(message: string = 'Failed to generate unique session code') {
        super(message);
        this.name = 'CodeGenerationError';
    }
}

// ============================================
// Core Functions
// ============================================

/**
 * Generate a random session code
 * 
 * @param length - Code length (default: 6)
 * @returns Random alphanumeric code (uppercase)
 * 
 * @example
 * generateSessionCode(); // "A7K9B2"
 * generateSessionCode(8); // "X3M8F4JK"
 */
export function generateSessionCode(length: number = SESSION_CODE_LENGTH): string {
    let code = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * SESSION_CODE_CHARSET.length);
        code += SESSION_CODE_CHARSET[randomIndex];
    }
    return code;
}

/**
 * Generate a unique session code that doesn't exist in the database
 * 
 * @param supabase - Supabase client instance
 * @param maxRetries - Maximum attempts before throwing (default: 10)
 * @returns Unique session code
 * @throws {CodeGenerationError} If unable to generate unique code after max retries
 * 
 * @example
 * const code = await generateUniqueCode(supabase);
 */
export async function generateUniqueCode(
    supabase: SupabaseClient,
    maxRetries: number = MAX_CODE_GENERATION_RETRIES
): Promise<string> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        const code = generateSessionCode();

        // Check if code already exists
        const { data } = await supabase
            .from('sessions')
            .select('id')
            .eq('code', code)
            .single();

        // No existing session with this code - success!
        if (!data) {
            return code;
        }
    }

    throw new CodeGenerationError(
        `Unable to generate unique session code after ${maxRetries} attempts`
    );
}

/**
 * Format a session code for display with separator
 * 
 * @param code - Raw session code (e.g., "A7K9B2")
 * @returns Formatted code with separator (e.g., "A7K-9B2")
 * 
 * @example
 * formatCodeForDisplay("A7K9B2"); // "A7K-9B2"
 * formatCodeForDisplay("ABCDEF"); // "ABC-DEF"
 */
export function formatCodeForDisplay(code: string): string {
    // Handle edge cases
    if (!code || code.length < 4) {
        return code.toUpperCase();
    }

    // Split in half with separator
    const mid = Math.floor(code.length / 2);
    return code.slice(0, mid).toUpperCase() + '-' + code.slice(mid).toUpperCase();
}

/**
 * Parse a display-formatted code back to raw format
 * 
 * @param displayCode - Formatted code with potential separator (e.g., "A7K-9B2")
 * @returns Raw uppercase code (e.g., "A7K9B2")
 * 
 * @example
 * parseDisplayCode("A7K-9B2"); // "A7K9B2"
 * parseDisplayCode("a7k9b2");  // "A7K9B2"
 */
export function parseDisplayCode(displayCode: string): string {
    return displayCode.replace(/-/g, '').toUpperCase();
}

/**
 * Validate that a code only contains valid characters
 * 
 * @param code - Code to validate
 * @returns True if code is valid
 * 
 * @example
 * isValidSessionCode("A7K9B2"); // true
 * isValidSessionCode("A0K9B2"); // false (contains 0)
 */
export function isValidSessionCode(code: string): boolean {
    if (!code || code.length !== SESSION_CODE_LENGTH) {
        return false;
    }

    const upperCode = code.toUpperCase();
    for (const char of upperCode) {
        if (!SESSION_CODE_CHARSET.includes(char)) {
            return false;
        }
    }

    return true;
}
