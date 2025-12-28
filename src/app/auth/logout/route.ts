/**
 * Logout Route
 *
 * @module app/auth/logout
 * @description Server route to handle user logout (US-003)
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * POST /auth/logout
 * Signs out the current user and redirects to login
 */
export async function POST(request: NextRequest) {
    const supabase = await createClient();

    // Sign out the user
    const { error } = await supabase.auth.signOut();

    if (error) {
        console.error('Logout error:', error);
        // Still redirect even on error - user wants to leave
    }

    // Redirect to login page
    return NextResponse.redirect(new URL('/auth/login', request.url));
}

/**
 * GET /auth/logout
 * Alternative logout via GET for link-based logout
 */
export async function GET(request: NextRequest) {
    const supabase = await createClient();

    await supabase.auth.signOut();

    return NextResponse.redirect(new URL('/auth/login', request.url));
}
