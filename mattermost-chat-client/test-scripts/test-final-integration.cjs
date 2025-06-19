const { chromium } = require('playwright');

async function testFinalIntegration() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  
  // Reactアプリのページを開く
  const page = await context.newPage();
  await page.goto('http://localhost:5173');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // 1. ログイン画面のスクリーンショット
  await page.screenshot({ path: 'final-test-1-login.png' });
  console.log('✅ ログイン画面のスクリーンショットを保存しました');
  
  // 2. ログイン実行
  await page.fill('input[name="username"]', 'admin');
  await page.fill('input[name="password"]', 'Admin123456!');
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  // メイン画面のスクリーンショット
  await page.screenshot({ path: 'final-test-2-main.png' });
  console.log('✅ メイン画面のスクリーンショットを保存しました');
  
  // 3. 右下の青いチャットボタンをクリック
  const chatButton = page.locator('[data-testid="chat-bubble"]');
  await chatButton.click();
  await page.waitForTimeout(2000);
  
  // 4. チャンネルリストのスクリーンショット
  await page.screenshot({ path: 'final-test-3-channel-list.png' });
  console.log('✅ チャンネルリストのスクリーンショットを保存しました');
  
  // フィルターをクリア（デフォルトで「佐藤」が入っているため）
  const filterInput = page.locator('input[placeholder*="チャンネルを検索"]');
  if (await filterInput.isVisible()) {
    // クリアボタンをクリックするか、フィルターを空にする
    const clearButton = page.locator('button[aria-label="Clear"]');
    if (await clearButton.isVisible()) {
      await clearButton.click();
    } else {
      await filterInput.clear();
    }
    await page.waitForTimeout(1000);
  }
  
  // チャンネルが表示されているか確認（表示されているチャンネルをログ出力）
  const channelElements = await page.locator('[role="listitem"]').all();
  console.log(`表示されているチャンネル数: ${channelElements.length}`);
  
  // 実際に表示されているチャンネル名を取得
  const visibleChannels = [];
  for (const element of channelElements) {
    const text = await element.textContent();
    if (text) {
      console.log(`- ${text}`);
      visibleChannels.push(text);
    }
  }
  
  // 5. 最初のチャンネルをクリック（佐藤チャンネル1）
  if (channelElements.length > 0) {
    await channelElements[0].click();
    await page.waitForTimeout(2000);
  } else {
    console.log('❌ クリック可能なチャンネルが見つかりません');
  }
  
  // チャット画面のスクリーンショット
  await page.screenshot({ path: 'final-test-4-sales-channel.png' });
  console.log('✅ チャンネルのチャット画面を保存しました');
  
  // 6. メッセージを送信
  const messageInput = page.locator('textarea[placeholder="メッセージを入力..."]');
  await messageInput.fill('テストメッセージ from React App');
  await messageInput.press('Enter');
  await page.waitForTimeout(2000);
  
  // メッセージ送信後のスクリーンショット
  await page.screenshot({ path: 'final-test-5-message-sent.png' });
  console.log('✅ メッセージ送信後のスクリーンショットを保存しました');
  
  // 7. 別のブラウザタブでMattermostを開く
  const mattermostPage = await context.newPage();
  await mattermostPage.goto('http://localhost:8065');
  await mattermostPage.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // Mattermostにログイン（既にログイン済みの場合はスキップされる）
  const loginIdVisible = await mattermostPage.locator('input[id="loginId"]').isVisible();
  if (loginIdVisible) {
    await mattermostPage.fill('input[id="loginId"]', 'admin');
    await mattermostPage.fill('input[id="loginPassword"]', 'Admin123456!');
    await mattermostPage.click('button[type="submit"]');
    await mattermostPage.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
  }
  
  // 佐藤チャンネル1を探してクリック（実際のチャンネル名に合わせて変更）
  const salesChannel = mattermostPage.locator('a:has-text("佐藤チャンネル1")');
  const salesChannelVisible = await salesChannel.isVisible();
  if (salesChannelVisible) {
    await salesChannel.click();
    await page.waitForTimeout(2000);
  } else {
    // 別のセレクタを試す
    const channelLink = mattermostPage.locator('.SidebarChannel:has-text("佐藤チャンネル1")');
    if (await channelLink.isVisible()) {
      await channelLink.click();
      await page.waitForTimeout(2000);
    }
  }
  
  // Mattermost側のスクリーンショット
  await mattermostPage.screenshot({ path: 'final-test-6-mattermost.png' });
  console.log('✅ Mattermost側のスクリーンショットを保存しました');
  
  // 9. Mattermostから返信メッセージを送信
  // 複数のセレクタを試す
  let mattermostInput = null;
  const selectors = [
    'textarea[placeholder*="メッセージを書く"]',
    'div[data-testid="post-create-textbox"]',
    'div[contenteditable="true"]',
    '#post_textbox'
  ];
  
  for (const selector of selectors) {
    const element = mattermostPage.locator(selector).first();
    if (await element.isVisible()) {
      mattermostInput = element;
      break;
    }
  }
  
  if (mattermostInput) {
    await mattermostInput.fill('返信メッセージ from Mattermost');
    await mattermostInput.press('Enter');
    await page.waitForTimeout(2000);
    
    // 返信後のMattermostスクリーンショット
    await mattermostPage.screenshot({ path: 'final-test-7-mattermost-reply.png' });
    console.log('✅ Mattermost返信後のスクリーンショットを保存しました');
  }
  
  // 10. Reactアプリに戻る
  await page.bringToFront();
  await page.waitForTimeout(3000); // WebSocketでメッセージが届くのを待つ
  
  // リアルタイム更新後のスクリーンショット
  await page.screenshot({ path: 'final-test-8-realtime-update.png' });
  console.log('✅ リアルタイム更新後のスクリーンショットを保存しました');
  
  // 11. チャットを閉じて再度開く
  // 閉じるボタンをクリック
  const closeButton = page.locator('button[aria-label="チャットを閉じる"]');
  const closeButtonVisible = await closeButton.isVisible();
  if (closeButtonVisible) {
    await closeButton.click();
    await page.waitForTimeout(1000);
  }
  
  // 再度チャットボタンをクリック
  await chatButton.click();
  await page.waitForTimeout(2000);
  
  // 最終的なチャンネルリストのスクリーンショット
  await page.screenshot({ path: 'final-test-9-final-channel-list.png' });
  console.log('✅ 最終的なチャンネルリストのスクリーンショットを保存しました');
  
  // ブラウザを閉じる
  await browser.close();
  
  console.log('\n✅ すべてのテストが完了しました！');
}

// テストを実行
testFinalIntegration().catch(console.error);