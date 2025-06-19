const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('1. http://localhost:5173 にアクセス');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'text-input-1-initial.png' });

    console.log('2. ログイン画面でadmin/Admin123456!でログイン');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'Admin123456!');
    await page.screenshot({ path: 'text-input-2-login-form.png' });
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'text-input-3-after-login.png' });

    console.log('3. 右下の青いチャットボタンをクリック');
    // チャットボタンを探す
    const chatButton = await page.locator('button').filter({ has: page.locator('svg') }).last();
    await chatButton.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'text-input-4-chat-opened.png' });

    console.log('4. チャンネルリストから営業チームをクリック');
    // チャンネルリストから営業チームを探してクリック
    const channelItem = await page.locator('text=営業チーム').first();
    if (await channelItem.isVisible()) {
      await channelItem.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'text-input-5-channel-selected.png' });
    } else {
      console.log('営業チームチャンネルが見つかりません');
    }

    console.log('5. メッセージ入力欄の状態を確認');
    // メッセージ入力欄を探す
    const messageInput = await page.locator('input[placeholder*="メッセージ"], textarea[placeholder*="メッセージ"]').first();
    
    if (await messageInput.isVisible()) {
      console.log('メッセージ入力欄が見つかりました');
      
      // 入力欄が有効かどうか確認
      const isDisabled = await messageInput.isDisabled();
      console.log(`入力欄の状態: ${isDisabled ? '無効' : '有効'}`);
      
      if (!isDisabled) {
        console.log('6. メッセージ入力欄にテキストを入力');
        await messageInput.fill('テスト メッセージ - Playwrightから送信');
        await page.screenshot({ path: 'text-input-6-message-typed.png' });
        
        console.log('7. 送信ボタンをクリック');
        // 送信ボタンを探す（SendIconがあるボタン）
        const sendButton = await page.locator('button').filter({ has: page.locator('svg') }).last();
        await sendButton.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'text-input-7-after-send.png' });
        
        console.log('メッセージ送信完了');
      } else {
        console.log('警告: メッセージ入力欄が無効になっています');
        await page.screenshot({ path: 'text-input-disabled-field.png' });
      }
    } else {
      console.log('エラー: メッセージ入力欄が見つかりません');
      await page.screenshot({ path: 'text-input-no-field.png' });
    }

    console.log('テスト完了');

  } catch (error) {
    console.error('エラーが発生しました:', error);
    await page.screenshot({ path: 'text-input-error.png' });
  } finally {
    await browser.close();
  }
})();