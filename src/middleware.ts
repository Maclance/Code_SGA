/**
 * Next.js Middleware
 *
 * @module middleware
 * @description Route protection and authentication middleware (US-002)
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Protected route patterns
 */
const PROTECTED_ROUTES = [
    '/dashboard',
    '/api/tenants',
    '/admin',
];

/**
 * Public routes (no auth required)
 */
const PUBLIC_ROUTES = [
    '/auth/accept-invitation',
    '/api/health',
];

/**
 * Check if the request path matches any pattern
 */
function matchesPattern(pathname: string, patterns: string[]): boolean {
    return patterns.some((pattern) => pathname.startsWith(pattern));
}

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
                    cookiesToSet.forEach(({ name, value }: { name: string; value: string }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options: CookieOptions }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // Get current user session
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { pathname } = request.nextUrl;

    // Allow public routes
    if (matchesPattern(pathname, PUBLIC_ROUTES)) {
        return supabaseResponse;
    }

    // Check protected routes
    if (matchesPattern(pathname, PROTECTED_ROUTES)) {
        if (!user) {
            // Redirect to login for browser requests
            if (!pathname.startsWith('/api')) {
                const loginUrl = new URL('/auth/login', request.url);
                loginUrl.searchParams.set('redirect', pathname);
                return NextResponse.redirect(loginUrl);
            }

            // Return 401 for API requests
            return NextResponse.json(
                { error: 'unauthorized', message: 'Authentication required' },
                { status: 401 }
            );
        }
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder files
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
