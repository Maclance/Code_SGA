/**
 * Critical Routes Verification Script
 * 
 * @module scripts/critical-routes
 * @description Verifies that all critical API route files exist
 * 
 * Run: npx tsx scripts/critical-routes.ts
 * Or:  npm run check-routes
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================
// Critical Routes Registry
// ============================================

/**
 * List of all critical API routes that MUST exist
 * Add new routes here when implementing new APIs
 */
const CRITICAL_ROUTES: string[] = [
    // Sessions API
    'src/app/api/sessions/route.ts',
    'src/app/api/sessions/[sessionId]/route.ts',
    'src/app/api/sessions/[sessionId]/confirm-scope/route.ts',
    'src/app/api/sessions/join/route.ts',

    // Game API
    'src/app/api/game/[sessionId]/turns/[turnNumber]/resolve/route.ts',

    // Health API
    'src/app/api/health/route.ts',
];

/**
 * List of critical engine files
 */
const CRITICAL_ENGINE_FILES: string[] = [
    'src/lib/engine/index.ts',
    'src/lib/engine/version.ts',
    'src/lib/engine/indices.ts',
    'src/lib/engine/pnl.ts',
];

/**
 * List of critical service files
 */
const CRITICAL_SERVICE_FILES: string[] = [
    'src/lib/services/session.service.ts',
    'src/lib/services/game-state.service.ts',
];

// ============================================
// Verification Logic
// ============================================

interface VerificationResult {
    file: string;
    exists: boolean;
    category: 'route' | 'engine' | 'service';
}

function verifyFiles(
    files: string[],
    category: VerificationResult['category'],
    basePath: string
): VerificationResult[] {
    return files.map(file => {
        const fullPath = path.join(basePath, file);
        return {
            file,
            exists: fs.existsSync(fullPath),
            category,
        };
    });
}

function runVerification(): boolean {
    const basePath = process.cwd();

    console.log('🔍 Vérification des fichiers critiques...\n');

    const results: VerificationResult[] = [
        ...verifyFiles(CRITICAL_ROUTES, 'route', basePath),
        ...verifyFiles(CRITICAL_ENGINE_FILES, 'engine', basePath),
        ...verifyFiles(CRITICAL_SERVICE_FILES, 'service', basePath),
    ];

    const missing = results.filter(r => !r.exists);
    const found = results.filter(r => r.exists);

    // Display found files
    console.log('✅ Fichiers présents:');
    found.forEach(r => {
        console.log(`   ${r.file}`);
    });

    // Display missing files
    if (missing.length > 0) {
        console.log('\n❌ FICHIERS MANQUANTS:');
        missing.forEach(r => {
            console.log(`   🔴 ${r.file} (${r.category})`);
        });
        console.log('\n⚠️  ERREUR: Des fichiers critiques sont manquants!');
        console.log('   Vérifiez que ces fichiers existent et n\'ont pas été supprimés.');
        return false;
    }

    console.log(`\n✅ Tous les ${results.length} fichiers critiques sont présents.`);
    return true;
}

// ============================================
// Export for testing
// ============================================

export {
    CRITICAL_ROUTES,
    CRITICAL_ENGINE_FILES,
    CRITICAL_SERVICE_FILES,
    verifyFiles,
    runVerification,
};

// ============================================
// CLI Execution
// ============================================

if (require.main === module) {
    const success = runVerification();
    process.exit(success ? 0 : 1);
}
