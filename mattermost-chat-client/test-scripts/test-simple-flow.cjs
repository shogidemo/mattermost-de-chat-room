const { chromium } = require('playwright');

async function testSimpleFlow() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // 1. Reactアプリにアクセス
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    console.log('✅ Reactアプリにアクセスしました');
    
    // 2. ログイン
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'Admin123456!');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    console.log('✅ ログインしました');
    
    // 3. チャットボタンをクリック
    await page.click('[data-testid="chat-bubble"]');
    await page.waitForTimeout(2000);
    console.log('✅ チャットボタンをクリックしました');
    
    // 4. フィルターをクリア
    const clearButton = page.locator('svg[data-testid="ClearIcon"]').locator('..');
    if (await clearButton.isVisible()) {
      await clearButton.click();
      await page.waitForTimeout(1000);
      console.log('✅ フィルターをクリアしました');
    }
    
    // 5. チャンネルリストを確認
    await page.screenshot({ path: 'simple-test-channels.png' });
    
    // MUIのListItemを探す
    const listItems = await page.locator('.MuiListItem-root').all();
    console.log(`チャンネル数: ${listItems.length}`);
    
    if (listItems.length > 0) {
      // 最初のチャンネルをクリック
      await listItems[0].click();
      await page.waitForTimeout(2000);
      console.log('✅ チャンネルをクリックしました');
      
      // チャット画面のスクリーンショット
      await page.screenshot({ path: 'simple-test-chat.png' });
      
      // メッセージ送信
      const messageInput = page.locator('textarea').first();
      if (await messageInput.isVisible()) {
        await messageInput.fill('テストメッセージ from Playwright');
        await messageInput.press('Enter');
        await page.waitForTimeout(2000);
        console.log('✅ メッセージを送信しました');
        
        // 送信後のスクリーンショット
        await page.screenshot({ path: 'simple-test-sent.png' });
      }
    }
    
  } catch (error) {
    console.error('エラー:', error);
    await page.screenshot({ path: 'simple-test-error.png' });
  } finally {
    await browser.close();
  }
}

testSimpleFlow().catch(console.error);