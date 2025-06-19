import { test, expect } from '@playwright/test';

test.describe('Mattermost チャット機能の包括的テスト', () => {
  const testUser = {
    username: 'admin',
    password: 'Admin123456!'
  };

  test.beforeEach(async ({ page }) => {
    // アプリケーションにアクセス
    await page.goto('http://localhost:5173');
    
    // ログイン処理
    await page.fill('input[name="username"]', testUser.username);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    // ログイン完了を待機
    await page.waitForSelector('text=admin', { timeout: 10000 });
  });

  test('チャットの全機能が正常に動作すること', async ({ page }) => {
    // 1. チャットボタンをクリック
    await page.click('[data-testid="chat-bubble"]');
    await expect(page.locator('.MuiPaper-root')).toBeVisible();

    // 2. チャンネルリストの確認
    const channelList = page.locator('[role="list"]');
    await expect(channelList).toBeVisible();
    
    // フィルターにデフォルト値「佐藤」が入っているか確認
    const filterInput = page.locator('input[placeholder*="チャンネルを検索"]');
    await expect(filterInput).toHaveValue('佐藤');
    
    // 3. フィルターをクリアして全チャンネル表示
    await filterInput.clear();
    
    // 4. チャンネルを選択
    const channelItem = page.locator('li').filter({ hasText: '営業チーム' }).first();
    await channelItem.click();
    
    // 5. メッセージ入力欄の確認
    const messageInput = page.locator('textarea[data-testid="message-input"]');
    await expect(messageInput).toBeEnabled();
    await expect(messageInput).toBeVisible();
    
    // 6. メッセージを入力
    const testMessage = `テストメッセージ ${new Date().toLocaleTimeString('ja-JP')}`;
    await messageInput.fill(testMessage);
    
    // 7. 送信ボタンの確認
    const sendButton = page.locator('button[aria-label="send"]');
    await expect(sendButton).toBeEnabled();
    
    // 8. メッセージを送信
    await sendButton.click();
    
    // 9. 入力欄がクリアされたか確認
    await expect(messageInput).toHaveValue('');
    
    // 10. 送信したメッセージが表示されるか確認
    await expect(page.locator('text=' + testMessage)).toBeVisible({ timeout: 5000 });
  });

  test('5つのUI機能が正しく実装されていること', async ({ page }) => {
    await page.click('[data-testid="chat-bubble"]');
    
    // 1. ユーザー名表示（IDではなく）
    const channelWithPreview = page.locator('li').first();
    const userInfo = await channelWithPreview.textContent();
    expect(userInfo).not.toMatch(/^[a-z0-9]{26}$/); // MattermostのユーザーID形式でないこと
    
    // 2. 最新メッセージプレビュー表示
    await expect(channelWithPreview.locator('text=/.*:.*/')).toBeVisible();
    
    // 3. 未読数バッジ表示
    const unreadBadge = page.locator('.MuiBadge-badge').first();
    if (await unreadBadge.isVisible()) {
      const unreadCount = await unreadBadge.textContent();
      expect(parseInt(unreadCount || '0')).toBeGreaterThan(0);
    }
    
    // 4. 最近のアクティビティ順でソート（時刻表示で確認）
    const timestamps = await page.locator('li time').allTextContents();
    expect(timestamps.length).toBeGreaterThan(0);
    
    // 5. チャンネルフィルター機能
    const filterInput = page.locator('input[placeholder*="チャンネルを検索"]');
    await expect(filterInput).toHaveValue('佐藤');
    
    // フィルターが機能することを確認
    await filterInput.clear();
    await filterInput.fill('営業');
    await expect(page.locator('li').filter({ hasText: '営業' })).toBeVisible();
  });

  test('エラー状態とエッジケースの処理', async ({ page }) => {
    await page.click('[data-testid="chat-bubble"]');
    
    // 空メッセージの送信を防ぐ
    const messageInput = page.locator('textarea[data-testid="message-input"]');
    const sendButton = page.locator('button[aria-label="send"]');
    
    await messageInput.fill('   '); // 空白のみ
    await expect(sendButton).toBeDisabled();
    
    // 長いメッセージの処理
    const longMessage = 'あ'.repeat(1000);
    await messageInput.fill(longMessage);
    await expect(sendButton).toBeEnabled();
    
    // Shift+Enterで改行（送信しない）
    await messageInput.clear();
    await messageInput.fill('行1');
    await messageInput.press('Shift+Enter');
    await messageInput.type('行2');
    const multilineText = await messageInput.inputValue();
    expect(multilineText).toContain('\n');
  });
});

test.describe('WebSocket リアルタイム機能', () => {
  test('接続状態が正しく表示されること', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // ログイン
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'Admin123456!');
    await page.click('button[type="submit"]');
    await page.waitForSelector('text=admin');
    
    // チャットを開く
    await page.click('[data-testid="chat-bubble"]');
    
    // チャンネルを選択
    await page.locator('li').first().click();
    
    // 接続状態の表示を確認
    const connectionStatus = page.locator('text=/接続状態.*オンライン|オフライン/');
    await expect(connectionStatus).toBeVisible();
  });
});