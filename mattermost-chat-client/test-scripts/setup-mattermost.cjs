const { chromium } = require('playwright');

async function setupMattermost() {
  console.log('🚀 Mattermostの初期セットアップを開始');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 1. Mattermostサーバーにアクセス
    console.log('1. Mattermostサーバーにアクセス...');
    await page.goto('http://localhost:8065/');
    await page.waitForTimeout(3000);

    // スクリーンショット
    await page.screenshot({ path: 'setup-1-initial.png', fullPage: true });
    console.log('📸 初期画面: setup-1-initial.png');

    // デスクトップアプリ選択画面が表示される場合
    const browserOption = await page.isVisible('text=View in Browser');
    if (browserOption) {
      console.log('2. ブラウザで表示を選択...');
      await page.click('text=View in Browser');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'setup-2-browser-selected.png', fullPage: true });
    }

    // 初期セットアップ画面の確認
    const currentUrl = page.url();
    console.log('現在のURL:', currentUrl);

    // システム管理者作成画面
    if (currentUrl.includes('/should_verify_email')) {
      console.log('3. メール確認画面をスキップ...');
      await page.goto('http://localhost:8065/');
      await page.waitForTimeout(2000);
    }

    // チーム作成 or ログイン画面
    let adminCreated = false;
    const teamCreationVisible = await page.isVisible('text=チーム作成, text=Create a team, text=システム管理者, text=System Administrator');
    const loginFormVisible = await page.isVisible('input[name="loginId"], input[id="loginId"]');

    if (teamCreationVisible) {
      console.log('3. 新規チーム・管理者作成...');
      
      // システム管理者アカウント作成
      const adminEmailInput = await page.isVisible('input[name="email"], input[type="email"]');
      if (adminEmailInput) {
        await page.fill('input[name="email"], input[type="email"]', 'admin@localhost');
        await page.fill('input[name="username"]', 'admin');
        await page.fill('input[name="password"], input[type="password"]', 'admin123');
        await page.click('button[type="submit"], button:has-text("続行"), button:has-text("Create")');
        await page.waitForTimeout(3000);
        adminCreated = true;
        
        await page.screenshot({ path: 'setup-3-admin-created.png', fullPage: true });
        console.log('✅ 管理者アカウント作成完了: admin/admin123');
      }

      // チーム作成
      const teamNameInput = await page.isVisible('input[name="name"], input[placeholder*="team"], input[placeholder*="チーム"]');
      if (teamNameInput) {
        await page.fill('input[name="name"], input[placeholder*="team"], input[placeholder*="チーム"]', 'default-team');
        await page.click('button[type="submit"], button:has-text("続行"), button:has-text("Create")');
        await page.waitForTimeout(3000);
        
        await page.screenshot({ path: 'setup-4-team-created.png', fullPage: true });
        console.log('✅ チーム作成完了: default-team');
      }

    } else if (loginFormVisible) {
      console.log('3. 既存の管理者でログイン試行...');
      
      // 既存アカウントでログイン
      await page.fill('input[name="loginId"], input[id="loginId"]', 'admin');
      await page.fill('input[name="password"], input[type="password"]', 'admin123');
      await page.click('button[type="submit"], button:has-text("ログイン"), button:has-text("Sign in")');
      
      await page.waitForTimeout(3000);
      
      // ログイン結果確認
      const hasError = await page.isVisible('.error, .alert-danger, [class*="error"]');
      if (hasError) {
        console.log('❌ ログイン失敗 - パスワードリセットが必要かもしれません');
        await page.screenshot({ path: 'setup-3-login-failed.png', fullPage: true });
      } else {
        console.log('✅ ログイン成功');
        await page.screenshot({ path: 'setup-3-login-success.png', fullPage: true });
        adminCreated = true;
      }
    }

    if (adminCreated) {
      // 4. テスト用チャンネル作成
      console.log('4. テスト用チャンネル作成...');
      
      // メインページに移動
      await page.goto('http://localhost:8065/');
      await page.waitForTimeout(3000);
      
      await page.screenshot({ path: 'setup-5-main-page.png', fullPage: true });
      
      // チャンネル作成（＋ボタンを探す）
      const addChannelButton = await page.isVisible('[data-testid="channelHeaderDropdownButton"], button:has-text("+"), .sidebar-item__add');
      if (addChannelButton) {
        await page.click('[data-testid="channelHeaderDropdownButton"], button:has-text("+"), .sidebar-item__add');
        await page.waitForTimeout(1000);
        
        // 「チャンネル作成」オプション
        const createChannelOption = await page.isVisible('text=チャンネル作成, text=Create Channel');
        if (createChannelOption) {
          await page.click('text=チャンネル作成, text=Create Channel');
          await page.waitForTimeout(1000);
          
          // チャンネル名入力
          await page.fill('input[name="name"], input[placeholder*="チャンネル"], input[placeholder*="channel"]', '佐藤チーム');
          await page.fill('input[name="displayName"], textarea[name="purpose"]', '佐藤さんのテストチャンネル');
          
          await page.click('button[type="submit"], button:has-text("作成"), button:has-text("Create")');
          await page.waitForTimeout(2000);
          
          console.log('✅ テストチャンネル「佐藤チーム」作成完了');
        }
      }
      
      await page.screenshot({ path: 'setup-6-channel-created.png', fullPage: true });
      
      // 5. APIトークン確認
      console.log('5. APIアクセス確認...');
      
      // システムコンソールアクセス
      await page.goto('http://localhost:8065/admin_console');
      await page.waitForTimeout(2000);
      
      await page.screenshot({ path: 'setup-7-admin-console.png', fullPage: true });
      
      console.log('✅ セットアップ完了！');
      console.log('');
      console.log('=== 認証情報 ===');
      console.log('ユーザー名: admin');
      console.log('パスワード: admin123');
      console.log('サーバー: http://localhost:8065');
      console.log('');
    }

  } catch (error) {
    console.error('❌ セットアップエラー:', error);
    await page.screenshot({ path: 'setup-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

setupMattermost().catch(console.error);