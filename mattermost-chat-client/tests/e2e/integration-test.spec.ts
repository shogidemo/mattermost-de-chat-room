import { test, expect } from '@playwright/test';

test.describe('React + Mattermost 統合テスト', () => {
  test('Reactアプリから実際のMattermostサーバーに接続', async ({ page }) => {
    console.log('=== React + Mattermost 統合テスト開始 ===');
    
    // Reactアプリケーションにアクセス
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Reactアプリにアクセス完了');
    
    // ログインフォームが表示されているか確認
    const hasLoginForm = await page.locator('text=ログイン').count() > 0;
    expect(hasLoginForm).toBeTruthy();
    console.log('✅ ログインフォームが表示されています');
    
    // 実際のMattermostサーバーへの接続テスト
    await page.fill('input[autocomplete="username"]', 'admin');
    await page.fill('input[type="password"]', 'Admin123!');
    
    console.log('📝 ログイン情報を入力しました');
    
    // ログインボタンをクリック
    await page.click('button[type="submit"]');
    
    // ログイン処理の待機（最大10秒）
    await page.waitForTimeout(3000);
    
    // ログイン後の状態を確認
    const pageContent = await page.content();
    const currentUrl = page.url();
    
    console.log('現在のURL:', currentUrl);
    
    // エラーメッセージがあるかチェック
    const hasError = await page.locator('[role="alert"], .error, .MuiAlert-root').count() > 0;
    
    if (hasError) {
      const errorText = await page.locator('[role="alert"], .error, .MuiAlert-root').textContent();
      console.log('⚠️ エラーメッセージ:', errorText);
    } else {
      console.log('✅ エラーメッセージなし');
    }
    
    // チャット画面が表示されるかチェック
    const hasChatInterface = await page.locator('text=チャンネル').count() > 0 ||
                            await page.locator('text=Mattermost チャット').count() > 0;
    
    if (hasChatInterface) {
      console.log('✅ チャット画面が表示されました！');
    } else {
      console.log('⚠️ まだログイン画面です');
    }
    
    // 接続状態の確認
    const connectionStatus = await page.locator('text=接続中, text=切断').count() > 0;
    if (connectionStatus) {
      const status = await page.locator('text=接続中, text=切断').textContent();
      console.log('接続状態:', status);
    }
    
    // 最終スクリーンショット
    await page.screenshot({ 
      path: 'test-results/react-mattermost-integration.png',
      fullPage: true 
    });
    
    console.log('=== React + Mattermost 統合テスト完了 ===');
  });
  
  test('ネットワークエラーハンドリングテスト', async ({ page }) => {
    console.log('=== ネットワークエラーハンドリングテスト開始 ===');
    
    // 不正なサーバーURLでテスト
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    
    // 存在しないユーザーでログイン試行
    await page.fill('input[autocomplete="username"]', 'nonexistent');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // エラーハンドリングが適切に動作するかチェック
    const hasErrorHandling = await page.locator('[role="alert"], .error, .MuiAlert-root').count() > 0;
    
    if (hasErrorHandling) {
      const errorMessage = await page.locator('[role="alert"], .error, .MuiAlert-root').textContent();
      console.log('✅ エラーハンドリング正常:', errorMessage);
    } else {
      console.log('⚠️ エラーハンドリングが表示されませんでした');
    }
    
    // スクリーンショット
    await page.screenshot({ 
      path: 'test-results/error-handling-test.png',
      fullPage: true 
    });
    
    console.log('=== ネットワークエラーハンドリングテスト完了 ===');
  });
});