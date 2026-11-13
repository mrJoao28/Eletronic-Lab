import { defineConfig } from '@playwright/test';
const hosted = process.env.LAB_BASE_URL;
export default defineConfig({
  workers: 1,
  timeout: 90000,
  expect: { timeout: 15000 },
  testDir: './tests',
  use: {
    baseURL: hosted || 'http://127.0.0.1:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    headless: true,
    viewport: { width: 1440, height: 1000 },
    launchOptions: { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl'] },
  },
  webServer: hosted
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://127.0.0.1:5173',
        reuseExistingServer: !process.env.CI,
      },
  reporter: [['list'], ['html', { open: 'never' }]],
});
