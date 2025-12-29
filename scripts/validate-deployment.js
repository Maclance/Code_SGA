#!/usr/bin/env node

/**
 * Script de validation post-déploiement
 * Vérifie que l'endpoint /api/health retourne un statut healthy
 * Usage: node scripts/validate-deployment.js [URL]
 */

const https = require('https');
const http = require('http');

const TIMEOUT_MS = 10000;

// Couleurs pour la console
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function getJson(url) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;

        const req = protocol.get(url, { timeout: TIMEOUT_MS }, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve({ statusCode: res.statusCode, data: json });
                } catch (err) {
                    reject(new Error(`Invalid JSON response: ${err.message}`));
                }
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
    });
}

async function validateHealthcheck(baseUrl) {
    log('\n🔍 Validation du déploiement AssurManager', 'blue');
    log(`📍 URL: ${baseUrl}\n`, 'blue');

    const healthUrl = `${baseUrl}/api/health`;

    try {
        log('⏳ Requête vers /api/health...', 'yellow');
        const { statusCode, data } = await getJson(healthUrl);

        // Vérifier le status code
        if (statusCode !== 200) {
            log(`❌ ÉCHEC: Status HTTP ${statusCode} (attendu: 200)`, 'red');
            process.exit(1);
        }

        log(`✅ Status HTTP: ${statusCode}`, 'green');

        // Vérifier la structure de la réponse
        if (!data.status || !data.checks) {
            log('❌ ÉCHEC: Réponse malformée (manque status ou checks)', 'red');
            console.log('Réponse reçue:', JSON.stringify(data, null, 2));
            process.exit(1);
        }

        // Vérifier le statut global
        if (data.status !== 'healthy') {
            log(`❌ ÉCHEC: Status = "${data.status}" (attendu: "healthy")`, 'red');
            console.log('Détails:', JSON.stringify(data.checks, null, 2));
            process.exit(1);
        }

        log(`✅ Status: ${data.status}`, 'green');

        // Vérifier la connexion database
        if (data.checks.database?.status !== 'ok') {
            log(`❌ ÉCHEC: Database status = "${data.checks.database?.status}"`, 'red');
            if (data.checks.database?.error) {
                log(`   Erreur: ${data.checks.database.error}`, 'red');
            }
            process.exit(1);
        }

        log(`✅ Database: ${data.checks.database.status}`, 'green');
        if (data.checks.database.latency_ms) {
            log(`   Latence: ${data.checks.database.latency_ms}ms`, 'blue');
        }

        // Vérifier auth
        if (data.checks.auth?.status !== 'ok') {
            log(`⚠️  Auth status: ${data.checks.auth?.status}`, 'yellow');
        } else {
            log(`✅ Auth: ${data.checks.auth.status}`, 'green');
        }

        // Afficher la version
        if (data.version) {
            log(`📦 Version: ${data.version}`, 'blue');
        }

        log('\n🎉 SUCCÈS: Déploiement validé!', 'green');
        log('✅ AC2: Connexion Supabase confirmée (HTTP 200)\n', 'green');

        process.exit(0);

    } catch (error) {
        log(`\n❌ ÉCHEC: ${error.message}`, 'red');

        if (error.code === 'ENOTFOUND') {
            log('💡 Vérifier que l\'URL est correcte et accessible', 'yellow');
        } else if (error.code === 'ECONNREFUSED') {
            log('💡 Le serveur refuse la connexion. Est-il démarré?', 'yellow');
        }

        process.exit(1);
    }
}

// Main
const args = process.argv.slice(2);

if (args.length === 0) {
    log('Usage: node scripts/validate-deployment.js <URL>', 'yellow');
    log('\nExemples:', 'blue');
    log('  node scripts/validate-deployment.js http://localhost:3000');
    log('  node scripts/validate-deployment.js https://code-sga.vercel.app');
    process.exit(1);
}

const url = args[0].replace(/\/$/, ''); // Remove trailing slash
validateHealthcheck(url);
