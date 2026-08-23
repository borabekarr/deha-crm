import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  snapshotPathTemplate: '{testDir}/{testFilePath}-snapshots/{arg}-{projectName}{ext}',
  fullyParallel: true,
  workers: 4,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'pnpm dev',
    port: 5173,
    reuseExistingServer: true,
    timeout: 60000,
  },
  projects: [
    {
      name: 'default',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: /library-mobile\.spec\.ts/,
    },
    {
      name: 'reduced-motion',
      use: {
        ...devices['Desktop Chrome'],
        contextOptions: { reducedMotion: 'reduce' },
      },
      testIgnore: /library-mobile\.spec\.ts/,
    },
    {
      name: 'mobile',
      // WebKit cannot launch in this environment; Chromium mobile emulation keeps the iPhone 14 viewport/DPR/touch/UA (orchestrator-authorized deviation).
      use: { ...devices['iPhone 14'], browserName: 'chromium' },
      testMatch: /library-mobile\.spec\.ts/,
    },
  ],
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.2 },
  },
})
