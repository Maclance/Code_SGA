/**
 * Application URL Utility
 *
 * @module lib/utils/app-url
 * @description Provides the application base URL for both server and client components.
 *              Automatically handles development port changes.
 */

/**
 * Get the application base URL
 *
 * Priority:
 * 1. NEXT_PUBLIC_APP_URL environment variable (if set)
 * 2. VERCEL_URL for Vercel deployments
 * 3. Window location in browser
 * 4. Default localhost:3000
 */
export function getAppUrl(): string {
    // Check environment variable first
    if (process.env.NEXT_PUBLIC_APP_URL) {
        return process.env.NEXT_PUBLIC_APP_URL;
    }

    // Vercel deployment
    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
    }

    // Browser environment - use current location
    if (typeof window !== 'undefined') {
        return window.location.origin;
    }

    // Default fallback for server-side
    return 'http://localhost:3000';
}

/**
 * Get the application base URL for server-side use
 * Uses headers to detect the actual host in development
 */
export async function getServerAppUrl(): Promise<string> {
    // Check environment variable first
    if (process.env.NEXT_PUBLIC_APP_URL) {
        return process.env.NEXT_PUBLIC_APP_URL;
    }

    // Vercel deployment
    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
    }

    // Try to get from headers (Next.js specific)
    try {
        const { headers } = await import('next/headers');
        const headersList = await headers();
        const host = headersList.get('host');
        const protocol = headersList.get('x-forwarded-proto') || 'http';

        if (host) {
            return `${protocol}://${host}`;
        }
    } catch {
        // Headers not available (not in a request context)
    }

    // Default fallback
    return 'http://localhost:3000';
}
