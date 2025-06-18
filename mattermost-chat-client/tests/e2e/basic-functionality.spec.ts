import { test, expect } from '@playwright/test';

// 基本機能テスト - シンプルで信頼性の高いテスト
test.describe('基本機能テスト', () => {
  
  test('アプリケーションにアクセスできる', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('domcontentloaded');
    
    // タイトル確認
    const title = await page.title();
    expect(title).toBe('Vite + React + TS');
    
    // Reactアプリが読み込まれていることを確認
    const rootElement = page.locator('#root');
    await expect(rootElement).toBeVisible();
    
    console.log('✅ アプリケーションが正常に読み込まれました');
  });

  test('ログインフォームが表示される', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    
    // フォーム要素の確認
    const usernameInput = page.locator('input[autocomplete="username"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"]');
    
    await expect(usernameInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
    
    // 日本語テキストの確認
    await expect(page.locator('text=Mattermost チャット')).toBeVisible();
    
    console.log('✅ ログインフォームが表示されています');
  });

  test('React要素が正常に表示される', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    
    // Material-UI要素の確認
    const muiElements = await page.locator('[class*="Mui"]').count();
    expect(muiElements).toBeGreaterThan(0);
    
    // エラーがないことを確認（React DevToolsの警告は除く）
    const relevantErrors = consoleErrors.filter(error => 
      !error.includes('React DevTools') && 
      !error.includes('Download the React DevTools')
    );
    
    console.log('コンソールエラー:', relevantErrors);
    expect(relevantErrors.length).toBe(0);
    
    console.log('✅ React要素が正常に表示されています');
  });
});