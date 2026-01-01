/**
 * Critical Routes Test
 * 
 * @module tests/critical-routes.test
 * @description Unit tests to verify critical files exist
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
    CRITICAL_ROUTES,
    CRITICAL_ENGINE_FILES,
    CRITICAL_SERVICE_FILES,
} from '../scripts/critical-routes';

const basePath = path.resolve(__dirname, '..');

describe('Critical API Routes', () => {
    it.each(CRITICAL_ROUTES)('API route %s exists', (routePath) => {
        const fullPath = path.join(basePath, routePath);
        expect(fs.existsSync(fullPath), `Missing: ${routePath}`).toBe(true);
    });
});

describe('Critical Engine Files', () => {
    it.each(CRITICAL_ENGINE_FILES)('Engine file %s exists', (filePath) => {
        const fullPath = path.join(basePath, filePath);
        expect(fs.existsSync(fullPath), `Missing: ${filePath}`).toBe(true);
    });
});

describe('Critical Service Files', () => {
    it.each(CRITICAL_SERVICE_FILES)('Service file %s exists', (filePath) => {
        const fullPath = path.join(basePath, filePath);
        expect(fs.existsSync(fullPath), `Missing: ${filePath}`).toBe(true);
    });
});

describe('Route files are not empty', () => {
    it.each(CRITICAL_ROUTES)('%s is not empty', (routePath) => {
        const fullPath = path.join(basePath, routePath);
        if (fs.existsSync(fullPath)) {
            const content = fs.readFileSync(fullPath, 'utf-8');
            expect(content.length, `File is empty: ${routePath}`).toBeGreaterThan(100);
        }
    });
});
