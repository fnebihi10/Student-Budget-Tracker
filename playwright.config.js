const { defineConfig } = require('@playwright/test');
const fs = require('node:fs');
const edge = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const authenticated = process.env.E2E_AUTHENTICATED === '1';
// Fail before starting a server/browser or accepting a stale server as evidence.
if (authenticated) {
  require('./scripts/isolated-project.cjs').isolatedProject();
  if (!fs.existsSync('dist-test/index.html')) {
    throw new Error('UNVERIFIED: export the isolated test build with node scripts/export.cjs --test-project before authenticated browser verification.');
  }
}
module.exports = defineConfig({
  testDir: './e2e', timeout: 90000, workers: 1,
  testMatch: authenticated ? 'authenticated.spec.js' : ['core.spec.js', 'screens.spec.js', 'workflows.spec.js', 'dense.spec.js'],
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:4173', viewport: { width: 390, height: 844 },
    launchOptions: fs.existsSync(edge) ? { executablePath: edge } : {},
    trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: { command: 'node scripts/test-web-server.cjs', url: 'http://127.0.0.1:4173', reuseExistingServer: !authenticated && !process.env.CI },
});
