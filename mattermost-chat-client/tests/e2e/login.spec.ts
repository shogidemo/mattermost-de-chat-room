import { test, expect } from '@playwright/test';

test.describe('ログイン機能', () => {
  test('ログイン画面が正しく表示される', async ({ page }) => {
    await page.goto('/');

    // ログインフォームの要素が存在することを確認
    await expect(page.getByRole('heading', { name: 'Mattermost チャット' })).toBeVisible();
    await expect(page.getByLabel('ユーザー名またはメールアドレス')).toBeVisible();
    await expect(page.getByLabel('パスワード')).toBeVisible();
    await expect(page.getByRole('button', { name: 'ログイン' })).toBeVisible();
  });

  test('空の入力でログインボタンが無効化される', async ({ page }) => {
    await page.goto('/');

    const loginButton = page.getByRole('button', { name: 'ログイン' });
    
    // 初期状態ではボタンが無効
    await expect(loginButton).toBeDisabled();

    // ユーザー名のみ入力
    await page.getByLabel('ユーザー名またはメールアドレス').fill('test');
    await expect(loginButton).toBeDisabled();

    // パスワードのみ入力（ユーザー名をクリア）
    await page.getByLabel('ユーザー名またはメールアドレス').clear();
    await page.getByLabel('パスワード').fill('password');
    await expect(loginButton).toBeDisabled();

    // 両方入力
    await page.getByLabel('ユーザー名またはメールアドレス').fill('test');
    await expect(loginButton).toBeEnabled();
  });

  test('無効な認証情報でログインエラーが表示される', async ({ page }) => {
    await page.goto('/');

    // 無効な認証情報を入力
    await page.getByLabel('ユーザー名またはメールアドレス').fill('invalid-user');
    await page.getByLabel('パスワード').fill('invalid-password');
    
    // ログインボタンをクリック
    await page.getByRole('button', { name: 'ログイン' }).click();

    // エラーメッセージが表示されることを確認
    // 注意: Mattermostサーバーが起動していない場合はネットワークエラーになる
    await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 10000 });
  });

  test('Enterキーでログインが実行される', async ({ page }) => {
    await page.goto('/');

    await page.getByLabel('ユーザー名またはメールアドレス').fill('test-user');
    await page.getByLabel('パスワード').fill('test-password');
    
    // パスワードフィールドでEnterキーを押す
    await page.getByLabel('パスワード').press('Enter');

    // ローディング状態またはエラー状態になることを確認
    await expect(
      page.locator('text=ログイン中...').or(page.locator('[role="alert"]'))
    ).toBeVisible({ timeout: 5000 });
  });
});