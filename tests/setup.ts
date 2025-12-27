/**
 * Setup file for Vitest tests
 * This file runs before each test file
 */

import { afterEach, vi } from 'vitest';

// Reset all mocks after each test
afterEach(() => {
    vi.resetAllMocks();
});

// Global test utilities can be added here
