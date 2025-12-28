/**
 * Rate Limiter
 *
 * @module lib/auth/rate-limiter
 * @description Rate limiting for login attempts (US-003 AC3)
 */

import { createClient } from '@supabase/supabase-js';

const WINDOW_MINUTES = 15;
const MAX_ATTEMPTS = 5;

interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: Date;
}

interface RecordAttemptOptions {
    email: string;
    ipAddress: string;
    success: boolean;
    userAgent?: string;
    errorCode?: string;
}

/**
 * Get admin Supabase client with service role for bypassing RLS
 */
function getAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    return createClient(url, serviceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}

/**
 * Check if a login attempt is rate limited
 * 
 * @param email - User email
 * @param ipAddress - Client IP address
 * @returns Rate limit status
 */
export async function checkRateLimit(
    email: string,
    ipAddress: string
): Promise<RateLimitResult> {
    const supabase = getAdminClient();

    try {
        const { data, error } = await supabase.rpc('check_login_rate_limit', {
            p_email: email,
            p_ip: ipAddress,
            p_window_minutes: WINDOW_MINUTES,
            p_max_attempts: MAX_ATTEMPTS,
        });

        if (error) {
            console.error('Rate limit check error:', error);
            // On error, allow the request (fail open for rate limiting)
            return {
                allowed: true,
                remaining: MAX_ATTEMPTS,
                resetAt: new Date(Date.now() + WINDOW_MINUTES * 60 * 1000),
            };
        }

        const result = data?.[0] || data;

        return {
            allowed: !result.is_limited,
            remaining: result.remaining_attempts,
            resetAt: new Date(result.reset_at),
        };
    } catch (err) {
        console.error('Rate limit check exception:', err);
        // On error, allow the request
        return {
            allowed: true,
            remaining: MAX_ATTEMPTS,
            resetAt: new Date(Date.now() + WINDOW_MINUTES * 60 * 1000),
        };
    }
}

/**
 * Record a login attempt
 * 
 * @param options - Attempt details
 */
export async function recordAttempt(options: RecordAttemptOptions): Promise<void> {
    const supabase = getAdminClient();

    try {
        const { error } = await supabase.from('login_attempts').insert({
            email: options.email,
            ip_address: options.ipAddress,
            success: options.success,
            user_agent: options.userAgent,
            error_code: options.errorCode,
        });

        if (error) {
            console.error('Failed to record login attempt:', error);
        }
    } catch (err) {
        console.error('Record attempt exception:', err);
    }
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
    return {
        'X-RateLimit-Limit': MAX_ATTEMPTS.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': Math.floor(result.resetAt.getTime() / 1000).toString(),
    };
}
