const { defineConfig } = require('@playwright/test');
const fs = require('node:fs');
const edge = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
module.exports = defineConfig({
  testDir: './e2e', timeout: 45000, workers: 1,
  use: { baseURL: 'http://127.0.0.1:4173', viewport: { width: 390, height: 844 },
    launchOptions: fs.existsSync(edge) ? { executablePath: edge } : {},
    trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: { command: 'node scripts/test-web-server.cjs', url: 'http://127.0.0.1:4173', reuseExistingServer: !process.env.CI },
});
