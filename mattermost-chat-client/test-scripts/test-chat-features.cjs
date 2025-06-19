const { chromium } = require('playwright');

(async () => {
  console.log('🚀 チャット機能テストを開始します...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  try {
    // === テスト1: チャンネルクリックでチャット開く ===
    console.log('\n📋 テスト1: チャンネルクリックでチャット開く');
    const page = await context.newPage();
    
    // 1. Reactアプリにアクセスしてログイン
    console.log('1. Reactアプリにアクセス');
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(2000);
    
    // ログインフォームに入力
    console.log('2. ログイン');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'Admin123456!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // チャットボタンをクリック
    console.log('3. チャットボタンをクリック');
    await page.click('[data-testid="chat-bubble"]');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test1-channel-list.png', fullPage: true });
    
    // 佐藤チャンネル1をクリック
    console.log('4. 佐藤チャンネル1をクリック');
    const channel = await page.locator('text=佐藤チャンネル1').first();
    await channel.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test1-chat-opened.png', fullPage: true });
    
    // === テスト2: メッセージ送信 ===
    console.log('\n📋 テスト2: メッセージ送信');
    
    // メッセージを入力
    console.log('1. メッセージを入力');
    // data-testidを使用してメッセージ入力欄を選択
    const messageInput = await page.locator('[data-testid="message-input"]');
    await messageInput.fill('Reactアプリからのテストメッセージ');
    await page.screenshot({ path: 'test2-typing.png', fullPage: true });
    
    // 送信
    console.log('2. メッセージを送信');
    await messageInput.press('Enter');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test2-sent.png', fullPage: true });
    
    // === テスト3: Mattermostで確認 ===
    console.log('\n📋 テスト3: Mattermostで確認');
    
    // Mattermostを開く
    const mattermostPage = await context.newPage();
    await mattermostPage.goto('http://localhost:8065/test-team/channels/佐藤チャンネル1');
    await mattermostPage.waitForTimeout(3000);
    
    // スクリーンショットを撮る
    await mattermostPage.screenshot({ path: 'test3-mattermost.png', fullPage: true });
    
    // === テスト4: リアルタイム更新 ===
    console.log('\n📋 テスト4: リアルタイム更新テスト');
    
    // Mattermostからメッセージを送信
    console.log('1. Mattermostからメッセージを送信');
    try {
      const mattermostInput = await mattermostPage.locator('textarea[placeholder*="Write to"], textarea#post_textbox').first();
      await mattermostInput.fill('Mattermostからのテストメッセージ');
      await mattermostInput.press('Enter');
      await mattermostPage.waitForTimeout(2000);
    } catch (error) {
      console.log('Mattermostのメッセージ入力欄が見つかりませんでした');
    }
    
    // Reactアプリに戻って確認
    console.log('2. Reactアプリでリアルタイム更新を確認');
    await page.bringToFront();
    await page.waitForTimeout(3000); // WebSocketでの更新を待つ
    await page.screenshot({ path: 'test4-realtime-update.png', fullPage: true });
    
    console.log('\n✅ すべてのテストが完了しました！');
    
  } catch (error) {
    console.error('❌ テスト中にエラーが発生しました:', error);
    await context.pages()[0].screenshot({ path: 'test-error.png', fullPage: true });
  } finally {
    await browser.close();
    console.log('\n🔚 テストを終了しました');
  }
})();