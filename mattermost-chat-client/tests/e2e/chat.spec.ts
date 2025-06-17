import { test, expect } from '@playwright/test';

// このテストは実際のMattermostサーバーが必要です
// 統合テスト用にスキップするか、モックサーバーを使用してください
test.describe.skip('チャット機能', () => {
  test.beforeEach(async ({ page }) => {
    // テスト用ユーザーでログイン
    // 注意: 実際のテストでは適切なテストユーザーを作成してください
    await page.goto('/');
    await page.getByLabel('ユーザー名またはメールアドレス').fill('test-user');
    await page.getByLabel('パスワード').fill('test-password');
    await page.getByRole('button', { name: 'ログイン' }).click();
    
    // ログイン完了を待機
    await expect(page.getByText('Mattermost チャット')).toBeVisible();
  });

  test('チャット画面が正しく表示される', async ({ page }) => {
    // ヘッダーが表示されている
    await expect(page.getByRole('banner')).toBeVisible();
    
    // チャンネルリストが表示されている（デスクトップの場合）
    await expect(page.locator('[data-testid="channel-list"]')).toBeVisible();
    
    // チャットエリアが表示されている
    await expect(page.locator('[data-testid="chat-view"]')).toBeVisible();
    
    // メッセージ入力欄が表示されている
    await expect(page.getByPlaceholder(/メッセージを入力/)).toBeVisible();
  });

  test('チャンネルを選択してメッセージを送信できる', async ({ page }) => {
    // チャンネルを選択
    await page.locator('[data-testid="channel-item"]').first().click();
    
    // メッセージを入力
    const messageInput = page.getByPlaceholder(/メッセージを入力/);
    const testMessage = `テストメッセージ ${Date.now()}`;
    await messageInput.fill(testMessage);
    
    // メッセージを送信
    await page.getByRole('button', { name: '送信' }).click();
    
    // メッセージが送信されたことを確認
    await expect(messageInput).toHaveValue('');
    
    // 送信されたメッセージが表示されることを確認
    await expect(page.getByText(testMessage)).toBeVisible({ timeout: 5000 });
  });

  test('Enterキーでメッセージを送信できる', async ({ page }) => {
    // チャンネルを選択
    await page.locator('[data-testid="channel-item"]').first().click();
    
    // メッセージを入力してEnterで送信
    const messageInput = page.getByPlaceholder(/メッセージを入力/);
    const testMessage = `Enterキーテスト ${Date.now()}`;
    await messageInput.fill(testMessage);
    await messageInput.press('Enter');
    
    // メッセージが送信されたことを確認
    await expect(messageInput).toHaveValue('');
    await expect(page.getByText(testMessage)).toBeVisible({ timeout: 5000 });
  });

  test('Shift+Enterで改行できる', async ({ page }) => {
    // チャンネルを選択
    await page.locator('[data-testid="channel-item"]').first().click();
    
    // メッセージを入力してShift+Enterで改行
    const messageInput = page.getByPlaceholder(/メッセージを入力/);
    await messageInput.fill('1行目');
    await messageInput.press('Shift+Enter');
    await messageInput.type('2行目');
    
    // メッセージが改行されていることを確認
    await expect(messageInput).toHaveValue('1行目\n2行目');
  });

  test('空のメッセージは送信できない', async ({ page }) => {
    // チャンネルを選択
    await page.locator('[data-testid="channel-item"]').first().click();
    
    // 送信ボタンが無効化されていることを確認
    const sendButton = page.getByRole('button', { name: '送信' });
    await expect(sendButton).toBeDisabled();
    
    // 空白のみのメッセージでも無効
    await page.getByPlaceholder(/メッセージを入力/).fill('   ');
    await expect(sendButton).toBeDisabled();
  });

  test('WebSocket接続状態が表示される', async ({ page }) => {
    // 接続状態インジケーターが表示されている
    await expect(
      page.locator('text=接続中').or(page.locator('text=切断'))
    ).toBeVisible();
  });

  test('ログアウト機能が動作する', async ({ page }) => {
    // ログアウトボタンをクリック
    await page.getByRole('button', { name: 'ログアウト' }).click();
    
    // ログイン画面に戻ることを確認
    await expect(page.getByRole('heading', { name: 'Mattermost チャット' })).toBeVisible();
    await expect(page.getByLabel('ユーザー名またはメールアドレス')).toBeVisible();
  });
});