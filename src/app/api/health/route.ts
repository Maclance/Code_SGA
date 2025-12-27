import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface HealthResponse {
    status: 'healthy' | 'unhealthy';
    timestamp: string;
    version: string;
    checks: {
        database: {
            status: 'ok' | 'error';
            latency_ms?: number;
            error?: string;
        };
    };
}

/**
 * GET /api/health
 * Health check endpoint that validates the application and database connectivity.
 * Used for monitoring and deployment verification.
 */
export async function GET(): Promise<NextResponse<HealthResponse>> {
    const startTime = Date.now();

    // Check database connectivity
    let dbStatus: 'ok' | 'error' = 'error';
    let dbLatency: number | undefined;
    let dbError: string | undefined;

    try {
        const supabase = await createClient();

        // Simple query to verify database connection
        const { data, error } = await supabase
            .from('_health_check')
            .select('1')
            .limit(1)
            .maybeSingle();

        // If table doesn't exist, try a raw query
        if (error?.code === '42P01') {
            // Table doesn't exist, use RPC or simple auth check
            const { error: authError } = await supabase.auth.getSession();
            if (!authError) {
                dbStatus = 'ok';
            } else {
                dbError = authError.message;
            }
        } else if (error) {
            dbError = error.message;
        } else {
            dbStatus = 'ok';
        }

        dbLatency = Date.now() - startTime;
    } catch (err) {
        dbError = err instanceof Error ? err.message : 'Unknown database error';
        dbLatency = Date.now() - startTime;
    }

    const isHealthy = dbStatus === 'ok';

    const response: HealthResponse = {
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '0.1.0',
        checks: {
            database: {
                status: dbStatus,
                latency_ms: dbLatency,
                ...(dbError && { error: dbError }),
            },
        },
    };

    return NextResponse.json(response, {
        status: isHealthy ? 200 : 503,
        headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
    });
}
