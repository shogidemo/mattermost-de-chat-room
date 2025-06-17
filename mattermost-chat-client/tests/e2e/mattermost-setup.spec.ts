import { test, expect } from '@playwright/test';

test.describe('Mattermost サーバー初期設定', () => {
  test('管理者アカウントを作成してチームを設定', async ({ page }) => {
    console.log('=== Mattermostサーバー初期設定開始 ===');
    
    // Mattermostサーバーにアクセス
    await page.goto('http://localhost:8065');
    await page.waitForLoadState('networkidle');
    
    // 初期設定画面か確認
    const pageContent = await page.content();
    console.log('ページタイトル:', await page.title());
    
    // アカウント作成が必要かチェック
    const hasSignUp = await page.locator('text=アカウント作成').count() > 0 ||
                      await page.locator('text=Create Account').count() > 0 ||
                      await page.locator('text=Sign Up').count() > 0;
    
    if (hasSignUp) {
      console.log('🔧 新規アカウント作成が必要です');
      
      // アカウント作成ページに移動
      await page.click('text=アカウント作成').catch(() => 
        page.click('text=Create Account').catch(() => 
          page.click('text=Sign Up')));
      
      await page.waitForTimeout(1000);
      
      // 管理者アカウント情報を入力
      await page.fill('input[name="email"]', 'admin@test.com');
      await page.fill('input[name="username"]', 'admin');
      await page.fill('input[name="password"]', 'Admin123!');
      await page.fill('input[name="firstName"]', 'Admin');
      await page.fill('input[name="lastName"]', 'User');
      
      // アカウント作成を実行
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
      
      console.log('✅ 管理者アカウントを作成しました');
    } else {
      console.log('⚠️ 既にアカウントが存在するか、ログインが必要です');
      
      // ログインを試行
      const hasLoginForm = await page.locator('input[type="email"], input[type="text"]').count() > 0;
      if (hasLoginForm) {
        await page.fill('input[type="email"], input[type="text"]', 'admin@test.com');
        await page.fill('input[type="password"]', 'Admin123!');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(2000);
      }
    }
    
    // チーム作成が必要かチェック
    const needsTeam = await page.locator('text=チーム作成').count() > 0 ||
                      await page.locator('text=Create Team').count() > 0;
    
    if (needsTeam) {
      console.log('🔧 チーム作成が必要です');
      
      await page.click('text=チーム作成').catch(() => 
        page.click('text=Create Team'));
      
      await page.waitForTimeout(1000);
      
      // チーム情報を入力
      await page.fill('input[name="teamName"]', 'テスト開発チーム');
      await page.fill('input[name="teamDisplayName"]', 'Test Development Team');
      
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
      
      console.log('✅ チームを作成しました');
    }
    
    // 設定完了の確認
    const currentUrl = page.url();
    console.log('現在のURL:', currentUrl);
    
    // スクリーンショットを保存
    await page.screenshot({ 
      path: 'test-results/mattermost-setup-complete.png',
      fullPage: true 
    });
    
    console.log('=== Mattermostサーバー初期設定完了 ===');
  });
  
  test('設定したアカウントでログインテスト', async ({ page }) => {
    console.log('=== ログイン機能テスト開始 ===');
    
    // Mattermostにアクセス
    await page.goto('http://localhost:8065');
    await page.waitForLoadState('networkidle');
    
    // ログイン情報を入力
    await page.fill('input[type="email"], input[type="text"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'Admin123!');
    
    // ログインボタンをクリック
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // ログイン成功の確認
    const isLoggedIn = await page.locator('text=Town Square').count() > 0 ||
                      await page.locator('.app__content').count() > 0;
    
    if (isLoggedIn) {
      console.log('✅ ログイン成功！');
    } else {
      console.log('❌ ログインに失敗しました');
      console.log('現在のURL:', page.url());
      
      // デバッグ用スクリーンショット
      await page.screenshot({ 
        path: 'test-results/login-debug.png',
        fullPage: true 
      });
    }
    
    // 最終スクリーンショット
    await page.screenshot({ 
      path: 'test-results/mattermost-login-test.png',
      fullPage: true 
    });
    
    console.log('=== ログイン機能テスト完了 ===');
  });
});