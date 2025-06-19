const { chromium } = require('playwright');

async function testDuplicateMessages() {
  // Launch browser
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true // 開発者ツールを自動的に開く
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // React アプリにアクセス
  console.log('1. React アプリにアクセス中...');
  await page.goto('http://localhost:5173');
  
  // ログイン
  console.log('2. ログイン中...');
  await page.waitForSelector('input[name="username"]', { timeout: 10000 });
  await page.fill('input[name="username"]', 'admin');
  await page.fill('input[name="password"]', 'Admin123456!');
  await page.click('button[type="submit"]');
  
  // ログインが完了するまで待機
  await page.waitForTimeout(3000);
  
  // 右下のチャットボタンをクリック
  console.log('3. チャットボタンをクリック...');
  const chatButton = await page.waitForSelector('[data-testid="chat-bubble"]', { timeout: 10000 });
  await chatButton.click();
  await page.waitForTimeout(2000);
  
  // 佐藤チャンネル1をクリック
  console.log('4. 佐藤チャンネル1を選択...');
  const satoChannel = await page.waitForSelector('text=佐藤チャンネル1', { timeout: 10000 });
  await satoChannel.click();
  await page.waitForTimeout(2000);
  
  // コンソールログの監視を開始
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('WebSocket') || text.includes('ポーリング') || text.includes('メッセージ') || text.includes('チャンネル')) {
      const time = new Date().toLocaleTimeString('ja-JP');
      consoleLogs.push(`[${time}] ${text}`);
      console.log(`[React Console] ${text}`);
    }
  });
  
  // 初期状態のスクリーンショット
  await page.screenshot({ path: 'duplicate-simple-1-initial.png', fullPage: true });
  
  // 現在のメッセージ数を記録
  const initialMessages = await page.$$('text=重複テスト');
  console.log(`初期メッセージ数: ${initialMessages.length}`);
  
  // Reactアプリからメッセージを送信
  const now = new Date().toLocaleTimeString('ja-JP');
  const testMessage = `重複テスト: ${now}`;
  console.log(`5. メッセージを送信: "${testMessage}"`);
  
  // メッセージ入力欄を探して入力
  const messageInput = await page.waitForSelector('input[placeholder*="メッセージ"]', { timeout: 10000 });
  await messageInput.fill(testMessage);
  await messageInput.press('Enter');
  
  // 送信後の待機
  console.log('6. メッセージ送信後の処理を監視中...');
  await page.waitForTimeout(5000); // WebSocketとポーリングが両方動作する時間を確保
  
  // 送信後のスクリーンショット
  await page.screenshot({ path: 'duplicate-simple-2-after-send.png', fullPage: true });
  
  // メッセージの数を確認
  const messages = await page.$$eval(`text="${testMessage}"`, elements => elements.length);
  
  console.log(`\n=== 結果 ===`);
  console.log(`送信したメッセージ: "${testMessage}"`);
  console.log(`表示されたメッセージ数: ${messages}`);
  
  if (messages > 1) {
    console.log('⚠️  重複が検出されました！');
  } else if (messages === 1) {
    console.log('✅ 重複なし - 正常に1件のみ表示されています');
  } else {
    console.log('❌ メッセージが表示されていません');
  }
  
  // コンソールログのサマリー
  console.log('\n=== コンソールログサマリー ===');
  consoleLogs.forEach(log => console.log(log));
  
  console.log('\n=== 詳細分析 ===');
  const websocketLogs = consoleLogs.filter(log => log.includes('WebSocket'));
  const pollingLogs = consoleLogs.filter(log => log.includes('ポーリング'));
  
  console.log(`WebSocket関連ログ: ${websocketLogs.length}件`);
  console.log(`ポーリング関連ログ: ${pollingLogs.length}件`);
  
  if (websocketLogs.length > 0 && pollingLogs.length > 0) {
    console.log('⚠️  WebSocketとポーリングの両方が動作している可能性があります');
  }
  
  // ブラウザを開いたままにする
  console.log('\nブラウザは開いたままです。手動で確認後、Ctrl+Cで終了してください。');
  
  // プロセスが終了しないようにする
  await new Promise(() => {});
}

// エラーハンドリング
testDuplicateMessages().catch(err => {
  console.error('エラーが発生しました:', err);
  process.exit(1);
});