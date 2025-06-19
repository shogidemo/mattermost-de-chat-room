const { chromium } = require('playwright');

(async () => {
  console.log('🔍 重複メッセージ修正確認テスト - 最終版');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 300
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // コンソールログを監視
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('重複メッセージ') || text.includes('WebSocket') || text.includes('ポーリング')) {
      console.log(`📋 Console Log: ${text}`);
    }
  });
  
  try {
    // 1. Reactアプリにアクセス
    console.log('\n📱 Step 1: Reactアプリにアクセス...');
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(2000);
    
    // 2. ログイン（必要な場合）
    console.log('\n🔐 Step 2: ログイン確認...');
    const loginForm = await page.locator('form').first();
    if (await loginForm.isVisible()) {
      await page.fill('input[name="username"]', 'admin');
      await page.fill('input[name="password"]', 'Admin123456!');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
    }
    
    // 3. チャットボタンをクリック
    console.log('\n💬 Step 3: チャットを開く...');
    const chatButton = page.locator('.MuiFab-root').first();
    await chatButton.click();
    await page.waitForTimeout(2000);
    
    // 4. 検索フィールドをクリアして全チャンネルを表示
    console.log('\n🔍 Step 4: 検索フィールドをクリア...');
    const searchField = page.locator('input[placeholder*="検索"]').first();
    if (await searchField.isVisible()) {
      await searchField.click();
      await searchField.fill(''); // 検索フィールドをクリア
      await page.waitForTimeout(1000);
    }
    
    // スクリーンショット
    await page.screenshot({ path: 'fix-test-1-all-channels.png' });
    
    // 5. Town Squareチャンネルを探して選択
    console.log('\n📢 Step 5: Town Squareチャンネルを選択...');
    // パブリックチャンネルセクションを探す
    const publicChannelsSection = await page.locator('text=パブリックチャンネル').first();
    if (await publicChannelsSection.isVisible()) {
      // Town Squareを探す（大文字小文字を区別しない）
      const townSquareOptions = [
        page.locator('text=/town square/i').first(),
        page.locator('[class*="MuiListItem"]:has-text("Town Square")').first(),
        page.locator('[class*="MuiListItem"]:has-text("town-square")').first(),
      ];
      
      let channelFound = false;
      for (const channel of townSquareOptions) {
        if (await channel.isVisible({ timeout: 1000 })) {
          await channel.click();
          channelFound = true;
          console.log('✅ Town Squareチャンネルを選択しました');
          break;
        }
      }
      
      if (!channelFound) {
        console.log('⚠️ Town Squareが見つかりません。最初のチャンネルを選択します...');
        const firstChannel = page.locator('[class*="MuiListItem"]').first();
        await firstChannel.click();
      }
    }
    
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'fix-test-2-channel-selected.png' });
    
    // 6. 現在のメッセージ数を記録
    console.log('\n📊 Step 6: 初期メッセージ数を確認...');
    const initialMessageCount = await page.locator('[class*="MuiBox"]:has([class*="MuiTypography"])').count();
    console.log(`初期メッセージ数: ${initialMessageCount}`);
    
    // 7. テスト準備完了
    console.log('\n✅ 自動化セットアップ完了！');
    console.log('\n📝 手動テスト手順:');
    console.log('1. 新しいブラウザウィンドウで http://localhost:8065 を開く');
    console.log('2. admin / Admin123456! でログイン');
    console.log('3. Town Squareチャンネルに移動');
    console.log('4. テストメッセージを送信: "重複テスト1: [時刻]"');
    console.log('5. このReactアプリに戻って確認');
    console.log('6. メッセージが1件だけ表示されることを確認');
    console.log('7. コンソールログを確認（F12 → Console）');
    console.log('8. さらにメッセージを送信して重複がないか確認');
    
    // 定期的にメッセージ数をチェック
    let checkCount = 0;
    const checkInterval = setInterval(async () => {
      checkCount++;
      const currentMessageCount = await page.locator('[class*="MuiBox"]:has([class*="MuiTypography"])').count();
      if (currentMessageCount !== initialMessageCount) {
        console.log(`\n🔔 メッセージ数の変化を検出: ${initialMessageCount} → ${currentMessageCount}`);
        
        // 最新のスクリーンショットを撮影
        await page.screenshot({ path: `fix-test-update-${checkCount}.png` });
      }
    }, 3000);
    
    console.log('\n⏳ ブラウザは開いたままです。Ctrl+Cで終了してください。');
    
    // ブラウザを開いたままにする
    await new Promise(() => {});
    
  } catch (error) {
    console.error('❌ エラー:', error);
    await page.screenshot({ path: 'fix-test-error.png' });
  }
})();