import { test, expect } from '@playwright/test';

test.describe('Playwrightメッセージ送信テスト', () => {
  test('手動テストと同じ方法でメッセージ送信をテスト', async ({ page }) => {
    console.log('=== Playwrightメッセージ送信テスト開始 ===');
    
    // コンソールログを監視
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'log' || msg.type() === 'error') {
        const message = `[${msg.type()}] ${msg.text()}`;
        consoleMessages.push(message);
        console.log(`📋 ブラウザ: ${message}`);
      }
    });
    
    // ネットワークリクエストの監視
    const apiRequests: string[] = [];
    page.on('request', request => {
      if (request.url().includes('/api/v4/posts')) {
        apiRequests.push(`${request.method()} ${request.url()}`);
        console.log(`📡 API: ${request.method()} ${request.url()}`);
      }
    });
    
    // Step 1: アプリケーションにアクセス
    console.log('🔧 Step 1: アプリケーションアクセス');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    
    // Step 2: ログイン
    console.log('🔧 Step 2: ログイン実行');
    await page.fill('input[autocomplete="username"]', 'shogidemo');
    await page.fill('input[type="password"]', 'hqe8twt_ety!phv3TMH');
    await page.click('button[type="submit"]');
    
    // ログイン完了を待機
    await page.waitForTimeout(5000);
    
    // ログイン成功確認
    const isLoggedIn = await page.locator('text=チャンネル').count() > 0 ||
                      await page.locator('text=Town Square').count() > 0;
    
    if (!isLoggedIn) {
      throw new Error('ログインに失敗しました');
    }
    console.log('✅ ログイン成功');
    
    // 認証状態の安定化を待機
    await page.waitForTimeout(2000);
    
    // Step 3: メッセージ入力欄を特定
    console.log('🔧 Step 3: メッセージ入力欄の特定');
    
    const messageInput = page.locator('textarea[placeholder*="にメッセージを送信"]:visible').first();
    const inputExists = await messageInput.count() > 0;
    
    if (!inputExists) {
      throw new Error('メッセージ入力欄が見つかりません');
    }
    console.log('✅ メッセージ入力欄を確認');
    
    // Step 4: 手動テストと同じ方法でメッセージを入力
    console.log('🔧 Step 4: メッセージ入力（JavaScript直接操作）');
    
    const testMessage = `Playwrightテスト ${new Date().toLocaleString()}`;
    
    // 手動テストで成功したJavaScript直接操作を使用
    await messageInput.evaluate((element, message) => {
      // React Input要素の値を直接設定
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(element, message);
        
        // React Synthetic Eventを発火
        const event = new Event('input', { bubbles: true });
        element.dispatchEvent(event);
        
        const changeEvent = new Event('change', { bubbles: true });
        element.dispatchEvent(changeEvent);
      }
    }, testMessage);
    
    // 入力確認
    await page.waitForTimeout(500);
    const currentValue = await messageInput.inputValue();
    console.log(`📝 入力確認: "${currentValue}"`);
    
    expect(currentValue).toBe(testMessage);
    console.log('✅ メッセージ入力成功');
    
    // Step 5: 送信ボタンの確認と送信
    console.log('🔧 Step 5: メッセージ送信');
    
    const sendButton = page.locator('[data-testid="send-button"]');
    const sendButtonExists = await sendButton.count() > 0;
    
    if (!sendButtonExists) {
      throw new Error('送信ボタンが見つかりません');
    }
    
    // 送信ボタンが有効になるまで待機
    await page.waitForTimeout(300);
    const isDisabled = await sendButton.getAttribute('disabled');
    
    if (isDisabled !== null) {
      throw new Error('送信ボタンが無効です');
    }
    console.log('✅ 送信ボタンが有効');
    
    // 送信実行
    console.log('🚀 送信ボタンクリック');
    await sendButton.click();
    
    // 送信処理の完了を待機
    await page.waitForTimeout(3000);
    
    // Step 6: 送信結果の確認
    console.log('🔧 Step 6: 送信結果確認');
    
    // メッセージがチャット画面に表示されているか確認
    const messageDisplayed = await page.locator(`text=${testMessage}`).count() > 0;
    console.log('📥 メッセージ表示:', messageDisplayed ? '✅ 成功' : '❌ 失敗');
    
    // API呼び出しが発生したか確認
    const postRequestMade = apiRequests.length > 0;
    console.log('📡 API呼び出し:', postRequestMade ? '✅ 実行' : '❌ 未実行');
    
    // コンソールログから成功メッセージを確認
    const successLog = consoleMessages.some(msg => msg.includes('✅ メッセージ送信成功'));
    console.log('📋 送信成功ログ:', successLog ? '✅ 確認' : '❌ 未確認');
    
    // 認証エラーがないことを確認
    const authError = consoleMessages.some(msg => msg.includes('認証が失効') || msg.includes('認証が必要'));
    console.log('🔐 認証状態:', authError ? '❌ エラーあり' : '✅ 正常');
    
    // 最終的なテスト結果
    console.log('=== テスト結果 ===');
    console.log(`メッセージ入力: ✅ 成功`);
    console.log(`送信ボタン: ✅ 正常動作`);
    console.log(`メッセージ表示: ${messageDisplayed ? '✅ 成功' : '❌ 失敗'}`);
    console.log(`API呼び出し: ${postRequestMade ? '✅ 実行' : '❌ 未実行'}`);
    console.log(`認証状態: ${authError ? '❌ エラー' : '✅ 正常'}`);
    
    // すべてのアサーション
    expect(currentValue).toBe(testMessage);
    expect(messageDisplayed).toBe(true);
    expect(postRequestMade).toBe(true);
    expect(authError).toBe(false);
    
    console.log('🎉 Playwrightメッセージ送信テスト完了 - すべて成功！');
    
    // 最終状態のスクリーンショット
    await page.screenshot({
      path: 'test-results/playwright-message-send-success.png',
      fullPage: true
    });
  });
  
  test('複数メッセージの連続送信テスト', async ({ page }) => {
    console.log('=== 複数メッセージ連続送信テスト開始 ===');
    
    // 初期設定（ログイン）
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[autocomplete="username"]', 'shogidemo');
    await page.fill('input[type="password"]', 'hqe8twt_ety!phv3TMH');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    
    const messageInput = page.locator('textarea[placeholder*="にメッセージを送信"]:visible').first();
    const sendButton = page.locator('[data-testid="send-button"]');
    
    // 3つのメッセージを連続送信
    const messages = [
      'メッセージ1',
      'メッセージ2', 
      'メッセージ3'
    ];
    
    for (let i = 0; i < messages.length; i++) {
      const message = `${messages[i]} - ${new Date().toLocaleTimeString()}`;
      console.log(`📤 メッセージ${i + 1}送信: "${message}"`);
      
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
      await sendButton.click();
      await page.waitForTimeout(2000);
      
      // メッセージが表示されたか確認
      const displayed = await page.locator(`text=${message}`).count() > 0;
      console.log(`📥 メッセージ${i + 1}表示: ${displayed ? '✅' : '❌'}`);
      
      expect(displayed).toBe(true);
    }
    
    console.log('✅ 複数メッセージ連続送信テスト完了');
    
    await page.screenshot({
      path: 'test-results/multiple-messages-test.png',
      fullPage: true
    });
  });
});