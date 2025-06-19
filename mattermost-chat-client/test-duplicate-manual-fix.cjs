const { chromium } = require('playwright');

(async () => {
  console.log('🔍 重複メッセージ修正確認テストを開始します...');
  console.log('\n📋 手動テスト手順：\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true 
  });
  
  const context = await browser.newContext();
  
  // ページ1: Reactアプリ
  console.log('1️⃣ Reactアプリのページを開きます...');
  const reactPage = await context.newPage();
  await reactPage.goto('http://localhost:5173');
  
  // ページ2: Mattermost
  console.log('2️⃣ Mattermostのページを開きます...');
  const mattermostPage = await context.newPage();
  await mattermostPage.goto('http://localhost:8065');
  
  console.log('\n🚀 両方のページが開きました。以下の手順で手動テストを実行してください：\n');
  
  console.log('【Reactアプリ側の操作】');
  console.log('1. admin / Admin123456! でログイン');
  console.log('2. 右下の青いチャットボタンをクリック');
  console.log('3. Town Squareチャンネルをクリック');
  console.log('4. 開発者ツールのConsoleタブを開く（F12キー）\n');
  
  console.log('【Mattermost側の操作】');
  console.log('1. admin / Admin123456! でログイン');
  console.log('2. Town Squareチャンネルに移動\n');
  
  console.log('【テスト実行】');
  console.log('1. Mattermostから「修正確認テスト1: ' + new Date().toLocaleTimeString('ja-JP') + '」を送信');
  console.log('2. Reactアプリに戻って、メッセージが1件だけ表示されることを確認');
  console.log('3. コンソールログに「重複メッセージを検出」というログがあるか確認');
  console.log('4. もう一度Mattermostから「修正確認テスト2: ' + new Date().toLocaleTimeString('ja-JP') + '」を送信');
  console.log('5. このメッセージも1件だけ表示されることを確認\n');
  
  console.log('【スクリーンショットを撮影】');
  console.log('- Reactアプリで Ctrl+Shift+S を押してスクリーンショットを保存');
  console.log('- 特にメッセージ表示部分とコンソールログを記録\n');
  
  console.log('⏳ ブラウザは開いたままにします。手動テスト完了後、Ctrl+Cで終了してください。');
  
  // タブを切り替えて見やすくする
  await reactPage.bringToFront();
  
  // ブラウザを開いたままにする
  await new Promise(() => {});
})();