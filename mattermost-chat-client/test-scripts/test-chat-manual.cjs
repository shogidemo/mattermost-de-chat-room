const { chromium } = require('playwright');

async function testChatManual() {
  console.log('💬 手動チャット画面テスト開始');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 2000 // ゆっくり操作
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 1. Reactアプリにアクセス
    console.log('1. Reactアプリにアクセス...');
    await page.goto('http://localhost:5178/');
    await page.waitForTimeout(3000);

    // 2. チャットバブルをクリック
    console.log('2. チャットバブルをクリック...');
    const floatingButton = await page.locator('button[style*="position: fixed"]').first();
    if (await floatingButton.isVisible()) {
      await floatingButton.click();
      await page.waitForTimeout(3000);
    }

    // 3. フィルターをクリアして全チャンネルを表示
    console.log('3. フィルターをクリア...');
    const searchBox = await page.locator('input[placeholder*="検索"], input[placeholder*="フィルター"]').first();
    if (await searchBox.isVisible()) {
      await searchBox.click();
      await searchBox.clear();
      await page.waitForTimeout(2000);
    }

    await page.screenshot({ path: 'manual-1-all-channels.png', fullPage: true });
    console.log('📸 全チャンネル表示: manual-1-all-channels.png');

    // 4. 佐藤チームをクリック
    console.log('4. 佐藤チームを探してクリック...');
    const channelItems = await page.locator('.MuiListItem-root').all();
    console.log('チャンネル数:', channelItems.length);
    
    for (let i = 0; i < channelItems.length; i++) {
      const text = await channelItems[i].textContent();
      console.log(`チャンネル ${i+1}: ${text}`);
      
      if (text && text.includes('佐藤チーム')) {
        console.log('✅ 佐藤チーム発見！クリックします');
        await channelItems[i].click();
        await page.waitForTimeout(3000);
        break;
      }
    }

    await page.screenshot({ path: 'manual-2-chat-view.png', fullPage: true });
    console.log('📸 チャット画面: manual-2-chat-view.png');

    // 5. チャット画面の詳細確認
    console.log('5. チャット画面の詳細確認...');
    
    // メッセージを確認
    const messages = await page.locator('.MuiTypography-body2').all();
    console.log('📝 メッセージ数:', messages.length);
    
    for (let i = 0; i < Math.min(messages.length, 5); i++) {
      const msgText = await messages[i].textContent();
      console.log(`メッセージ ${i+1}: ${msgText?.substring(0, 50)}...`);
    }
    
    // ユーザー名を確認
    const userNames = await page.locator('.MuiTypography-root').filter({ hasText: /佐藤|田中|管理者/ }).all();
    console.log('👤 表示ユーザー名:');
    for (const userName of userNames) {
      const name = await userName.textContent();
      if (name && name.length < 20) {
        console.log(`  - ${name}`);
      }
    }

    console.log('');
    console.log('✅ チャット画面テスト完了！');
    console.log('📸 スクリーンショット:');
    console.log('  - manual-1-all-channels.png: 全チャンネル表示');
    console.log('  - manual-2-chat-view.png: チャット画面');

  } catch (error) {
    console.error('❌ テストエラー:', error);
    await page.screenshot({ path: 'manual-error.png', fullPage: true });
  } finally {
    console.log('ブラウザを開いたままにします。手動で確認してください。');
    console.log('確認が終わったらCtrl+Cで終了してください。');
    
    // ブラウザを開いたままにする
    await new Promise(() => {});
  }
}

testChatManual().catch(console.error);