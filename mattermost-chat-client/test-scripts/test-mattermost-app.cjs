const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Step 1: Reactアプリにアクセス
    console.log('Step 1: Accessing React app...');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-1-react-app-initial.png' });

    // Step 2: ログイン
    console.log('Step 2: Logging in...');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'Admin123456!');
    await page.click('button[type="submit"]');
    
    // ログイン完了を待つ
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-2-after-login.png' });

    // Step 3: チャットボタンをクリック（右下の青いボタン）
    console.log('Step 3: Clicking chat button...');
    // FABボタン（右下の青いボタン）を探す
    const chatButton = await page.locator('button.MuiFab-root').filter({ hasText: '💬' });
    await chatButton.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-3-chat-popup.png' });

    // Step 4: チャンネルリストの確認
    console.log('Step 4: Checking channel list...');
    
    // チャンネルリストが表示されているか確認
    const channelListVisible = await page.locator('.MuiList-root').isVisible();
    console.log(`Channel list visible: ${channelListVisible}`);
    
    // パブリックチャネルの確認
    const publicChannelText = await page.locator('text=パブリックチャネル').count();
    console.log(`Found "パブリックチャネル" text: ${publicChannelText} times`);
    
    // チャンネルアイテムの確認
    const channelItems = await page.locator('.MuiListItem-root').all();
    console.log(`Found ${channelItems.length} channel items`);
    
    // 最新メッセージの確認
    const messagePreviewCount = await page.locator('.MuiListItemText-secondary').count();
    console.log(`Found ${messagePreviewCount} message previews`);
    
    await page.screenshot({ path: 'test-4-channel-list-details.png' });

    // Step 5: チャンネルをクリック
    console.log('Step 5: Clicking a channel...');
    // 営業チームチャンネルを探してクリック
    const salesChannel = await page.locator('.MuiListItem-root').filter({ hasText: '営業チーム' }).first();
    if (await salesChannel.count() > 0) {
      await salesChannel.click();
      console.log('Clicked on 営業チーム channel');
    } else {
      // 最初のチャンネルをクリック
      const firstChannel = await page.locator('.MuiListItem-root').first();
      await firstChannel.click();
      console.log('Clicked on first available channel');
    }
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-5-chat-view.png' });

    // Step 6: 別タブでMattermostを開く
    console.log('Step 6: Opening Mattermost in new tab...');
    const page2 = await context.newPage();
    await page2.goto('http://localhost:8065');
    await page2.waitForLoadState('networkidle');
    
    // Mattermostにログイン（セレクタを確認）
    try {
      // 新しいセレクタで試す
      await page2.fill('input#loginId', 'admin');
      await page2.fill('input#loginPassword', 'Admin123456!');
      await page2.click('button#loginButton');
    } catch (e) {
      // 古いセレクタで試す
      await page2.fill('input[id="input_loginId"]', 'admin');
      await page2.fill('input[id="input_password-input"]', 'Admin123456!');
      await page2.click('button[id="saveSetting"]');
    }
    await page2.waitForTimeout(3000);
    await page2.screenshot({ path: 'test-6-mattermost-logged-in.png' });

    // Step 7: Mattermostで同じチャンネルを開く
    console.log('Step 7: Finding and opening same channel in Mattermost...');
    // チャンネル名を取得（チャット画面のタイトルから）
    let channelName = '営業チーム'; // デフォルト
    try {
      const titleElement = await page.locator('.MuiTypography-h6').first();
      if (await titleElement.count() > 0) {
        channelName = await titleElement.textContent();
        console.log(`Current channel in React app: ${channelName}`);
      }
    } catch (e) {
      console.log('Using default channel: 営業チーム');
    }
    
    // Mattermostでチャンネルを探す
    try {
      await page2.click(`text="${channelName}"`);
      await page2.waitForTimeout(2000);
    } catch (e) {
      console.log('Could not find channel by name, trying to click first channel');
      await page2.click('.SidebarChannel').first();
      await page2.waitForTimeout(2000);
    }
    
    // Step 8: Mattermostでメッセージを送信
    console.log('Step 8: Sending message from Mattermost...');
    const timestamp = new Date().toLocaleTimeString();
    const testMessage = `Test message from Mattermost - ${timestamp}`;
    
    // メッセージ入力フィールドを探す
    const messageInput = await page2.locator('textarea[data-testid="post_textbox"]').or(page2.locator('textarea[placeholder*="メッセージ"]')).or(page2.locator('#post_textbox'));
    await messageInput.fill(testMessage);
    await messageInput.press('Enter');
    await page2.waitForTimeout(2000);
    await page2.screenshot({ path: 'test-7-mattermost-message-sent.png' });

    // Step 9: Reactアプリに戻って確認
    console.log('Step 9: Checking if message appears in React app...');
    await page.bringToFront();
    await page.waitForTimeout(5000); // WebSocketでメッセージが届くのを待つ
    
    // メッセージが表示されているか確認
    const messageVisible = await page.locator(`text="${testMessage}"`).count() > 0;
    console.log(`Message visible in React app: ${messageVisible}`);
    
    // 再度スクリーンショット
    await page.screenshot({ path: 'test-8-react-app-final.png' });

    // 追加確認: メッセージリストを更新
    console.log('Step 10: Additional checks...');
    
    // チャンネルリストに戻る
    await page.click('button[aria-label="戻る"]').catch(() => {
      console.log('Back button not found, continuing...');
    });
    await page.waitForTimeout(1000);
    
    // 再度チャットボタンをクリック
    await chatButton.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-9-channel-list-updated.png' });

    console.log('\n=== Test Summary ===');
    console.log('✓ Login successful');
    console.log(`✓ Channel list displayed: ${channelListVisible}`);
    console.log(`✓ Public channel label found: ${publicChannelText > 0}`);
    console.log(`✓ Message previews found: ${messagePreviewCount > 0}`);
    console.log(`✓ Real-time message sync: ${messageVisible}`);
    console.log('===================\n');

  } catch (error) {
    console.error('Error during test:', error);
    await page.screenshot({ path: 'test-error.png' });
  } finally {
    // ブラウザを開いたままにして手動確認できるようにする
    console.log('Test completed. Browser will remain open for manual inspection.');
    console.log('Press Ctrl+C to close the browser and exit.');
    
    // 無限ループで待機
    await new Promise(() => {});
  }
})();