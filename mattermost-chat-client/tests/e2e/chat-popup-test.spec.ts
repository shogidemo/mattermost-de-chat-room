import { test, expect } from '@playwright/test';

test.describe('チャットポップアップ機能', () => {
  test.beforeEach(async ({ page }) => {
    // Reactアプリケーションにアクセス
    await page.goto('http://localhost:5173');
    
    // ログイン画面が表示されるまで待機
    await expect(page.locator('h1')).toContainText('Mattermost チャット');
  });

  test('ログインからチャット送信まで', async ({ page }) => {
    // Step 1: ログイン
    await page.fill('input[name="username"]', 'shogidemo');
    await page.fill('input[name="password"]', 'shogidemo123');
    await page.click('button:has-text("ログイン")');
    
    // メイン画面が表示されるまで待機
    await expect(page.locator('h1')).toContainText('穀物輸入管理システム');
    
    // Step 2: チャットバブルをクリック
    const chatBubble = page.locator('[data-testid="chat-bubble"], .MuiFab-root');
    await expect(chatBubble).toBeVisible();
    await chatBubble.click();
    
    // チャンネルリストポップアップが表示されるまで待機
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('h6:has-text("チャット")')).toBeVisible();
    
    // Step 3: チャンネルを選択
    const firstChannel = page.locator('[role="dialog"] [role="button"]').first();
    await expect(firstChannel).toBeVisible();
    await firstChannel.click();
    
    // チャット画面に切り替わるまで待機
    await expect(page.locator('[role="dialog"] input[placeholder*="メッセージを送信"]')).toBeVisible({ timeout: 10000 });
    
    // Step 4: メッセージを入力して送信
    const messageInput = page.locator('[role="dialog"] input[placeholder*="メッセージを送信"]');
    const testMessage = `テストメッセージ ${Date.now()}`;
    
    await messageInput.fill(testMessage);
    await messageInput.press('Enter');
    
    // メッセージが送信されたことを確認
    // 入力フィールドがクリアされることを確認
    await expect(messageInput).toHaveValue('');
    
    // 送信されたメッセージが表示されることを確認（最大10秒待機）
    await expect(page.locator(`text=${testMessage}`)).toBeVisible({ timeout: 10000 });
    
    console.log('✅ チャット送信テスト成功');
  });

  test('チャンネル選択後にチャット画面が表示される', async ({ page }) => {
    // ログイン
    await page.fill('input[name="username"]', 'shogidemo');
    await page.fill('input[name="password"]', 'shogidemo123');
    await page.click('button:has-text("ログイン")');
    
    await expect(page.locator('h1')).toContainText('穀物輸入管理システム');
    
    // チャットバブルクリック
    await page.locator('.MuiFab-root').click();
    
    // チャンネル選択
    await page.locator('[role="dialog"] [role="button"]').first().click();
    
    // チャット画面の要素が表示されることを確認
    await expect(page.locator('[role="dialog"] input[placeholder*="メッセージを送信"]')).toBeVisible();
    await expect(page.locator('[role="dialog"] button[aria-label="send"]')).toBeVisible();
    
    // 戻るボタンが表示されることを確認
    await expect(page.locator('[role="dialog"] [data-testid="ArrowBackIcon"]')).toBeVisible();
  });
});