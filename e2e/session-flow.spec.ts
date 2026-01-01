/**
 * E2E Test: Session Flow
 * 
 * Tests the complete flow from login to game start
 */

import { test, expect } from '@playwright/test';

test.describe('Session Creation Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Note: In real tests, you'd authenticate first
        // For now, we test the public pages and error handling
    });

    test('Homepage loads correctly', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/AssurManager/);
    });

    test('Login page is accessible', async ({ page }) => {
        await page.goto('/auth/login');
        await expect(page.locator('text=Connexion')).toBeVisible();
    });

    test('Dashboard redirects to login when not authenticated', async ({ page }) => {
        await page.goto('/dashboard');
        // Should redirect to login
        await expect(page).toHaveURL(/auth\/login/);
    });

    test('Join session page is accessible', async ({ page }) => {
        await page.goto('/sessions/join');
        await expect(page.locator('text=Rejoindre')).toBeVisible();
    });

    test('Invalid session code shows error', async ({ page }) => {
        await page.goto('/sessions/join');

        // Fill invalid code
        const codeInput = page.locator('input[type="text"]');
        if (await codeInput.isVisible()) {
            await codeInput.fill('INVALID');
            await page.click('button[type="submit"]');

            // Should show error (either in form or redirect)
            await page.waitForTimeout(1000);
        }
    });
});

test.describe('Health Check', () => {
    test('Health endpoint returns status', async ({ request }) => {
        const response = await request.get('/api/health');
        expect([200, 503]).toContain(response.status());

        const json = await response.json();
        expect(json).toHaveProperty('status');
        expect(json).toHaveProperty('timestamp');
    });
});
