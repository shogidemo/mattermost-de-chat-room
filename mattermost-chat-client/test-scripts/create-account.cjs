const { chromium } = require('playwright');

async function createAccount() {
  console.log('👤 新しいMattermostアカウントを作成');
  
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

    // デスクトップアプリ選択画面
    const browserOption = await page.isVisible('text=View in Browser');
    if (browserOption) {
      await page.click('text=View in Browser');
      await page.waitForTimeout(2000);
    }

    // 2. アカウント作成リンクをクリック
    console.log('2. アカウント作成画面に移動...');
    const signupLink = await page.isVisible('text=Don\'t have an account?, a:has-text("アカウント作成"), a:has-text("Sign up")');
    if (signupLink) {
      await page.click('text=Don\'t have an account?');
      await page.waitForTimeout(2000);
    } else {
      // 直接signup URLに移動
      await page.goto('http://localhost:8065/signup_user_complete');
      await page.waitForTimeout(2000);
    }

    await page.screenshot({ path: 'signup-1-form.png', fullPage: true });
    console.log('📸 サインアップ画面: signup-1-form.png');

    // 3. アカウント情報入力
    console.log('3. アカウント情報を入力...');
    
    // メールアドレス
    const emailInput = await page.isVisible('input[name="email"], input[type="email"]');
    if (emailInput) {
      await page.fill('input[name="email"], input[type="email"]', 'admin@localhost.com');
    }
    
    // ユーザー名
    const usernameInput = await page.isVisible('input[name="username"]');
    if (usernameInput) {
      await page.fill('input[name="username"]', 'admin');
    }
    
    // パスワード
    const passwordInput = await page.isVisible('input[name="password"], input[type="password"]');
    if (passwordInput) {
      await page.fill('input[name="password"], input[type="password"]', 'admin123');
    }

    // 名前フィールドがある場合
    const firstNameInput = await page.isVisible('input[name="firstName"], input[name="first_name"]');
    if (firstNameInput) {
      await page.fill('input[name="firstName"], input[name="first_name"]', 'System');
    }

    const lastNameInput = await page.isVisible('input[name="lastName"], input[name="last_name"]');
    if (lastNameInput) {
      await page.fill('input[name="lastName"], input[name="last_name"]', 'Admin');
    }

    await page.screenshot({ path: 'signup-2-filled.png', fullPage: true });
    
    // 4. アカウント作成実行
    console.log('4. アカウント作成実行...');
    const createButton = await page.isVisible('button[type="submit"], button:has-text("作成"), button:has-text("Create Account")');
    if (createButton) {
      await page.click('button[type="submit"], button:has-text("作成"), button:has-text("Create Account")');
      await page.waitForTimeout(5000);
    }

    await page.screenshot({ path: 'signup-3-created.png', fullPage: true });

    // 5. チーム作成またはメイン画面への遷移
    console.log('5. 初期設定完了確認...');
    
    const currentUrl = page.url();
    console.log('現在のURL:', currentUrl);

    if (currentUrl.includes('/select_team') || currentUrl.includes('/create_team')) {
      console.log('6. チーム作成...');
      
      // チーム作成画面
      await page.screenshot({ path: 'signup-4-team-creation.png', fullPage: true });
      
      const createTeamButton = await page.isVisible('button:has-text("チーム作成"), button:has-text("Create a team"), a:has-text("Create a team")');
      if (createTeamButton) {
        await page.click('button:has-text("チーム作成"), button:has-text("Create a team"), a:has-text("Create a team")');
        await page.waitForTimeout(2000);
        
        // チーム名入力
        const teamNameInput = await page.isVisible('input[name="name"], input[placeholder*="team"], input[placeholder*="チーム"]');
        if (teamNameInput) {
          await page.fill('input[name="name"], input[placeholder*="team"], input[placeholder*="チーム"]', 'TestTeam');
          await page.click('button[type="submit"], button:has-text("作成"), button:has-text("Create")');
          await page.waitForTimeout(3000);
        }
      }
    }

    // 7. メイン画面に移動
    await page.goto('http://localhost:8065/');
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: 'signup-5-main-dashboard.png', fullPage: true });
    console.log('📸 メインダッシュボード: signup-5-main-dashboard.png');

    // 8. 佐藤チャンネル作成
    console.log('8. 佐藤チャンネル作成...');
    
    // サイドバーの + ボタンを探す
    const addButton = await page.isVisible('.AddChannelDropdown, [aria-label*="add"], [title*="add"], button:has-text("+")');
    if (addButton) {
      await page.click('.AddChannelDropdown, [aria-label*="add"], [title*="add"], button:has-text("+")');
      await page.waitForTimeout(1000);
      
      // チャンネル作成オプション
      const createChannelOption = await page.isVisible('text=チャンネル作成, text=Create Channel');
      if (createChannelOption) {
        await page.click('text=チャンネル作成, text=Create Channel');
        await page.waitForTimeout(1000);
        
        // チャンネル名入力
        const channelNameInput = await page.isVisible('input[name="displayName"], input[placeholder*="チャンネル名"], input[placeholder*="channel name"]');
        if (channelNameInput) {
          await page.fill('input[name="displayName"], input[placeholder*="チャンネル名"], input[placeholder*="channel name"]', '佐藤チーム');
          
          // 説明も入力
          const purposeInput = await page.isVisible('textarea[name="purpose"], input[name="purpose"]');
          if (purposeInput) {
            await page.fill('textarea[name="purpose"], input[name="purpose"]', '佐藤さん専用のテストチャンネルです');
          }
          
          await page.click('button[type="submit"], button:has-text("作成"), button:has-text("Create Channel")');
          await page.waitForTimeout(2000);
        }
      }
    }

    await page.screenshot({ path: 'signup-6-channel-created.png', fullPage: true });
    
    console.log('✅ セットアップ完了！');
    console.log('');
    console.log('=== 認証情報 ===');
    console.log('ユーザー名: admin');
    console.log('メール: admin@localhost.com'); 
    console.log('パスワード: admin123');
    console.log('サーバー: http://localhost:8065');
    console.log('');

  } catch (error) {
    console.error('❌ アカウント作成エラー:', error);
    await page.screenshot({ path: 'signup-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

createAccount().catch(console.error);