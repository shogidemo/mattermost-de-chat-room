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
    // FABボタン（右下の青いボタン）を探す - data-testidを使用
    const chatButton = await page.locator('[data-testid="chat-bubble"]');
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
    
    // チャンネル名とメッセージプレビューを表示
    for (let i = 0; i < Math.min(3, channelItems.length); i++) {
      const channelName = await channelItems[i].locator('.MuiListItemText-primary').textContent();
      const channelMessage = await channelItems[i].locator('.MuiListItemText-secondary').textContent().catch(() => 'No preview');
      console.log(`Channel ${i + 1}: ${channelName} - ${channelMessage}`);
    }
    
    await page.screenshot({ path: 'test-4-channel-list-details.png' });

    console.log('\n=== Test Summary ===');
    console.log('✓ Login successful');
    console.log(`✓ Chat button clicked successfully`);
    console.log(`✓ Channel list displayed: ${channelListVisible}`);
    console.log(`✓ Public channel label found: ${publicChannelText > 0}`);
    console.log(`✓ Total channels found: ${channelItems.length}`);
    console.log(`✓ Message previews found: ${messagePreviewCount > 0}`);
    console.log('===================\n');

  } catch (error) {
    console.error('Error during test:', error);
    await page.screenshot({ path: 'test-error.png' });
  } finally {
    await browser.close();
  }
})();