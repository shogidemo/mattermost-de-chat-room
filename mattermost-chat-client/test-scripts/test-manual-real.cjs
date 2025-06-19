const { chromium } = require('playwright');

async function testManualReal() {
  console.log('🔗 Mattermost連携手動テスト');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 2000 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const credentials = {
    username: 'admin',
    password: 'Admin123456!'
  };
  
  try {
    // 1. Reactアプリにアクセス
    console.log('1. Reactアプリにアクセス...');
    await page.goto('http://localhost:5178/');
    await page.waitForTimeout(3000);

    // 2. ログイン
    console.log('2. ログイン...');
    await page.fill('input[name="username"]', credentials.username);
    await page.fill('input[name="password"]', credentials.password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);

    console.log('✅ ログイン成功！');
    console.log('');
    console.log('📝 手動テスト手順:');
    console.log('1. 右下の青いチャットボタンをクリック');
    console.log('2. チャンネルリストが表示されることを確認');
    console.log('3. フィルターに「佐藤」が入っているか確認');
    console.log('4. フィルターをクリアして全チャンネルを表示');
    console.log('5. いずれかのチャンネルをクリック');
    console.log('6. メッセージを送信');
    console.log('');
    console.log('ブラウザを開いたままにします。');
    console.log('テストが完了したらCtrl+Cで終了してください。');
    
    // ブラウザを開いたまま
    await new Promise(() => {});

  } catch (error) {
    console.error('❌ エラー:', error);
  }
}

testManualReal().catch(console.error);