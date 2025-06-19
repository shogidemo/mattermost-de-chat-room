const { chromium } = require('playwright');

async function testDuplicateMessages() {
  // Launch browser
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true // 開発者ツールを自動的に開く
  });
  const context = await browser.newContext();
  
  // 最初のタブ（React アプリ）
  const page1 = await context.newPage();
  console.log('1. React アプリにアクセス中...');
  await page1.goto('http://localhost:5173');
  
  // ログイン
  console.log('2. ログイン中...');
  await page1.waitForSelector('input[name="username"]', { timeout: 10000 });
  await page1.fill('input[name="username"]', 'admin');
  await page1.fill('input[name="password"]', 'Admin123456!');
  await page1.click('button[type="submit"]');
  
  // ログインが完了するまで待機
  await page1.waitForTimeout(3000);
  
  // スクリーンショット：初期状態
  await page1.screenshot({ path: 'duplicate-test-initial.png' });
  
  // 右下のチャットボタンをクリック
  console.log('3. チャットボタンをクリック...');
  const chatButton = await page1.waitForSelector('[data-testid="chat-bubble"]', { timeout: 10000 });
  await chatButton.click();
  await page1.waitForTimeout(1000);
  
  // チャンネルリストが表示されるまで待機
  await page1.waitForTimeout(2000);
  
  // チャンネルリストのスクリーンショット
  await page1.screenshot({ path: 'duplicate-test-channel-list.png' });
  
  // Town Squareチャンネルをクリック（大文字・小文字を考慮）
  console.log('4. Town Squareチャンネルを選択...');
  let channelClicked = false;
  
  // まずTown Squareを探す
  try {
    const townSquare = await page1.waitForSelector('text=Town Square', { timeout: 5000 });
    await townSquare.click();
    channelClicked = true;
  } catch (e) {
    console.log('Town Square が見つかりません。town-square を探します...');
  }
  
  // town-squareを探す
  if (!channelClicked) {
    try {
      const townSquare = await page1.waitForSelector('text=town-square', { timeout: 5000 });
      await townSquare.click();
      channelClicked = true;
    } catch (e) {
      console.log('town-square も見つかりません。一般チャンネルを探します...');
    }
  }
  
  // 一般チャンネルを探す
  if (!channelClicked) {
    try {
      const general = await page1.waitForSelector('text=一般', { timeout: 5000 });
      await general.click();
      channelClicked = true;
    } catch (e) {
      console.log('一般チャンネルも見つかりません。佐藤チャンネル1を使用します。');
      // 佐藤チャンネル1をクリック
      try {
        const satoChannel = await page1.waitForSelector('text=佐藤チャンネル1', { timeout: 5000 });
        await satoChannel.click();
        channelClicked = true;
        console.log('佐藤チャンネル1を選択しました。');
      } catch (e2) {
        // 利用可能なチャンネルを表示
        const channels = await page1.$$eval('.MuiListItem-root', elements => 
          elements.map(el => el.textContent)
        );
        console.log('利用可能なチャンネル:', channels);
        throw new Error('適切なチャンネルが見つかりません');
      }
    }
  }
  
  await page1.waitForTimeout(2000);
  
  // スクリーンショット：チャット画面を開いた状態
  await page1.screenshot({ path: 'duplicate-test-chat-open.png' });
  
  // コンソールログの監視を開始
  page1.on('console', msg => {
    const text = msg.text();
    if (text.includes('WebSocket') || text.includes('ポーリング') || text.includes('メッセージ')) {
      console.log(`[React Console] ${text}`);
    }
  });
  
  // 2つ目のタブ（Mattermost）
  const page2 = await context.newPage();
  console.log('5. Mattermostにアクセス中...');
  await page2.goto('http://localhost:8065');
  
  // Mattermostでログイン
  console.log('6. Mattermostでログイン中...');
  await page2.waitForSelector('#input_loginId', { timeout: 10000 });
  await page2.fill('#input_loginId', 'admin');
  await page2.fill('#input_password-input', 'Admin123456!');
  await page2.click('#saveSetting');
  
  // ログイン完了まで待機
  await page2.waitForTimeout(3000);
  
  // test-teamの佐藤チャンネル1に移動（ReactアプリとMattermostで同じチャンネルを使用）
  console.log('7. Mattermostで佐藤チャンネル1に移動...');
  try {
    // まずtest-teamに移動
    const teamLink = await page2.waitForSelector('a[href*="/test-team"]', { timeout: 5000 });
    await teamLink.click();
    await page2.waitForTimeout(2000);
    
    // 佐藤チャンネル1を探す
    const satoChannelLink = await page2.waitForSelector('a[aria-label*="佐藤チャンネル1"]', { timeout: 10000 });
    await satoChannelLink.click();
  } catch (e) {
    console.log('佐藤チャンネル1が見つかりません。利用可能なチャンネルを確認します。');
    // Town Squareを使用
    try {
      const townSquareLink = await page2.waitForSelector('a[href*="channels/town-square"]', { timeout: 5000 });
      await townSquareLink.click();
    } catch (e2) {
      console.log('Town Squareも見つかりません。最初のチャンネルを使用します。');
    }
  }
  await page2.waitForTimeout(2000);
  
  // 現在時刻を含むメッセージを送信
  const now = new Date().toLocaleTimeString('ja-JP');
  const testMessage = `重複テスト: ${now}`;
  console.log(`8. テストメッセージを送信: "${testMessage}"`);
  
  // メッセージ入力欄を探す
  const messageInput = await page2.waitForSelector('#post_textbox', { timeout: 10000 });
  await messageInput.fill(testMessage);
  await messageInput.press('Enter');
  
  // メッセージが送信されるまで待機
  await page2.waitForTimeout(2000);
  
  // Reactアプリに戻って確認
  await page1.bringToFront();
  console.log('9. Reactアプリでメッセージを確認中...');
  await page1.waitForTimeout(3000); // WebSocketとポーリングの両方が動作する時間を確保
  
  // スクリーンショット：メッセージ受信後
  await page1.screenshot({ path: 'duplicate-test-1.png', fullPage: true });
  
  // 開発者ツールのコンソールタブのスクリーンショット
  console.log('10. コンソールログのスクリーンショットを撮影...');
  // 開発者ツールが開いている場合のスクリーンショット
  await page1.screenshot({ path: 'duplicate-test-console.png', fullPage: true });
  
  // メッセージの数を確認
  const messages = await page1.$$eval(`text="${testMessage}"`, elements => elements.length);
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