import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright設定ファイル
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  
  /* 並列でテストを実行 */
  fullyParallel: true,
  
  /* CI環境でのみテスト失敗時に諦めない */
  forbidOnly: !!process.env.CI,
  
  /* CI環境での再試行回数 */
  retries: process.env.CI ? 2 : 0,
  
  /* 並列ワーカー数 */
  workers: process.env.CI ? 1 : undefined,
  
  /* レポート設定 */
  reporter: 'html',
  
  /* すべてのテストで共有される設定 */
  use: {
    /* テスト失敗時にスクリーンショットを撮影 */
    screenshot: 'only-on-failure',
    
    /* ベースURL */
    baseURL: 'http://localhost:5173',
    
    /* テスト失敗時にトレースを記録 */
    trace: 'on-first-retry',
  },

  /* プロジェクト設定 */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* モバイルビューポートでのテスト */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  /* ローカル開発サーバーの起動 */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});