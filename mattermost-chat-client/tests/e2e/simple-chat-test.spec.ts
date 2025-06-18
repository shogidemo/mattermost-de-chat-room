import { test, expect } from '@playwright/test';

test.describe('シンプルチャットテスト', () => {
  test('ログインしてメイン画面を表示', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // ログイン画面の確認
    await expect(page.locator('text=Mattermost チャット')).toBeVisible();
    
    // ログイン
    await page.fill('input[name="username"]', 'shogidemo');
    await page.fill('input[name="password"]', 'shogidemo123');
    await page.click('button:has-text("ログイン")');
    
    // メイン画面が表示されることを確認
    await expect(page.locator('text=穀物輸入管理システム')).toBeVisible({ timeout: 10000 });
    
    // チャットバブルが表示されることを確認
    await expect(page.locator('[data-testid="chat-bubble"]')).toBeVisible();
    
    console.log('✅ ログインとメイン画面表示成功');
  });

  test('チャットポップアップが開く', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // ログイン
    await page.fill('input[name="username"]', 'shogidemo');
    await page.fill('input[name="password"]', 'shogidemo123');
    await page.click('button:has-text("ログイン")');
    
    await expect(page.locator('text=穀物輸入管理システム')).toBeVisible({ timeout: 10000 });
    
    // チャットバブルをクリック
    await page.click('[data-testid="chat-bubble"]');
    
    // ポップアップが表示されることを確認
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('text=チャット')).toBeVisible();
    
    // チャンネルリストが表示されることを確認
    await expect(page.locator('text=営業チーム')).toBeVisible();
    
    console.log('✅ チャットポップアップ表示成功');
  });

  test('チャンネル選択してチャット画面を表示', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // ログイン
    await page.fill('input[name="username"]', 'shogidemo');
    await page.fill('input[name="password"]', 'shogidemo123');
    await page.click('button:has-text("ログイン")');
    
    await expect(page.locator('text=穀物輸入管理システム')).toBeVisible({ timeout: 10000 });
    
    // チャットバブルをクリック
    await page.click('[data-testid="chat-bubble"]');
    
    // ポップアップが表示される
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // 営業チームを選択
    await page.click('text=営業チーム');
    
    // チャット画面が表示されることを確認
    await expect(page.locator('input[placeholder*="営業チーム"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="send-button"]')).toBeVisible();
    
    console.log('✅ チャンネル選択とチャット画面表示成功');
  });

  test('メッセージ入力とボタンの状態確認', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // ログイン
    await page.fill('input[name="username"]', 'shogidemo');
    await page.fill('input[name="password"]', 'shogidemo123');
    await page.click('button:has-text("ログイン")');
    
    await expect(page.locator('text=穀物輸入管理システム')).toBeVisible({ timeout: 10000 });
    
    // チャットポップアップを開く
    await page.click('[data-testid="chat-bubble"]');
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // 営業チームを選択
    await page.click('text=営業チーム');
    
    // チャット画面が表示される
    const messageInput = page.locator('input[placeholder*="営業チーム"]');
    await expect(messageInput).toBeVisible({ timeout: 5000 });
    
    const sendButton = page.locator('[data-testid="send-button"]');
    
    // 最初は送信ボタンが無効
    await expect(sendButton).toBeDisabled();
    
    // メッセージを入力
    await messageInput.fill('テストメッセージ');
    
    // 送信ボタンが有効になる
    await expect(sendButton).toBeEnabled();
    
    console.log('✅ メッセージ入力とボタン状態確認成功');
  });
});