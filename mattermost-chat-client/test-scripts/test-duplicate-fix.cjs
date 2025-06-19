const { chromium } = require('playwright');

(async () => {
  console.log('🔍 重複メッセージ修正確認テストを開始します...');
  
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true 
  });
  const context = await browser.newContext();
  
  // ページ1: Reactアプリ
  const reactPage = await context.newPage();
  
  try {
    // 1. Reactアプリにアクセス
    console.log('📱 Reactアプリにアクセス中...');
    await reactPage.goto('http://localhost:5173');
    await reactPage.waitForTimeout(2000);
    
    // 2. ログイン
    console.log('🔐 ログイン処理中...');
    await reactPage.fill('input[name="username"]', 'admin');
    await reactPage.fill('input[name="password"]', 'Admin123456!');
    await reactPage.click('button[type="submit"]');
    await reactPage.waitForTimeout(3000);
    
    // 3. チャットボタンをクリック
    console.log('💬 チャットボタンをクリック...');
    await reactPage.click('button[aria-label="チャット"]');
    await reactPage.waitForTimeout(2000);
    
    // 4. Town Squareチャンネルをクリック
    console.log('📢 Town Squareチャンネルを選択...');
    const channelItem = await reactPage.locator('text=Town Square').first();
    await channelItem.click();
    await reactPage.waitForTimeout(2000);
    
    // スクリーンショット: 初期状態
    await reactPage.screenshot({ path: 'test-duplicate-initial.png', fullPage: false });
    
    // ページ2: Mattermost Web
    console.log('🌐 Mattermost Webを開く...');
    const mattermostPage = await context.newPage();
    await mattermostPage.goto('http://localhost:8065');
    await mattermostPage.waitForTimeout(2000);
    
    // Mattermost にログイン
    console.log('🔐 Mattermostにログイン...');
    await mattermostPage.fill('#input_loginId', 'admin');
    await mattermostPage.fill('#input_password-input', 'Admin123456!');
    await mattermostPage.click('#saveSetting');
    await mattermostPage.waitForTimeout(3000);
    
    // Town Squareに移動
    const townSquareLink = await mattermostPage.locator('text=Town Square').first();
    if (await townSquareLink.isVisible()) {
      await townSquareLink.click();
      await mattermostPage.waitForTimeout(2000);
    }
    
    // テスト1: 最初のメッセージ送信
    const timestamp1 = new Date().toLocaleTimeString('ja-JP');
    const testMessage1 = `修正確認テスト1: ${timestamp1}`;
    console.log(`📤 メッセージ送信: ${testMessage1}`);
    
    await mattermostPage.fill('#post_textbox', testMessage1);
    await mattermostPage.press('#post_textbox', 'Enter');
    await mattermostPage.waitForTimeout(3000);
    
    // Reactアプリに戻って確認
    await reactPage.bringToFront();
    await reactPage.waitForTimeout(2000);
    
    // スクリーンショット: 最初のメッセージ後
    await reactPage.screenshot({ path: 'fixed-test-1-single.png', fullPage: false });
    console.log('📸 最初のメッセージのスクリーンショットを保存');
    
    // コンソールログの確認
    const consoleLogs1 = await reactPage.evaluate(() => {
      const logs = [];
      const originalLog = console.log;
      console.log = function(...args) {
        logs.push(args.join(' '));
        originalLog.apply(console, args);
      };
      return logs;
    });
    
    // テスト2: 2番目のメッセージ送信
    await mattermostPage.bringToFront();
    const timestamp2 = new Date().toLocaleTimeString('ja-JP');
    const testMessage2 = `修正確認テスト2: ${timestamp2}`;
    console.log(`📤 メッセージ送信: ${testMessage2}`);
    
    await mattermostPage.fill('#post_textbox', testMessage2);
    await mattermostPage.press('#post_textbox', 'Enter');
    await mattermostPage.waitForTimeout(3000);
    
    // Reactアプリに戻って確認
    await reactPage.bringToFront();
    await reactPage.waitForTimeout(2000);
    
    // スクリーンショット: 2番目のメッセージ後
    await reactPage.screenshot({ path: 'fixed-test-2-single.png', fullPage: false });
    console.log('📸 2番目のメッセージのスクリーンショットを保存');
    
    // 開発者ツールのコンソールを確認
    const page = await browser.newPage();
    await page.goto('http://localhost:5173');
    await page.evaluate(() => {
      console.log('🔍 コンソールログの確認用メッセージ');
    });
    
    // コンソールのスクリーンショット
    await reactPage.screenshot({ path: 'fixed-test-console.png', fullPage: true });
    console.log('📸 コンソールログのスクリーンショットを保存');
    
    // メッセージ数を確認
    const messageCount = await reactPage.locator('[class*="MuiBox-root"]:has-text("修正確認テスト")').count();
    console.log(`\n📊 検出されたメッセージ数: ${messageCount}`);
    
    if (messageCount === 2) {
      console.log('✅ 修正成功: メッセージが正しく表示されています（重複なし）');
    } else {
      console.log(`❌ 問題検出: ${messageCount}個のメッセージが表示されています`);
    }
    
    console.log('\n⏳ 10秒間待機して観察...');
    await reactPage.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    await reactPage.screenshot({ path: 'test-duplicate-error.png', fullPage: true });
  }
  
  console.log('\n🏁 テスト完了 - ブラウザは開いたままにします');
  console.log('手動で確認後、Ctrl+Cで終了してください');
  
  // ブラウザを開いたままにする
  await new Promise(() => {});
})();