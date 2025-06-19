const { chromium } = require('playwright');

async function simpleSetup() {
  console.log('🛠️ 簡易Mattermostセットアップ');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 2000 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 1. Mattermostにアクセスして現在の状態確認
    console.log('1. 現在の状態確認...');
    await page.goto('http://localhost:8065/');
    await page.waitForTimeout(3000);

    // View in Browserをクリック
    const browserOption = await page.isVisible('text=View in Browser');
    if (browserOption) {
      await page.click('text=View in Browser');
      await page.waitForTimeout(2000);
    }

    await page.screenshot({ path: 'simple-1-current-state.png', fullPage: true });
    
    const currentUrl = page.url();
    console.log('現在のURL:', currentUrl);

    // ログイン画面の場合
    if (currentUrl.includes('/login')) {
      console.log('2. ログイン画面 - 既存アカウントでテスト...');
      
      // 既知の認証情報でテスト
      const credentials = [
        { user: 'admin', pass: 'admin123456' },
        { user: 'admin', pass: 'admin123' }, 
        { user: 'admin', pass: 'password' },
        { user: 'sysadmin', pass: 'sysadmin' }
      ];

      for (const cred of credentials) {
        console.log(`試行: ${cred.user}/${cred.pass}`);
        
        await page.fill('input[name="loginId"]', cred.user);
        await page.fill('input[name="password"]', cred.pass);
        await page.click('button:has-text("Log in")');
        await page.waitForTimeout(3000);
        
        const hasError = await page.isVisible('.error, .alert-danger, [class*="error"]');
        const newUrl = page.url();
        
        if (!hasError && !newUrl.includes('/login')) {
          console.log(`✅ ログイン成功: ${cred.user}/${cred.pass}`);
          await page.screenshot({ path: 'simple-2-login-success.png', fullPage: true });
          
          // 成功した認証情報を記録
          console.log('');
          console.log('🎉 ログイン成功！');
          console.log('=== 使用可能な認証情報 ===');
          console.log(`ユーザー名: ${cred.user}`);
          console.log(`パスワード: ${cred.pass}`);
          console.log('サーバー: http://localhost:8065');
          console.log('');
          
          // メイン画面確認
          await page.goto('http://localhost:8065/');
          await page.waitForTimeout(3000);
          await page.screenshot({ path: 'simple-3-main-page.png', fullPage: true });
          
          return; // 成功で終了
        }
        
        await page.waitForTimeout(1000);
      }
      
      console.log('❌ 既存認証情報では全てログイン失敗');
    }

    // 新規アカウント作成の場合
    console.log('3. 新規アカウント作成を試行...');
    await page.goto('http://localhost:8065/signup_user_complete');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'simple-4-signup-form.png', fullPage: true });

    // フォーム要素を具体的に探す
    const emailField = await page.locator('input').nth(0);
    const usernameField = await page.locator('input').nth(1);  
    const passwordField = await page.locator('input').nth(2);
    
    if (await emailField.isVisible()) {
      console.log('4. フィールド入力...');
      await emailField.fill('admin@test.com');
      await page.waitForTimeout(500);
      
      await usernameField.fill('admin');
      await page.waitForTimeout(500);
      
      await passwordField.fill('admin123456');
      await page.waitForTimeout(500);
      
      await page.screenshot({ path: 'simple-5-filled.png', fullPage: true });
      
      // ボタンクリック
      const createButton = await page.locator('button:has-text("Create Account")');
      if (await createButton.isEnabled()) {
        await createButton.click();
        await page.waitForTimeout(5000);
        
        await page.screenshot({ path: 'simple-6-created.png', fullPage: true });
        
        console.log('✅ アカウント作成完了');
        console.log('=== 新規作成認証情報 ===');
        console.log('ユーザー名: admin');
        console.log('パスワード: admin123456');
        console.log('メール: admin@test.com');
        console.log('');
      } else {
        console.log('❌ Create Accountボタンが無効');
      }
    }

  } catch (error) {
    console.error('❌ エラー:', error);
    await page.screenshot({ path: 'simple-error.png', fullPage: true });
  } finally {
    console.log('');
    console.log('📸 スクリーンショットを確認してください：');
    console.log('- simple-1-current-state.png');
    console.log('- simple-2-login-success.png (成功時)');
    console.log('- simple-3-main-page.png (成功時)');
    console.log('- simple-4-signup-form.png');
    console.log('- simple-5-filled.png');
    console.log('- simple-6-created.png');
    
    await browser.close();
  }
}

simpleSetup().catch(console.error);