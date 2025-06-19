const { chromium } = require('playwright');

async function createAccountFinal() {
  console.log('👤 Mattermostアカウント作成（最終版）');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1500 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 1. Mattermostサーバーにアクセス
    console.log('1. Mattermostサーバーにアクセス...');
    await page.goto('http://localhost:8065/');
    await page.waitForTimeout(3000);

    // デスクトップアプリ選択画面
    const browserOption = await page.isVisible('text=View in Browser');
    if (browserOption) {
      await page.click('text=View in Browser');
      await page.waitForTimeout(2000);
    }

    // 2. サインアップ画面に移動
    console.log('2. サインアップ画面に移動...');
    await page.goto('http://localhost:8065/signup_user_complete');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'final-signup-1-initial.png', fullPage: true });

    // 3. フィールドをプレースホルダーで特定して入力
    console.log('3. Email address入力...');
    await page.fill('input[placeholder="Email address"]', 'admin@localhost.com');
    await page.waitForTimeout(1000);

    console.log('4. Username入力...');
    await page.fill('input[placeholder="Choose a Username"]', 'admin');
    await page.waitForTimeout(1000);

    console.log('5. Password入力...');
    await page.fill('input[placeholder="Choose a Password"]', 'admin123456');
    await page.waitForTimeout(1000);

    await page.screenshot({ path: 'final-signup-2-filled.png', fullPage: true });

    // 6. Create Accountボタンが有効になるまで待機
    console.log('6. Create Accountボタンの有効化を待機...');
    await page.waitForSelector('button:has-text("Create Account"):not([disabled])', { timeout: 15000 });
    
    console.log('7. アカウント作成実行...');
    await page.click('button:has-text("Create Account")');
    await page.waitForTimeout(5000);

    await page.screenshot({ path: 'final-signup-3-created.png', fullPage: true });

    // 8. メール確認スキップしてログイン
    console.log('8. ログイン画面に移動...');
    await page.goto('http://localhost:8065/login');
    await page.waitForTimeout(3000);

    console.log('9. 作成アカウントでログイン...');
    await page.fill('input[name="loginId"]', 'admin');
    await page.fill('input[name="password"]', 'admin123456');
    await page.click('button:has-text("Log in")');
    await page.waitForTimeout(5000);

    await page.screenshot({ path: 'final-signup-4-login-attempt.png', fullPage: true });

    // 9. チーム作成または選択
    const currentUrl = page.url();
    console.log('ログイン後URL:', currentUrl);

    if (currentUrl.includes('/select_team') || await page.isVisible('text=Create a team')) {
      console.log('10. チーム作成...');
      
      // "Create a team"をクリック
      const createTeamVisible = await page.isVisible('text=Create a team');
      if (createTeamVisible) {
        await page.click('text=Create a team');
        await page.waitForTimeout(2000);
        
        // チーム名入力画面
        const teamNameInput = await page.isVisible('input[name="name"]');
        if (teamNameInput) {
          await page.fill('input[name="name"]', 'testteam');
          await page.click('button[type="submit"]');
          await page.waitForTimeout(3000);
        }
      }
    }

    // 10. メイン画面に移動
    console.log('11. メイン画面確認...');
    await page.goto('http://localhost:8065/');
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: 'final-signup-5-dashboard.png', fullPage: true });

    // 11. 佐藤チャンネル作成のため、既存チャンネルをチェック
    console.log('12. チャンネル一覧確認...');
    
    // サイドバーのチャンネルセクション確認
    const channelSidebar = await page.isVisible('.sidebar-section');
    if (channelSidebar) {
      console.log('✅ チャンネルサイドバー発見');
      
      // 新しいチャンネル作成のためのボタンを探す
      const addChannelButton = await page.isVisible('[data-testid="addChannelDropdown"]');
      if (addChannelButton) {
        await page.click('[data-testid="addChannelDropdown"]');
        await page.waitForTimeout(1000);
        
        // "Create New Channel"オプション
        const createChannelOption = await page.isVisible('text=Create New Channel');
        if (createChannelOption) {
          await page.click('text=Create New Channel');
          await page.waitForTimeout(1000);
          
          // チャンネル名入力
          await page.fill('input[data-testid="newChannelModal.name"]', '佐藤チーム');
          await page.fill('textarea[data-testid="newChannelModal.purpose"]', '佐藤さん専用のテストチャンネルです');
          
          await page.click('button[data-testid="newChannelModal.createButton"]');
          await page.waitForTimeout(2000);
          
          console.log('✅ 佐藤チャンネル作成完了');
        }
      }
    }

    await page.screenshot({ path: 'final-signup-6-complete.png', fullPage: true });
    
    console.log('');
    console.log('🎉 Mattermostセットアップ完全完了！');
    console.log('');
    console.log('=== 認証情報 ===');
    console.log('ユーザー名: admin');
    console.log('メール: admin@localhost.com'); 
    console.log('パスワード: admin123456');
    console.log('サーバー: http://localhost:8065');
    console.log('');
    console.log('これで正常にテストが実行できるはずです！');

  } catch (error) {
    console.error('❌ エラー:', error);
    await page.screenshot({ path: 'final-signup-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

createAccountFinal().catch(console.error);