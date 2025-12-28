/**
 * Login API Route
 *
 * @module app/api/auth/login
 * @description Server-side login with rate limiting (US-003 AC3)
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { checkRateLimit, recordAttempt, getRateLimitHeaders } from '@/lib/auth/rate-limiter';
import { logLoginSuccess, logLoginFailure, logRateLimited } from '@/lib/auth/audit-logger';

/**
 * POST /api/auth/login
 * Login with rate limiting and audit logging
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password } = body;

        // Validate input
        if (!email || !password) {
            return NextResponse.json(
                { error: 'bad_request', message: 'Email and password are required' },
                { status: 400 }
            );
        }

        // Get client info
        const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            || request.headers.get('x-real-ip')
            || '127.0.0.1';
        const userAgent = request.headers.get('user-agent') || undefined;

        // Check rate limit (AC3)
        const rateLimitResult = await checkRateLimit(email, ipAddress);
        const rateLimitHeaders = getRateLimitHeaders(rateLimitResult);

        if (!rateLimitResult.allowed) {
            // Log rate limited attempt
            await logRateLimited({ email, ipAddress });
            await recordAttempt({
                email,
                ipAddress,
                success: false,
                userAgent,
                errorCode: 'rate_limited',
            });

            return NextResponse.json(
                {
                    error: 'rate_limited',
                    message: 'Trop de tentatives. Réessayez dans quelques minutes.',
                    retryAfter: Math.ceil((rateLimitResult.resetAt.getTime() - Date.now()) / 1000),
                },
                { status: 429, headers: rateLimitHeaders }
            );
        }

        // Create Supabase client with service role for auth
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
            }
        );

        // Attempt login
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            // Log failed attempt
            await recordAttempt({
                email,
                ipAddress,
                success: false,
                userAgent,
                errorCode: error.message,
            });
            await logLoginFailure({
                email,
                ipAddress,
                userAgent,
                reason: error.message,
            });

            return NextResponse.json(
                { error: 'invalid_credentials', message: 'Identifiants incorrects' },
                { status: 401, headers: rateLimitHeaders }
            );
        }

        // Log successful login
        await recordAttempt({
            email,
            ipAddress,
            success: true,
            userAgent,
        });

        // Get user's tenant info for audit log
        const { data: userData } = await supabase
            .from('users')
            .select('tenant_id')
            .eq('id', data.user.id)
            .single();

        await logLoginSuccess({
            userId: data.user.id,
            tenantId: userData?.tenant_id,
            email,
            ipAddress,
            userAgent,
        });

        return NextResponse.json(
            {
                success: true,
                session: {
                    access_token: data.session.access_token,
                    refresh_token: data.session.refresh_token,
                    expires_at: data.session.expires_at,
                },
            },
            { status: 200, headers: rateLimitHeaders }
        );
    } catch (error) {
        console.error('Login route error:', error);
        return NextResponse.json(
            { error: 'internal_error', message: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
