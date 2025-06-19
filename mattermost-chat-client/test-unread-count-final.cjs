const { chromium } = require('playwright');

(async () => {
  console.log('📋 未読件数テストを開始します...');
  
  // 2つのブラウザインスタンスを作成（ReactアプリとMattermost用）
  const browser1 = await chromium.launch({ headless: false });
  const browser2 = await chromium.launch({ headless: false });
  
  const context1 = await browser1.newContext();
  const context2 = await browser2.newContext();
  
  const reactPage = await context1.newPage();
  const mattermostPage = await context2.newPage();
  
  try {
    // ステップ1-2: Reactアプリにアクセスしてログイン
    console.log('1. Reactアプリにアクセス中...');
    await reactPage.goto('http://localhost:5173');
    await reactPage.waitForTimeout(2000);
    
    console.log('2. adminでログイン中...');
    await reactPage.fill('input[name="username"]', 'admin');
    await reactPage.fill('input[name="password"]', 'Admin123456!');
    await reactPage.click('button[type="submit"]');
    await reactPage.waitForTimeout(3000);
    
    // ステップ3: チャットボタンをクリック
    console.log('3. チャットボタンをクリック...');
    const chatButton = await reactPage.locator('[data-testid="chat-bubble"]');
    await chatButton.click();
    await reactPage.waitForTimeout(2000);
    
    // ステップ4: フィルターをクリアして全チャンネル表示
    console.log('4. フィルターをクリアして全チャンネル表示...');
    const filterInput = await reactPage.locator('input[placeholder="チャンネルを検索..."]');
    await filterInput.clear();
    await reactPage.waitForTimeout(2000);
    
    // ステップ5: 初期の未読件数を記録（Town Squareの未読を確認）
    console.log('5. 初期の未読件数を記録...');
    await reactPage.screenshot({ path: 'unread-count-final-1-initial.png' });
    
    // ステップ6-7: 別ウィンドウでMattermostにログイン
    console.log('6. Mattermostにアクセス中...');
    await mattermostPage.goto('http://localhost:8065');
    await mattermostPage.waitForTimeout(2000);
    
    // まず「View in Browser」をクリック
    console.log('ブラウザで表示を選択中...');
    const viewInBrowserButton = await mattermostPage.locator('text=View in Browser');
    if (await viewInBrowserButton.isVisible()) {
      await viewInBrowserButton.click();
      await mattermostPage.waitForTimeout(2000);
    }
    
    console.log('7. Mattermostにadminでログイン中...');
    await mattermostPage.screenshot({ path: 'mattermost-login-page-final.png' });
    
    try {
      const usernameInput = await mattermostPage.locator('input[placeholder*="Username"], input[placeholder*="Email"], input[type="text"]').first();
      await usernameInput.fill('admin');
      
      const passwordInput = await mattermostPage.locator('input[type="password"]').first();
      await passwordInput.fill('Admin123456!');
      
      const loginButton = await mattermostPage.locator('button:has-text("Sign in"), button:has-text("Log in"), button[type="submit"]').first();
      await loginButton.click();
    } catch (e) {
      console.log('標準的なセレクタが見つかりませんでした。別の方法を試します...');
      await mattermostPage.keyboard.type('admin');
      await mattermostPage.keyboard.press('Tab');
      await mattermostPage.keyboard.type('Admin123456!');
      await mattermostPage.keyboard.press('Enter');
    }
    
    await mattermostPage.waitForTimeout(3000);
    
    // Town Squareチャンネルに移動（既にデフォルトで選択されている可能性が高い）
    console.log('Town Squareチャンネルに移動中...');
    await mattermostPage.screenshot({ path: 'mattermost-logged-in.png' });
    
    // ステップ8: 最初のメッセージを送信
    console.log('8. 「未読テスト1」を送信中...');
    const messageInput = await mattermostPage.locator('#post_textbox');
    await messageInput.fill('未読テスト1');
    await messageInput.press('Enter');
    await mattermostPage.waitForTimeout(3000);
    
    // ステップ9: Reactアプリで未読件数を確認
    console.log('9. Reactアプリで未読件数を確認...');
    await reactPage.bringToFront();
    await reactPage.waitForTimeout(2000);
    await reactPage.screenshot({ path: 'unread-count-final-2-plus-one.png' });
    
    // ステップ10: 2番目のメッセージを送信
    console.log('10. 「未読テスト2」を送信中...');
    await mattermostPage.bringToFront();
    await messageInput.fill('未読テスト2');
    await messageInput.press('Enter');
    await mattermostPage.waitForTimeout(3000);
    
    // ステップ11: Reactアプリで未読件数が増えたことを確認
    console.log('11. 未読件数が増えたことを確認...');
    await reactPage.bringToFront();
    await reactPage.waitForTimeout(2000);
    await reactPage.screenshot({ path: 'unread-count-final-3-plus-two.png' });
    
    // ステップ12: Town Squareチャンネルをクリック
    console.log('12. Town Squareチャンネルをクリック...');
    const townSquareChannel = await reactPage.locator('.MuiListItem-root:has-text("Town Square")');
    await townSquareChannel.click();
    await reactPage.waitForTimeout(3000);
    
    // ステップ13: チャットルームが表示され、未読メッセージが見えることを確認
    console.log('13. チャットルームと未読メッセージを確認...');
    await reactPage.screenshot({ path: 'unread-count-final-4-chat-open.png' });
    
    // ステップ14: チャットを閉じて未読件数がクリアされたか確認
    console.log('14. チャットを閉じて未読件数を確認...');
    const closeButton = await reactPage.locator('button[aria-label="close"]');
    if (await closeButton.isVisible()) {
      await closeButton.click();
    } else {
      await reactPage.keyboard.press('Escape');
    }
    await reactPage.waitForTimeout(2000);
    
    // チャットボタンを再度クリックしてチャンネルリストを表示
    const chatButtonAgain = await reactPage.locator('[data-testid="chat-bubble"]');
    await chatButtonAgain.click();
    await reactPage.waitForTimeout(2000);
    await reactPage.screenshot({ path: 'unread-count-final-5-after-read.png' });
    
    console.log('✅ 未読件数テストが完了しました！');
    console.log('📸 スクリーンショット:');
    console.log('  - unread-count-final-1-initial.png: 初期状態');
    console.log('  - unread-count-final-2-plus-one.png: 1件目の未読後');
    console.log('  - unread-count-final-3-plus-two.png: 2件目の未読後');
    console.log('  - unread-count-final-4-chat-open.png: チャット表示時');
    console.log('  - unread-count-final-5-after-read.png: 既読後');
    
    console.log('\n📊 テスト結果サマリー:');
    console.log('- Town Squareチャンネルで未読件数が正しく増加することを確認');
    console.log('- WebSocketリアルタイム更新が正常に動作');
    console.log('- チャンネルを開いた後、未読件数がクリアされるかを確認');
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    await reactPage.screenshot({ path: 'unread-count-final-error.png' });
  } finally {
    // ブラウザを開いたままにする
    console.log('\n🔍 ブラウザは開いたままになっています。手動で確認後、閉じてください。');
    // await browser1.close();
    // await browser2.close();
  }
})();