const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('=== Mattermostチャットアプリ テキスト入力機能テスト ===\n');
    
    console.log('1. http://localhost:5173 にアクセス');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'text-input-test-1-initial.png' });
    console.log('   ✓ スクリーンショット: text-input-test-1-initial.png\n');

    console.log('2. ログイン画面でadmin/Admin123456!でログイン');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'Admin123456!');
    await page.screenshot({ path: 'text-input-test-2-login-filled.png' });
    console.log('   ✓ スクリーンショット: text-input-test-2-login-filled.png');
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'text-input-test-3-after-login.png' });
    console.log('   ✓ ログイン成功');
    console.log('   ✓ スクリーンショット: text-input-test-3-after-login.png\n');

    console.log('3. 右下の青いチャットボタンをクリック');
    const fabButton = await page.locator('button.MuiFab-root').first();
    await fabButton.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'text-input-test-4-chat-opened.png' });
    console.log('   ✓ チャットウィンドウが開きました');
    console.log('   ✓ スクリーンショット: text-input-test-4-chat-opened.png\n');

    console.log('4. チャンネルリストから営業チームをクリック');
    // まず営業チームチャンネルを探す
    const salesChannel = await page.locator('text=営業チーム').first();
    if (await salesChannel.isVisible()) {
      await salesChannel.click();
      console.log('   ✓ 営業チームチャンネルを選択しました');
    } else {
      // 営業チームが見つからない場合は、最初のチャンネルを選択
      console.log('   ! 営業チームが見つからないため、最初のチャンネルを選択します');
      const firstChannel = await page.locator('.MuiListItem-root').first();
      await firstChannel.click();
    }
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'text-input-test-5-channel-selected.png' });
    console.log('   ✓ スクリーンショット: text-input-test-5-channel-selected.png\n');

    console.log('5. メッセージ入力欄の状態を確認');
    // textareaを探す（data-testid="message-input"または placeholder含む）
    const messageInput = await page.locator('textarea[data-testid="message-input"], textarea[placeholder*="メッセージを送信"]').first();
    
    if (await messageInput.isVisible()) {
      console.log('   ✓ メッセージ入力欄が見つかりました');
      
      const isDisabled = await messageInput.isDisabled();
      const placeholder = await messageInput.getAttribute('placeholder');
      console.log(`   - 入力欄の状態: ${isDisabled ? '無効' : '有効'}`);
      console.log(`   - プレースホルダー: "${placeholder}"`);
      
      if (!isDisabled) {
        console.log('\n6. メッセージ入力欄にテキストを入力');
        const testMessage = 'テストメッセージ - Playwrightから送信 ' + new Date().toLocaleTimeString('ja-JP');
        await messageInput.fill(testMessage);
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'text-input-test-6-message-typed.png' });
        console.log(`   ✓ メッセージを入力しました: "${testMessage}"`);
        console.log('   ✓ スクリーンショット: text-input-test-6-message-typed.png\n');
        
        console.log('7. 送信ボタンをクリックしてメッセージを送信');
        // 送信ボタンを探す（aria-label="send"）
        const sendButton = await page.locator('button[aria-label="send"]').first();
        
        if (await sendButton.isVisible()) {
          await sendButton.click();
          console.log('   ✓ 送信ボタンをクリックしました');
          await page.waitForTimeout(2000);
          
          // メッセージが送信されたか確認（入力欄が空になっているか）
          const afterSendValue = await messageInput.inputValue();
          if (afterSendValue === '') {
            console.log('   ✓ メッセージが正常に送信されました（入力欄がクリアされました）');
          } else {
            console.log('   ! 警告: 入力欄がクリアされていません');
          }
          
          await page.screenshot({ path: 'text-input-test-7-after-send.png' });
          console.log('   ✓ スクリーンショット: text-input-test-7-after-send.png');
        } else {
          console.log('   ! エラー: 送信ボタンが見つかりません');
          await page.screenshot({ path: 'text-input-test-send-button-not-found.png' });
        }
      } else {
        console.log('   ! 警告: メッセージ入力欄が無効になっています');
        await page.screenshot({ path: 'text-input-test-disabled-field.png' });
      }
    } else {
      console.log('   ! エラー: メッセージ入力欄が見つかりません');
      await page.screenshot({ path: 'text-input-test-no-field.png' });
    }

    console.log('\n=== テスト完了 ===');
    console.log('すべてのスクリーンショットが保存されました。');

  } catch (error) {
    console.error('\n!!! エラーが発生しました !!!');
    console.error('エラー詳細:', error.message);
    console.error('スタックトレース:', error.stack);
    await page.screenshot({ path: 'text-input-test-error.png' });
    console.log('エラースクリーンショット: text-input-test-error.png');
  } finally {
    await page.waitForTimeout(3000); // 結果を確認するための待機
    await browser.close();
  }
})();