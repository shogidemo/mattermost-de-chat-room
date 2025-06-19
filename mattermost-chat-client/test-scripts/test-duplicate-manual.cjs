const { chromium } = require('playwright');

async function manualDuplicateTest() {
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
  
  console.log('=== ここから手動でテストを行ってください ===');
  console.log('');
  console.log('手順:');
  console.log('1. 右下の青いチャットボタンをクリック');
  console.log('2. 「佐藤チャンネル1」をクリック');
  console.log('3. チャット画面が開いたことを確認');
  console.log('4. 別のブラウザタブで http://localhost:8065 を開く');
  console.log('5. adminでログイン');
  console.log('6. test-teamの「佐藤チャンネル1」に移動');
  console.log('7. Mattermostから「重複テスト: ${現在時刻}」というメッセージを送信');
  console.log('8. Reactアプリに戻り、メッセージが何件表示されるか確認');
  console.log('');
  console.log('コンソールログに以下が表示されるか確認:');
  console.log('- WebSocketイベント受信');
  console.log('- ポーリング');
  console.log('');
  
  // コンソールログの監視
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('WebSocket') || text.includes('ポーリング') || text.includes('メッセージ') || text.includes('重複')) {
      const time = new Date().toLocaleTimeString('ja-JP');
      console.log(`[${time}] [Console] ${text}`);
    }
  });
  
  // プロセスが終了しないようにする
  await new Promise(() => {});
}

// エラーハンドリング
manualDuplicateTest().catch(err => {
  console.error('エラーが発生しました:', err);
  process.exit(1);
});