import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e', testMatch: 'inquiries.spec.ts', workers: 1,
  outputDir: './test-results/inquiries',
  use: { baseURL: 'http://127.0.0.1:5182', viewport: { width: 375, height: 812 }, screenshot: 'only-on-failure' },
  webServer: {
    command: `"${process.execPath}" node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5182 --strictPort`,
    url: 'http://127.0.0.1:5182', reuseExistingServer: false,
    env: { VITE_SUPABASE_URL: 'http://127.0.0.1:54329', VITE_SUPABASE_ANON_KEY: 'local-inquiry-test-key', VITE_CUSTOMER_ACCOUNT_SYNC_URL: '' },
  },
})
