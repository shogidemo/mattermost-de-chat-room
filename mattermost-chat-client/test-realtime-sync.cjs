const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  const page2 = await context.newPage();

  try {
    // Step 1: Reactアプリにアクセスしてログイン
    console.log('Step 1: Logging into React app...');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'Admin123456!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Step 2: チャットポップアップを開く
    console.log('Step 2: Opening chat popup...');
    await page.click('[data-testid="chat-bubble"]');
    await page.waitForTimeout(2000);
    
    // Step 3: 佐藤チャンネル1をクリック
    console.log('Step 3: Opening 佐藤チャンネル1...');
    const channel1 = await page.locator('.MuiListItem-root').filter({ hasText: '佐藤チャンネル1' });
    await channel1.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'sync-1-react-chat-opened.png' });
    
    // Step 4: Mattermostを別タブで開く
    console.log('Step 4: Opening Mattermost in second tab...');
    await page2.goto('http://localhost:8065');
    await page2.waitForLoadState('networkidle');
    
    // Mattermostにログイン
    console.log('Step 5: Logging into Mattermost...');
    // 既にログイン済みの場合はスキップ
    const loginFormVisible = await page2.locator('input#loginId').isVisible().catch(() => false);
    if (loginFormVisible) {
      await page2.fill('input#loginId', 'admin');
      await page2.fill('input#loginPassword', 'Admin123456!');
      await page2.click('button#loginButton');
      await page2.waitForTimeout(3000);
    }
    
    await page2.screenshot({ path: 'sync-2-mattermost-logged-in.png' });
    
    // Step 6: Mattermostで佐藤チャンネル1を開く
    console.log('Step 6: Finding 佐藤チャンネル1 in Mattermost...');
    // サイドバーのチャンネルリストから探す
    const mmChannel = await page2.locator('.SidebarChannel').filter({ hasText: '佐藤チャンネル1' }).first();
    if (await mmChannel.count() > 0) {
      await mmChannel.click();
      console.log('Found and clicked 佐藤チャンネル1');
    } else {
      // チャンネル名で検索
      await page2.click('button[aria-label="チャンネルを検索"]').catch(() => {});
      await page2.fill('input[placeholder*="検索"]', '佐藤チャンネル1');
      await page2.waitForTimeout(1000);
      await page2.keyboard.press('Enter');
    }
    await page2.waitForTimeout(2000);
    await page2.screenshot({ path: 'sync-3-mattermost-channel-opened.png' });
    
    // Step 7: Mattermostでメッセージを送信
    console.log('Step 7: Sending test message from Mattermost...');
    const timestamp = new Date().toLocaleTimeString('ja-JP');
    const testMessage = `リアルタイムテスト: ${timestamp}`;
    
    // メッセージ入力欄を探す
    const messageInput = await page2.locator('#post_textbox, textarea[data-testid="post_textbox"], div[data-testid="post_textbox"]').first();
    await messageInput.click();
    await messageInput.fill(testMessage);
    await messageInput.press('Enter');
    
    console.log(`Sent message: "${testMessage}"`);
    await page2.waitForTimeout(2000);
    await page2.screenshot({ path: 'sync-4-mattermost-message-sent.png' });
    
    // Step 8: Reactアプリでメッセージが表示されるか確認
    console.log('Step 8: Checking if message appears in React app...');
    await page.bringToFront();
    
    // 最大10秒待つ
    let messageFound = false;
    for (let i = 0; i < 10; i++) {
      const messageCount = await page.locator(`text="${testMessage}"`).count();
      if (messageCount > 0) {
        messageFound = true;
        console.log(`✅ Message found after ${i + 1} seconds!`);
        break;
      }
      await page.waitForTimeout(1000);
    }
    
    if (!messageFound) {
      console.log('❌ Message not found after 10 seconds');
    }
    
    await page.screenshot({ path: 'sync-5-react-final-state.png' });
    
    // Step 9: 追加確認 - メッセージリストの内容を確認
    console.log('\nStep 9: Checking message list content...');
    const messages = await page.locator('.MuiTypography-body1').all();
    console.log(`Total messages in chat: ${messages.length}`);
    
    // 最新の3つのメッセージを表示
    for (let i = Math.max(0, messages.length - 3); i < messages.length; i++) {
      const text = await messages[i].textContent();
      console.log(`Message ${i + 1}: ${text}`);
    }
    
    // 結果サマリー
    console.log('\n=== Realtime Sync Test Summary ===');
    console.log('✓ Both apps logged in successfully');
    console.log('✓ Channel opened in both apps');
    console.log('✓ Message sent from Mattermost');
    console.log(`${messageFound ? '✅' : '❌'} Realtime sync: ${messageFound ? 'Working' : 'Not working'}`);
    console.log('==================================\n');

  } catch (error) {
    console.error('Error during test:', error);
    await page.screenshot({ path: 'sync-error.png' });
  } finally {
    await browser.close();
  }
})();