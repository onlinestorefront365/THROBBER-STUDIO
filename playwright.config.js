const { defineConfig } = require('@playwright/test');

const PORT = 8765;

module.exports = defineConfig({
  testDir: 'tests',
  timeout: 30000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    viewport: { width: 1400, height: 850 },
    screenshot: 'only-on-failure',
    launchOptions: {
      // Headless machines have no GPU; these make WebGL render in software
      args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
    }
  },
  webServer: {
    command: `python3 -m http.server ${PORT}`,
    url: `http://localhost:${PORT}/index.html`,
    reuseExistingServer: !process.env.CI,
    // python's server logs every request to stderr
    stderr: 'ignore'
  }
});
