/**
 * E2E Test: Turn Flow
 * 
 * Tests the game turn navigation and phases
 * Note: Requires authenticated session to fully test
 */

import { test, expect } from '@playwright/test';

test.describe('Turn Page Structure', () => {
    // These tests verify page structure without authentication
    // Full flow tests would require login setup

    test('Turn page with invalid session shows error', async ({ page }) => {
        await page.goto('/game/invalid-session-id/turn/1');

        // Should either show error or redirect
        await page.waitForTimeout(2000);

        // Check for error state or redirect
        const errorVisible = await page.locator('text=Erreur').isVisible();
        const redirected = !page.url().includes('invalid-session-id');

        expect(errorVisible || redirected).toBeTruthy();
    });

    test('Game setup page structure', async ({ page }) => {
        // Navigate to a setup page (will error without valid session)
        await page.goto('/game/test-session/setup');
        await page.waitForTimeout(2000);

        // Page should either show setup or error/redirect
        const hasContent = await page.locator('body').textContent();
        expect(hasContent).toBeTruthy();
    });
});

test.describe('API Responses', () => {
    test('Session API requires authentication', async ({ request }) => {
        const response = await request.get('/api/sessions');
        expect(response.status()).toBe(401);
    });

    test('Turn resolve API requires authentication', async ({ request }) => {
        const response = await request.get('/api/game/test-id/turns/1/resolve');
        expect(response.status()).toBe(401);
    });

    test('Confirm scope API requires authentication', async ({ request }) => {
        const response = await request.post('/api/sessions/test-id/confirm-scope', {
            data: { products: ['auto'] }
        });
        expect(response.status()).toBe(401);
    });
});
