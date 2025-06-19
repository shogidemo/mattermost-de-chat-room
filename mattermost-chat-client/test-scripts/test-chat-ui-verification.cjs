const { chromium } = require('playwright');
const path = require('path');

(async () => {
  // Chromiumブラウザを起動
  const browser = await chromium.launch({
    headless: false, // ヘッドレスモードを無効にして視覚的に確認
    slowMo: 1000 // 各アクションの間に1秒の遅延を追加
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  // React アプリ用のページ
  const reactPage = await context.newPage();

  console.log('Step 1: React アプリにアクセス');
  await reactPage.goto('http://localhost:5173');
  await reactPage.waitForLoadState('networkidle');
  await reactPage.screenshot({ path: 'step1-react-app-loaded.png', fullPage: true });

  console.log('Step 2: admin/Admin123456! でログイン');
  // ログインフォームの入力
  await reactPage.fill('input[name="username"]', 'admin');
  await reactPage.fill('input[name="password"]', 'Admin123456!');
  await reactPage.click('button[type="submit"]');
  
  // ログイン後の画面を待機
  await reactPage.waitForTimeout(3000);
  await reactPage.screenshot({ path: 'step2-after-login.png', fullPage: true });

  console.log('Step 3: 右下の青いチャットボタンをクリック');
  // チャットボタンを探してクリック
  const chatButton = await reactPage.locator('[data-testid="chat-bubble"]');
  await chatButton.click();
  await reactPage.waitForTimeout(2000);
  await reactPage.screenshot({ path: 'step3-chat-opened.png', fullPage: true });

  console.log('Step 4: チャンネルリストのスクリーンショットを撮影');
  // チャンネルリストの確認
  await reactPage.waitForTimeout(2000);
  
  // 最新メッセージのプレビューが表示されているか確認
  const channelItems = await reactPage.locator('.MuiListItem-root').count();
  console.log(`チャンネル数: ${channelItems}`);
  
  // 「パブリックチャネル」という文字列が表示されているか確認
  const publicChannelText = await reactPage.locator('text=パブリックチャネル').count();
  console.log(`「パブリックチャネル」の表示: ${publicChannelText > 0 ? 'あり' : 'なし'}`);
  
  await reactPage.screenshot({ path: 'step4-channel-list-detail.png', fullPage: true });

  console.log('Step 5: チャンネルをクリック（佐藤チャンネル1）');
  // 佐藤チャンネル1を探してクリック
  try {
    await reactPage.click('text=佐藤チャンネル1');
    await reactPage.waitForTimeout(2000);
    await reactPage.screenshot({ path: 'step5-sato-channel-opened.png', fullPage: true });
  } catch (error) {
    console.error('佐藤チャンネル1が見つかりません:', error);
    await reactPage.screenshot({ path: 'step5-error-no-sato-channel.png', fullPage: true });
  }

  console.log('Step 6: 別のブラウザウィンドウで Mattermost を開く');
  // Mattermost 用の新しいページ
  const mattermostPage = await context.newPage();
  await mattermostPage.goto('http://localhost:8065');
  await mattermostPage.waitForLoadState('networkidle');
  await mattermostPage.screenshot({ path: 'step6-mattermost-opened.png', fullPage: true });

  console.log('Step 7: Mattermostにログイン');
  try {
    // ログインフォームを待機
    await mattermostPage.waitForSelector('input[id="loginId"]', { timeout: 5000 });
    await mattermostPage.fill('input[id="loginId"]', 'admin');
    await mattermostPage.fill('input[id="loginPassword"]', 'Admin123456!');
    await mattermostPage.click('button[id="loginButton"]');
    
    // ログイン後の画面を待機
    await mattermostPage.waitForTimeout(5000);
    await mattermostPage.screenshot({ path: 'step7-mattermost-logged-in.png', fullPage: true });
  } catch (error) {
    console.log('既にログイン済みの可能性があります');
    await mattermostPage.screenshot({ path: 'step7-mattermost-already-logged-in.png', fullPage: true });
  }

  console.log('Step 8: 佐藤チャンネル1でメッセージを送信');
  try {
    // 佐藤チャンネル1を探す
    const channelLink = await mattermostPage.locator('a:has-text("佐藤チャンネル1")').first();
    if (await channelLink.count() > 0) {
      await channelLink.click();
      await mattermostPage.waitForTimeout(2000);
    }
    
    // メッセージ入力エリアを探す
    const messageInput = await mattermostPage.locator('textarea[data-testid="post_textbox"]').or(mattermostPage.locator('#post_textbox'));
    await messageInput.fill('テストメッセージ from Mattermost');
    await messageInput.press('Enter');
    
    await mattermostPage.waitForTimeout(2000);
    await mattermostPage.screenshot({ path: 'step8-message-sent-in-mattermost.png', fullPage: true });
  } catch (error) {
    console.error('メッセージ送信エラー:', error);
    await mattermostPage.screenshot({ path: 'step8-error-sending-message.png', fullPage: true });
  }

  console.log('Step 9: Reactアプリでリアルタイム更新を確認');
  // Reactアプリに戻る
  await reactPage.bringToFront();
  await reactPage.waitForTimeout(3000); // WebSocketの更新を待つ
  
  // メッセージが表示されているか確認
  const newMessage = await reactPage.locator('text=テストメッセージ from Mattermost').count();
  console.log(`新しいメッセージの表示: ${newMessage > 0 ? 'あり' : 'なし'}`);
  
  await reactPage.screenshot({ path: 'step9-realtime-update-check.png', fullPage: true });

  console.log('Step 10: チャットを閉じて再度開き、最新メッセージを確認');
  // チャットを閉じる
  const closeButton = await reactPage.locator('[aria-label="close"]').or(reactPage.locator('button:has(svg[data-testid="CloseIcon"])'));
  if (await closeButton.count() > 0) {
    await closeButton.first().click();
    await reactPage.waitForTimeout(2000);
  }
  
  // チャットを再度開く
  await reactPage.click('[data-testid="chat-bubble"]');
  await reactPage.waitForTimeout(2000);
  
  // チャンネルリストで最新メッセージを確認
  const latestMessagePreview = await reactPage.locator('text=テストメッセージ from Mattermost').count();
  console.log(`チャンネルリストの最新メッセージプレビュー: ${latestMessagePreview > 0 ? 'あり' : 'なし'}`);
  
  await reactPage.screenshot({ path: 'step10-channel-list-with-latest-message.png', fullPage: true });

  // 追加のデバッグ情報を収集
  console.log('\n=== デバッグ情報 ===');
  
  // チャンネルリストの内容を詳しく調査
  const channelListItems = await reactPage.locator('.MuiListItem-root').all();
  console.log(`チャンネル数: ${channelListItems.length}`);
  
  for (let i = 0; i < channelListItems.length; i++) {
    const channelText = await channelListItems[i].textContent();
    console.log(`チャンネル ${i + 1}: ${channelText}`);
  }

  // 最終的な状態のスクリーンショット
  await reactPage.screenshot({ path: 'final-state-react-app.png', fullPage: true });
  await mattermostPage.screenshot({ path: 'final-state-mattermost.png', fullPage: true });

  console.log('\nテスト完了しました。スクリーンショットを確認してください。');

  // ブラウザを閉じる
  await browser.close();
})();