/**
 * Environment variables validation
 * Ensures all required env vars are present at startup
 * 
 * @module lib/env
 */

/**
 * Required environment variables for the application
 */
const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const;

/**
 * Optional environment variables (logged if missing but not fatal)
 */
const optionalEnvVars = [
    'SUPABASE_SERVICE_ROLE_KEY',
] as const;

type RequiredEnvVar = typeof requiredEnvVars[number];
type OptionalEnvVar = typeof optionalEnvVars[number];

interface EnvConfig {
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY?: string;
}

/**
 * Validates that all required environment variables are set.
 * Throws an error with explicit message if any are missing (AC3).
 * 
 * @throws {Error} If required environment variables are missing
 * @returns {EnvConfig} Validated environment configuration
 */
export function validateEnv(): EnvConfig {
    const missing: RequiredEnvVar[] = [];

    for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
            missing.push(envVar);
        }
    }

    if (missing.length > 0) {
        throw new Error(
            `❌ Missing required environment variables:\n` +
            missing.map(v => `  - ${v}`).join('\n') +
            `\n\nPlease create a .env.local file with these variables.\n` +
            `See .env.local.example for reference.`
        );
    }

    // Check optional vars and log warning
    const missingOptional: OptionalEnvVar[] = [];
    for (const envVar of optionalEnvVars) {
        if (!process.env[envVar]) {
            missingOptional.push(envVar);
        }
    }

    if (missingOptional.length > 0 && process.env.NODE_ENV === 'development') {
        console.warn(
            `⚠️ Optional environment variables not set:\n` +
            missingOptional.map(v => `  - ${v}`).join('\n')
        );
    }

    return {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    };
}

/**
 * Cached environment config (validated once at startup)
 */
let cachedEnv: EnvConfig | null = null;

/**
 * Gets the validated environment configuration.
 * Caches the result after first validation.
 * 
 * @returns {EnvConfig} Validated environment configuration
 */
export function getEnv(): EnvConfig {
    if (!cachedEnv) {
        cachedEnv = validateEnv();
    }
    return cachedEnv;
}
