#!/usr/bin/env node
/**
 * Run Postman collection via Newman with sane defaults.
 *
 * Env vars:
 *   BASE_URL     - override baseUrl variable (default http://localhost:5000)
 *   NEWMAN_ENV   - path to environment file (default doc/Junkio.postman_environment.json)
 *   REPORT_JUNIT - "true" to emit JUnit report newman-results.xml
 */
const { spawnSync } = require('child_process');
const path = require('path');

const collection = path.join(__dirname, '..', '..', 'doc', 'Junkio.postman_collection.json');
const envPath = process.env.NEWMAN_ENV || path.join(__dirname, '..', '..', 'doc', 'Junkio.postman_environment.json');
const rawBaseUrl = process.env.BASE_URL || 'http://localhost:5000';
const baseUrl = rawBaseUrl.endsWith('/api') ? rawBaseUrl.slice(0, -4) : rawBaseUrl;

const args = ['newman', 'run', collection, '-e', envPath, '--delay-request', '50'];
if (baseUrl) {
    args.push('--env-var', `baseUrl=${baseUrl}`);
}
if (process.env.REPORT_JUNIT === 'true') {
    args.push('--reporters', 'cli,junit', '--reporter-junit-export', 'newman-results.xml');
} else {
    args.push('--reporters', 'cli');
}

const result = spawnSync('npx', args, { stdio: 'inherit', shell: true });
if (result.error) {
    console.error('[run-newman] failed to execute newman:', result.error.message);
}
process.exit(result.status ?? 1);
