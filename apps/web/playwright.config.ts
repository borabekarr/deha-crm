import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  snapshotPathTemplate: '{testDir}/{testFilePath}-snapshots/{arg}-{projectName}{ext}',
  fullyParallel: true,
  workers: 4,
  retries: 0,
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
    },
    {
      name: 'reduced-motion',
      use: {
        ...devices['Desktop Chrome'],
        contextOptions: { reducedMotion: 'reduce' },
      },
    },
  ],
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.2 },
  },
})
