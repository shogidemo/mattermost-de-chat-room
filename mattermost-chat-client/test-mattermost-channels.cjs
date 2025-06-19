const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Mattermostチャンネル確認テストを開始します...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();
  
  try {
    // 1. Reactアプリにアクセスしてログイン
    console.log('1. Reactアプリにアクセス');
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(2000);
    
    // ログインフォームに入力
    console.log('2. admin/Admin123456!でログイン');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'Admin123456!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // チャットボタンをクリック
    console.log('3. チャットボタンをクリック');
    await page.click('[data-testid="chat-bubble"]');
    await page.waitForTimeout(2000);
    
    // チャンネルリストの状態を確認
    console.log('4. チャンネルリストを確認');
    await page.screenshot({ path: 'test-channel-list-current.png', fullPage: true });
    
    // 佐藤チャンネル1をクリックしてテスト
    console.log('5. 佐藤チャンネル1をクリック');
    try {
      await page.click('text=佐藤チャンネル1');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-sato-channel-opened.png', fullPage: true });
      
      // メッセージ送信テスト
      console.log('6. メッセージ送信テスト');
      const messageInput = await page.locator('input[placeholder*="メッセージ"]').first();
      await messageInput.fill('テストメッセージ from Playwright');
      await messageInput.press('Enter');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-message-sent.png', fullPage: true });
      
    } catch (error) {
      console.log('佐藤チャンネル1が見つかりませんでした');
    }
    
    // Mattermostで実際のチャンネルを確認
    console.log('7. Mattermostで実際のチャンネルを確認');
    const mattermostPage = await context.newPage();
    await mattermostPage.goto('http://localhost:8065');
    await mattermostPage.waitForTimeout(2000);
    
    // ログイン画面の場合
    const loginButton = await mattermostPage.locator('button#loginButton, #saveSetting').first();
    if (await loginButton.isVisible()) {
      console.log('8. Mattermostにログイン');
      // 様々なセレクタを試す
      const usernameSelectors = ['#loginId', '#username', 'input[name="loginId"]', 'input[name="username"]', '#input_loginId'];
      const passwordSelectors = ['#loginPassword', '#password', 'input[name="password"]', '#input_password-input', 'input[type="password"]'];
      
      for (const selector of usernameSelectors) {
        try {
          await mattermostPage.fill(selector, 'admin');
          console.log(`✓ ユーザー名入力成功: ${selector}`);
          break;
        } catch (e) {
          continue;
        }
      }
      
      for (const selector of passwordSelectors) {
        try {
          await mattermostPage.fill(selector, 'Admin123456!');
          console.log(`✓ パスワード入力成功: ${selector}`);
          break;
        } catch (e) {
          continue;
        }
      }
      
      await loginButton.click();
      await mattermostPage.waitForTimeout(3000);
    }
    
    await mattermostPage.screenshot({ path: 'test-mattermost-channels.png', fullPage: true });
    
    console.log('✅ テスト完了！');
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    await page.screenshot({ path: 'test-channels-error.png', fullPage: true });
  } finally {
    await browser.close();
    console.log('🔚 テストを終了しました');
  }
})();