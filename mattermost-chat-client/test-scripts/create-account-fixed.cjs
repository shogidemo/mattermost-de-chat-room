const { chromium } = require('playwright');

async function createAccountFixed() {
  console.log('👤 新しいMattermostアカウントを作成（修正版）');
  
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

    // 2. 直接signup URLに移動
    console.log('2. サインアップ画面に直接移動...');
    await page.goto('http://localhost:8065/signup_user_complete');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'fixed-signup-1-form.png', fullPage: true });

    // 3. アカウント情報を順番に入力
    console.log('3. メールアドレス入力...');
    await page.fill('input[name="email"]', 'admin@localhost.com');
    await page.waitForTimeout(500);

    console.log('4. ユーザー名入力...');
    // ユーザー名フィールドを特定
    const usernameField = 'input[placeholder="Choose a Username"]';
    await page.waitForSelector(usernameField);
    await page.fill(usernameField, 'admin');
    await page.waitForTimeout(500);

    console.log('5. パスワード入力...');
    await page.fill('input[name="password"]', 'admin123456'); // 8文字以上に
    await page.waitForTimeout(500);

    await page.screenshot({ path: 'fixed-signup-2-filled.png', fullPage: true });

    // 6. ボタンが有効になるまで待機
    console.log('6. ボタンの有効化を待機...');
    await page.waitForSelector('button[data-testid="saveSetting"]:not([disabled])', { timeout: 10000 });
    
    console.log('7. アカウント作成実行...');
    await page.click('button[data-testid="saveSetting"]');
    await page.waitForTimeout(5000);

    await page.screenshot({ path: 'fixed-signup-3-after-create.png', fullPage: true });

    // 8. 結果確認
    const currentUrl = page.url();
    console.log('作成後のURL:', currentUrl);

    if (currentUrl.includes('/should_verify_email')) {
      console.log('✅ アカウント作成成功 - メール確認画面');
      
      // メール確認をスキップしてログイン画面に移動
      await page.goto('http://localhost:8065/login');
      await page.waitForTimeout(2000);
      
      console.log('9. 作成したアカウントでログイン...');
      await page.fill('input[name="loginId"]', 'admin');
      await page.fill('input[name="password"]', 'admin123456');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
      
      await page.screenshot({ path: 'fixed-signup-4-logged-in.png', fullPage: true });
    }

    // 9. チーム作成確認
    if (currentUrl.includes('/select_team') || await page.isVisible('text=Create a team')) {
      console.log('10. チーム作成...');
      
      await page.click('text=Create a team, a:has-text("Create a team")');
      await page.waitForTimeout(2000);
      
      // チーム名入力
      await page.fill('input[name="name"]', 'testteam');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
    }

    // 10. メイン画面確認
    await page.goto('http://localhost:8065/testteam');
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: 'fixed-signup-5-main.png', fullPage: true });

    // 11. 佐藤チャンネル作成
    console.log('11. 佐藤チャンネル作成...');
    
    // + ボタンクリック
    const plusButton = await page.locator('.AddChannelDropdown_button, [aria-label*="Create"], button[aria-label*="add"]').first();
    if (await plusButton.isVisible()) {
      await plusButton.click();
      await page.waitForTimeout(1000);
      
      // チャンネル作成メニュー
      const createPublicChannel = page.locator('text=Create New Channel, text=パブリックチャンネル作成');
      if (await createPublicChannel.first().isVisible()) {
        await createPublicChannel.first().click();
        await page.waitForTimeout(1000);
        
        // チャンネル名入力
        await page.fill('input[data-testid="newChannelModal.name"]', '佐藤チーム');
        await page.fill('textarea[data-testid="newChannelModal.purpose"]', '佐藤さん専用テストチャンネル');
        
        await page.click('button[data-testid="newChannelModal.createButton"]');
        await page.waitForTimeout(2000);
        
        console.log('✅ 佐藤チャンネル作成完了');
      }
    }

    await page.screenshot({ path: 'fixed-signup-6-final.png', fullPage: true });
    
    console.log('✅ 完全セットアップ完了！');
    console.log('');
    console.log('=== 認証情報 ===');
    console.log('ユーザー名: admin');
    console.log('メール: admin@localhost.com'); 
    console.log('パスワード: admin123456');
    console.log('サーバー: http://localhost:8065');
    console.log('チーム: testteam');
    console.log('');

  } catch (error) {
    console.error('❌ エラー:', error);
    await page.screenshot({ path: 'fixed-signup-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

createAccountFixed().catch(console.error);