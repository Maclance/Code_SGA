/**
 * API Smoke Tests
 * 
 * @module tests/api/api-smoke.test
 * @description Verifies API endpoints respond without 500 errors
 * 
 * Note: These tests require a running dev server.
 * They are skipped by default in unit test runs.
 * Run with TEST_WITH_SERVER=true to enable.
 */

import { describe, it, expect } from 'vitest';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const RUN_SERVER_TESTS = process.env.TEST_WITH_SERVER === 'true';

describe('API Smoke Tests', () => {
    // Skip all server-dependent tests unless explicitly enabled
    const conditionalIt = RUN_SERVER_TESTS ? it : it.skip;

    describe('Health Endpoint', () => {
        conditionalIt('GET /api/health returns 200 or 503', async () => {
            const res = await fetch(`${BASE_URL}/api/health`);
            expect([200, 503]).toContain(res.status);

            const json = await res.json();
            expect(json).toHaveProperty('status');
            expect(json).toHaveProperty('timestamp');
            expect(json).toHaveProperty('checks');
        });
    });

    describe('Auth Protected Endpoints', () => {
        conditionalIt('GET /api/sessions returns 401 without auth', async () => {
            const res = await fetch(`${BASE_URL}/api/sessions`);
            expect(res.status).toBe(401);
        });

        conditionalIt('POST /api/sessions returns 401 without auth', async () => {
            const res = await fetch(`${BASE_URL}/api/sessions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'Test' }),
            });
            expect(res.status).toBe(401);
        });
    });
});
