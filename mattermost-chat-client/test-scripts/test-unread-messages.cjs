const { chromium } = require('playwright');
const path = require('path');

(async () => {
  console.log('🚀 未読メッセージテストを開始します...');
  
  // ブラウザとコンテキストを起動
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  // メインページ（Reactアプリ）
  const page = await context.newPage();
  
  try {
    // テスト1: 未読件数のカウント
    console.log('\n📋 テスト1: 未読件数のカウント');
    
    // 1. Reactアプリにアクセスしてログイン
    console.log('1. http://localhost:5173 にアクセス');
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(2000);
    
    // ログインフォームに入力
    console.log('2. admin/Admin123456!でログイン');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'Admin123456!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // 2. チャットボタンをクリック
    console.log('3. 右下の青いチャットボタンをクリック');
    await page.click('[data-testid="chat-bubble"]');
    await page.waitForTimeout(2000);
    
    // 3. 現在の未読件数を確認
    console.log('4. 営業チームチャンネルの現在の未読件数を確認');
    await page.screenshot({ path: 'unread-test-1-initial.png', fullPage: true });
    
    // 4. 別のブラウザタブでMattermostを開く
    console.log('5. 別のタブでMattermostを開く');
    const mattermostPage = await context.newPage();
    await mattermostPage.goto('http://localhost:8065');
    await mattermostPage.waitForTimeout(2000);
    
    // 既にログインしている場合はチャンネルページに遷移する
    const isLoggedIn = await mattermostPage.url().includes('/channels/');
    
    if (!isLoggedIn) {
      console.log('6. Mattermostにログイン');
      await mattermostPage.fill('#input_loginId', 'admin');
      await mattermostPage.fill('#input_password-input', 'Admin123456!');
      await mattermostPage.click('#saveSetting');
      await mattermostPage.waitForTimeout(3000);
    }
    
    // 営業チームチャンネルに移動
    console.log('7. 営業チームチャンネルに移動');
    try {
      // サイドバーから営業チームチャンネルを探してクリック
      await mattermostPage.click('text=営業チーム');
      await mattermostPage.waitForTimeout(2000);
    } catch (error) {
      console.log('営業チームチャンネルが見つからない場合は作成が必要です');
    }
    
    // 6. メッセージを送信
    console.log('8. メッセージを送信');
    const messageInput = await mattermostPage.locator('#post_textbox');
    await messageInput.fill('テストメッセージ1 - 未読カウント確認用');
    await messageInput.press('Enter');
    await mattermostPage.waitForTimeout(2000);
    
    // 7. Reactアプリに戻って未読件数を確認
    console.log('9. Reactアプリに戻って未読件数を確認');
    await page.bringToFront();
    await page.waitForTimeout(3000); // WebSocketでメッセージが届くのを待つ
    await page.screenshot({ path: 'unread-test-2-one-message.png', fullPage: true });
    
    // 8. もう1つメッセージを送信
    console.log('10. もう1つメッセージを送信');
    await mattermostPage.bringToFront();
    await messageInput.fill('テストメッセージ2 - 未読カウント確認用');
    await messageInput.press('Enter');
    await mattermostPage.waitForTimeout(2000);
    
    // 9. 合計2件の未読を確認
    console.log('11. 合計2件の未読を確認');
    await page.bringToFront();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'unread-test-3-two-messages.png', fullPage: true });
    
    // テスト2: チャンネルクリックでチャット開く
    console.log('\n📋 テスト2: チャンネルクリックでチャット開く');
    
    // 1. チャンネルリストから営業チームをクリック
    console.log('1. チャンネルリストから営業チームをクリック');
    await page.screenshot({ path: 'channel-click-1-before.png', fullPage: true });
    
    try {
      // チャンネルリスト内の営業チームを探してクリック
      const channelListItem = await page.locator('text=営業チーム').first();
      await channelListItem.click();
      await page.waitForTimeout(2000);
    } catch (error) {
      console.log('営業チームチャンネルをクリックできませんでした');
    }
    
    // 2. チャットルームが開くことを確認
    console.log('2. チャットルームが開くことを確認');
    await page.screenshot({ path: 'channel-click-2-after.png', fullPage: true });
    
    // テスト3: メッセージ送信
    console.log('\n📋 テスト3: メッセージ送信');
    
    // 1. メッセージを入力
    console.log('1. メッセージを入力');
    const chatInput = await page.locator('input[placeholder*="メッセージ"]').first();
    await chatInput.fill('Reactアプリからのテストメッセージ');
    await page.screenshot({ path: 'send-test-1-typing.png', fullPage: true });
    
    // 2. 送信
    console.log('2. メッセージを送信');
    await chatInput.press('Enter');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'send-test-2-sent.png', fullPage: true });
    
    // テスト4: 他ユーザーへの表示
    console.log('\n📋 テスト4: 他ユーザーへの表示');
    
    // 1. Mattermostタブに切り替え
    console.log('1. Mattermostタブに切り替え');
    await mattermostPage.bringToFront();
    await mattermostPage.waitForTimeout(2000);
    
    // 2. メッセージが表示されていることを確認
    console.log('2. Reactアプリから送信したメッセージを確認');
    await mattermostPage.screenshot({ path: 'cross-user-test.png', fullPage: true });
    
    console.log('\n✅ すべてのテストが完了しました！');
    
  } catch (error) {
    console.error('❌ テスト中にエラーが発生しました:', error);
    await page.screenshot({ path: 'test-error.png', fullPage: true });
  } finally {
    // ブラウザを閉じる
    await browser.close();
    console.log('\n🔚 テストを終了しました');
  }
})();