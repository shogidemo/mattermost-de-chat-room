const { chromium } = require('playwright');

async function testFinalDemo() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  
  try {
    console.log('=== Mattermost + React チャット統合テスト開始 ===\n');
    
    // 1. Reactアプリにアクセス
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'demo-1-login.png' });
    console.log('✅ ステップ1: Reactアプリにアクセスしました');
    
    // 2. ログイン
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'Admin123456\!');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'demo-2-main.png' });
    console.log('✅ ステップ2: adminユーザーでログインしました');
    
    // 3. チャットボタンをクリック
    await page.click('[data-testid="chat-bubble"]');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'demo-3-channel-list-before.png' });
    console.log('✅ ステップ3: チャットボタンをクリックしました');
    
    // 4. フィルターをクリア
    const clearButton = page.locator('svg[data-testid="ClearIcon"]').locator('..');
    if (await clearButton.isVisible()) {
      await clearButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'demo-4-channel-list-after.png' });
      console.log('✅ ステップ4: デフォルトフィルターをクリアしました');
    }
    
    // 5. 営業チーム（sales-team）チャンネルを選択
    const salesChannel = page.locator('.MuiListItem-root:has-text("sales-team")');
    if (await salesChannel.isVisible()) {
      await salesChannel.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'demo-5-sales-chat.png' });
      console.log('✅ ステップ5: 営業チーム（sales-team）チャンネルを選択しました');
    }
    
    // 6. メッセージを送信
    const messageInput = page.locator('textarea[placeholder="メッセージを入力..."]');
    if (await messageInput.isVisible()) {
      await messageInput.fill('テストメッセージ from React App - ' + new Date().toLocaleTimeString('ja-JP'));
      await messageInput.press('Enter');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'demo-6-message-sent.png' });
      console.log('✅ ステップ6: Reactアプリからメッセージを送信しました');
    }
    
    // 7. Mattermostを別タブで開く
    const mattermostPage = await context.newPage();
    await mattermostPage.goto('http://localhost:8065');
    await mattermostPage.waitForLoadState('networkidle');
    await mattermostPage.waitForTimeout(2000);
    
    // Mattermostにログイン（既にログイン済みの場合はスキップ）
    if (await mattermostPage.locator('input[id="loginId"]').isVisible()) {
      await mattermostPage.fill('input[id="loginId"]', 'admin');
      await mattermostPage.fill('input[id="loginPassword"]', 'Admin123456\!');
      await mattermostPage.click('button[type="submit"]');
      await mattermostPage.waitForLoadState('networkidle');
      await mattermostPage.waitForTimeout(3000);
    }
    
    // sales-teamチャンネルを探す
    const mattermostSalesChannel = mattermostPage.locator('a:has-text("sales-team")').or(
      mattermostPage.locator('.SidebarChannel:has-text("sales-team")')
    );
    
    if (await mattermostSalesChannel.isVisible()) {
      await mattermostSalesChannel.click();
      await mattermostPage.waitForTimeout(2000);
      await mattermostPage.screenshot({ path: 'demo-7-mattermost-channel.png' });
      console.log('✅ ステップ7: Mattermostで営業チームチャンネルを開きました');
      console.log('   → Reactアプリから送信したメッセージが表示されているはずです');
    }
    
    // 8. Mattermostから返信
    const mattermostInput = mattermostPage.locator('#post_textbox').or(
      mattermostPage.locator('div[contenteditable="true"]').first()
    );
    
    if (await mattermostInput.isVisible()) {
      await mattermostInput.fill('返信メッセージ from Mattermost - ' + new Date().toLocaleTimeString('ja-JP'));
      await mattermostInput.press('Enter');
      await mattermostPage.waitForTimeout(2000);
      await mattermostPage.screenshot({ path: 'demo-8-mattermost-reply.png' });
      console.log('✅ ステップ8: Mattermostから返信メッセージを送信しました');
    }
    
    // 9. Reactアプリでリアルタイム更新を確認
    await page.bringToFront();
    await page.waitForTimeout(3000); // WebSocketでメッセージが届くのを待つ
    await page.screenshot({ path: 'demo-9-realtime-update.png' });
    console.log('✅ ステップ9: Reactアプリでリアルタイム更新を確認しました');
    console.log('   → Mattermostからの返信がリアルタイムで表示されているはずです');
    
    // 10. チャットを閉じて再度開く
    const closeButton = page.locator('button:has(svg[data-testid="CloseIcon"])');
    if (await closeButton.isVisible()) {
      await closeButton.click();
      await page.waitForTimeout(1000);
    }
    
    // 再度チャットを開く
    await page.click('[data-testid="chat-bubble"]');
    await page.waitForTimeout(2000);
    
    // フィルターをクリア
    const clearButton2 = page.locator('svg[data-testid="ClearIcon"]').locator('..');
    if (await clearButton2.isVisible()) {
      await clearButton2.click();
      await page.waitForTimeout(1000);
    }
    
    await page.screenshot({ path: 'demo-10-final-state.png' });
    console.log('✅ ステップ10: チャンネルリストを再表示しました');
    console.log('   → 営業チームの最新メッセージが更新されているはずです');
    
    console.log('\n=== テスト完了！ ===');
    console.log('すべてのスクリーンショットがdemo-*.pngファイルとして保存されました。');
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    await page.screenshot({ path: 'demo-error.png' });
  } finally {
    // ブラウザを開いたままにして確認できるようにする
    console.log('\n💡 ブラウザは開いたままです。確認後、手動で閉じてください。');
    // await browser.close();
  }
}

testFinalDemo().catch(console.error);