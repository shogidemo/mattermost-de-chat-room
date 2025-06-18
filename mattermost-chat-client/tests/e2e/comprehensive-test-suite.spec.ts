import { test, expect } from '@playwright/test';

test.describe('Mattermost チャット総合テストスイート', () => {
  
  // 共通のヘルパー関数
  const waitForNetworkIdle = async (page: any) => {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  };

  const performLogin = async (page: any, username = 'admin', password = 'Admin123!') => {
    await page.goto('http://localhost:5173');
    await waitForNetworkIdle(page);
    
    await page.fill('input[autocomplete="username"]', username);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(5000);
    
    // ログイン成功確認
    const isLoggedIn = await page.locator('text=チャンネル').count() > 0 ||
                      await page.locator('text=Town Square').count() > 0 ||
                      await page.locator('textarea[placeholder*="にメッセージを送信"]').count() > 0;
    
    return isLoggedIn;
  };

  const sendMessage = async (page: any, message: string) => {
    const messageInput = page.locator('textarea[placeholder*="にメッセージを送信"]:visible').first();
    
    // JavaScript直接操作でメッセージ入力
    await messageInput.evaluate((element, msg) => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(element, msg);
        const event = new Event('input', { bubbles: true });
        element.dispatchEvent(event);
      }
    }, message);
    
    await page.waitForTimeout(300);
    
    const sendButton = page.locator('[data-testid="send-button"]');
    await sendButton.click();
    
    await page.waitForTimeout(2000);
    
    // メッセージが表示されたか確認
    return await page.locator(`text=${message}`).count() > 0;
  };

  test('基本動作: アプリケーションアクセスとログインフォーム表示', async ({ page }) => {
    console.log('=== 基本動作テスト開始 ===');
    
    await page.goto('http://localhost:5173');
    await waitForNetworkIdle(page);
    
    // ページタイトル確認
    const title = await page.title();
    expect(title).toBe('Vite + React + TS');
    console.log('✅ ページタイトル確認完了');
    
    // ログインフォーム要素確認
    const usernameInput = page.locator('input[autocomplete="username"]');
    const passwordInput = page.locator('input[type="password"]');
    const loginButton = page.locator('button[type="submit"]');
    
    await expect(usernameInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(loginButton).toBeVisible();
    console.log('✅ ログインフォーム表示確認完了');
    
    // 日本語UI確認
    await expect(page.locator('text=Mattermost チャット')).toBeVisible();
    await expect(page.locator('text=アカウントにログインしてチャットを開始')).toBeVisible();
    console.log('✅ 日本語UI表示確認完了');
  });

  test('ログイン機能: 正常なログインフロー', async ({ page }) => {
    console.log('=== ログイン機能テスト開始 ===');
    
    const loginSuccessful = await performLogin(page);
    expect(loginSuccessful).toBe(true);
    console.log('✅ ログイン成功確認完了');
    
    // チャット画面要素確認
    await expect(page.locator('textarea[placeholder*="にメッセージを送信"]')).toBeVisible();
    const townSquareElements = await page.locator('text=Town Square').count();
    expect(townSquareElements).toBeGreaterThan(0);
    console.log('✅ チャット画面表示確認完了');
  });

  test('メッセージ送信機能: 単一メッセージ送信', async ({ page }) => {
    console.log('=== メッセージ送信機能テスト開始 ===');
    
    // ログイン
    const loginSuccessful = await performLogin(page);
    expect(loginSuccessful).toBe(true);
    
    // API呼び出し監視
    const apiRequests: string[] = [];
    page.on('request', request => {
      if (request.url().includes('/api/v4/posts')) {
        apiRequests.push(`${request.method()} ${request.url()}`);
      }
    });
    
    // メッセージ送信
    const testMessage = `テストメッセージ ${new Date().toLocaleTimeString()}`;
    const messageDisplayed = await sendMessage(page, testMessage);
    
    expect(messageDisplayed).toBe(true);
    expect(apiRequests.length).toBeGreaterThan(0);
    console.log('✅ メッセージ送信・表示確認完了');
  });

  test('メッセージ送信機能: 複数メッセージ連続送信', async ({ page }) => {
    console.log('=== 複数メッセージ送信テスト開始 ===');
    
    // ログイン
    const loginSuccessful = await performLogin(page);
    expect(loginSuccessful).toBe(true);
    
    const messages = ['メッセージ1', 'メッセージ2', 'メッセージ3'];
    
    for (const baseMessage of messages) {
      const message = `${baseMessage} - ${new Date().toLocaleTimeString()}`;
      const messageDisplayed = await sendMessage(page, message);
      expect(messageDisplayed).toBe(true);
      console.log(`✅ ${baseMessage} 送信・表示確認完了`);
    }
  });

  test('UI操作: 送信ボタンの状態管理', async ({ page }) => {
    console.log('=== UI操作テスト開始 ===');
    
    // ログイン
    const loginSuccessful = await performLogin(page);
    expect(loginSuccessful).toBe(true);
    
    const messageInput = page.locator('textarea[placeholder*="にメッセージを送信"]:visible').first();
    const sendButton = page.locator('[data-testid="send-button"]');
    
    // 初期状態: 送信ボタンは無効
    await expect(sendButton).toBeDisabled();
    console.log('✅ 初期状態の送信ボタン無効確認完了');
    
    // テキスト入力後: 送信ボタンは有効
    await messageInput.evaluate((element) => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(element, 'テストメッセージ');
        const event = new Event('input', { bubbles: true });
        element.dispatchEvent(event);
      }
    });
    
    await page.waitForTimeout(500);
    await expect(sendButton).toBeEnabled();
    console.log('✅ テキスト入力後の送信ボタン有効確認完了');
  });

  test('認証状態: セッション管理', async ({ page }) => {
    console.log('=== 認証状態テスト開始 ===');
    
    // ログイン
    const loginSuccessful = await performLogin(page);
    expect(loginSuccessful).toBe(true);
    
    // 認証状態確認
    const authState = await page.evaluate(() => {
      return {
        hasToken: !!localStorage.getItem('mattermost_token'),
        hasUser: !!localStorage.getItem('mattermost_user')
      };
    });
    
    expect(authState.hasUser).toBe(true);
    console.log('✅ 認証状態確認完了');
  });

  test('エラーハンドリング: 不正なログイン情報', async ({ page }) => {
    console.log('=== エラーハンドリングテスト開始 ===');
    
    await page.goto('http://localhost:5173');
    await waitForNetworkIdle(page);
    
    // 不正なログイン情報
    await page.fill('input[autocomplete="username"]', 'invalid');
    await page.fill('input[type="password"]', 'invalid');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    
    // エラーメッセージまたはログイン画面が残ることを確認
    const stillOnLoginPage = await page.locator('button[type="submit"]').count() > 0;
    expect(stillOnLoginPage).toBe(true);
    console.log('✅ 不正ログイン時のエラーハンドリング確認完了');
  });

  test('ネットワーク: API通信正常性', async ({ page }) => {
    console.log('=== ネットワークテスト開始 ===');
    
    const apiResponses: Array<{url: string, status: number}> = [];
    
    page.on('response', response => {
      if (response.url().includes('/api/v4/')) {
        apiResponses.push({
          url: response.url(),
          status: response.status()
        });
      }
    });
    
    // ログイン実行
    const loginSuccessful = await performLogin(page);
    expect(loginSuccessful).toBe(true);
    
    // API呼び出し確認
    const successfulRequests = apiResponses.filter(r => r.status === 200 || r.status === 201);
    expect(successfulRequests.length).toBeGreaterThan(0);
    console.log(`✅ API通信確認完了 (${successfulRequests.length}件の成功リクエスト)`);
  });

  test('パフォーマンス: ページ読み込み時間', async ({ page }) => {
    console.log('=== パフォーマンステスト開始 ===');
    
    const startTime = Date.now();
    
    await page.goto('http://localhost:5173');
    await waitForNetworkIdle(page);
    
    const loadTime = Date.now() - startTime;
    
    // 10秒以内での読み込み完了を確認
    expect(loadTime).toBeLessThan(10000);
    console.log(`✅ ページ読み込み時間確認完了 (${loadTime}ms)`);
  });

  test('統合テスト: 完全なユーザーフロー', async ({ page }) => {
    console.log('=== 統合テスト開始 ===');
    
    // Step 1: アプリアクセス
    await page.goto('http://localhost:5173');
    await waitForNetworkIdle(page);
    console.log('✅ Step 1: アプリアクセス完了');
    
    // Step 2: ログイン
    const loginSuccessful = await performLogin(page);
    expect(loginSuccessful).toBe(true);
    console.log('✅ Step 2: ログイン完了');
    
    // Step 3: チャンネル確認
    const townSquareVisible = await page.locator('text=Town Square').count() > 0;
    expect(townSquareVisible).toBe(true);
    console.log('✅ Step 3: チャンネル表示確認完了');
    
    // Step 4: メッセージ送信
    const testMessage = `統合テスト ${new Date().toLocaleString()}`;
    const messageDisplayed = await sendMessage(page, testMessage);
    expect(messageDisplayed).toBe(true);
    console.log('✅ Step 4: メッセージ送信完了');
    
    // Step 5: UI状態確認
    await expect(page.locator('textarea[placeholder*="にメッセージを送信"]')).toBeVisible();
    console.log('✅ Step 5: UI状態確認完了');
    
    console.log('🎉 統合テスト全体完了');
  });
});