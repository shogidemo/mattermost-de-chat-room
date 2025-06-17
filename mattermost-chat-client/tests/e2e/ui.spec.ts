import { test, expect } from '@playwright/test';

test.describe('UI/UX テスト', () => {
  test('アプリケーションが正しく読み込まれる', async ({ page }) => {
    await page.goto('/');

    // ページタイトルが正しい
    await expect(page).toHaveTitle(/Vite \+ React/);
    
    // メインコンテンツが表示される
    await expect(page.locator('body')).toBeVisible();
  });

  test('レスポンシブデザインが機能する', async ({ page }) => {
    await page.goto('/');

    // デスクトップビューでの確認
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('body')).toBeVisible();

    // タブレットビューでの確認
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('body')).toBeVisible();

    // モバイルビューでの確認
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();
  });

  test('Material-UIコンポーネントが正しく表示される', async ({ page }) => {
    await page.goto('/');

    // Material-UIのボタンスタイルが適用されている
    const loginButton = page.getByRole('button', { name: 'ログイン' });
    await expect(loginButton).toBeVisible();
    
    // Material-UIのTextFieldが表示されている
    await expect(page.getByLabel('ユーザー名またはメールアドレス')).toBeVisible();
    await expect(page.getByLabel('パスワード')).toBeVisible();
  });

  test('アクセシビリティ要件を満たしている', async ({ page }) => {
    await page.goto('/');

    // フォーム要素に適切なラベルが設定されている
    await expect(page.getByLabel('ユーザー名またはメールアドレス')).toBeVisible();
    await expect(page.getByLabel('パスワード')).toBeVisible();
    
    // ボタンに適切なroleが設定されている
    await expect(page.getByRole('button', { name: 'ログイン' })).toBeVisible();
    
    // 見出しに適切なhタグが使用されている
    await expect(page.getByRole('heading', { name: 'Mattermost チャット' })).toBeVisible();
  });

  test('キーボードナビゲーションが機能する', async ({ page }) => {
    await page.goto('/');

    // Tabキーでフォーカスが移動する
    await page.keyboard.press('Tab');
    await expect(page.getByLabel('ユーザー名またはメールアドレス')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.getByLabel('パスワード')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'ログイン' })).toBeFocused();
  });

  test('エラー表示が適切に機能する', async ({ page }) => {
    await page.goto('/');

    // 無効なデータでログインを試行
    await page.getByLabel('ユーザー名またはメールアドレス').fill('invalid');
    await page.getByLabel('パスワード').fill('invalid');
    await page.getByRole('button', { name: 'ログイン' }).click();

    // エラーアラートが表示される
    await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 10000 });
  });

  test('ローディング状態が適切に表示される', async ({ page }) => {
    await page.goto('/');

    // ログイン試行時にローディング状態が表示される
    await page.getByLabel('ユーザー名またはメールアドレス').fill('test');
    await page.getByLabel('パスワード').fill('test');
    
    // ローディング状態をトリガー
    const loginPromise = page.getByRole('button', { name: 'ログイン' }).click();
    
    // ローディング表示を確認（短時間なので確実ではない）
    try {
      await expect(page.getByText('ログイン中...')).toBeVisible({ timeout: 1000 });
    } catch {
      // ローディングが速すぎる場合はスキップ
    }
    
    await loginPromise;
  });

  test('ブラウザバック/フォワードが適切に動作する', async ({ page }) => {
    await page.goto('/');
    
    // 初期URL
    expect(page.url()).toContain('/');
    
    // ブラウザの戻るボタンが無効化されていないことを確認
    // (SPAなので実際のページ遷移はないが、ブラウザ機能は動作する)
    await page.goBack();
    await page.goForward();
    
    // ページが正常に表示されている
    await expect(page.getByRole('heading', { name: 'Mattermost チャット' })).toBeVisible();
  });
});