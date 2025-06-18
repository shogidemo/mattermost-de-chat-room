import { test, expect } from '@playwright/test';

test.describe('Mattermost→アプリ メッセージ同期テスト', () => {
  test('Mattermostから送信されたメッセージがアプリ側に表示される', async ({ page, context }) => {
    // テスト用の一意メッセージ
    const testMessage = `Mattermostから送信 ${Date.now()}`;
    
    console.log('🚀 Mattermost→アプリ同期テスト開始:', testMessage);

    // 1. 統合アプリケーションにアクセス
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    console.log('✅ 統合アプリケーションアクセス完了');

    // 2. WebSocketの状態確認
    const websocketStatus = await page.evaluate(() => {
      if (window.mattermostDebug) {
        return window.mattermostDebug.showState();
      }
      return null;
    });
    console.log('🔌 WebSocket状態:', websocketStatus);

    // 3. チャットバブルをクリック
    await page.locator('[data-testid="chat-bubble"]').click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    console.log('✅ チャットポップアップを開いた');

    // 4. 営業チーム選択（実際のMattermostチャンネル）
    await page.locator('text=営業チーム').click();
    await page.waitForTimeout(3000); // 初期メッセージ読み込み待機
    console.log('✅ 営業チーム（実際のMattermostチャンネル）を選択');

    // 5. 現在のメッセージ数を記録
    const initialMessageCount = await page.locator('[data-testid="message-item"]').count();
    console.log(`📊 初期メッセージ数: ${initialMessageCount}`);

    // 6. 新しいタブでMattermost Web UIにアクセス
    const mattermostPage = await context.newPage();
    await mattermostPage.goto('http://localhost:8065/');
    console.log('🌐 Mattermost Web UIにアクセス');

    // 7. Mattermostでログイン
    try {
      // ログインページかチェック
      await mattermostPage.waitForSelector('input[placeholder*="Email"], input[id="loginId"]', { timeout: 5000 });
      
      // ログイン実行
      await mattermostPage.fill('input[placeholder*="Email"], input[id="loginId"]', 'shogidemo');
      await mattermostPage.fill('input[type="password"]', 'shogidemo123');
      await mattermostPage.click('button[type="submit"], button:has-text("サインイン"), button:has-text("Sign In")');
      await mattermostPage.waitForTimeout(3000);
      console.log('✅ Mattermostにログイン成功');
    } catch (error) {
      console.log('ℹ️ 既にログイン済み、またはログインページが見つからない');
    }

    // 8. Mattermostで営業チームチャンネルに移動
    try {
      // チャンネルリストから営業チームを探す
      await mattermostPage.click('text=営業チーム', { timeout: 10000 });
      console.log('✅ Mattermostで営業チームチャンネルを選択');
    } catch (error) {
      console.log('⚠️ 営業チームチャンネルが見つからない、一般チャンネルを使用');
      await mattermostPage.click('text=Town Square, text=一般', { timeout: 10000 });
    }

    await mattermostPage.waitForTimeout(2000);

    // 9. Mattermostでメッセージ送信
    try {
      const mattermostInput = mattermostPage.locator('#post_textbox, [data-testid="post_textbox"], textarea[placeholder*="メッセージ"], textarea[placeholder*="message"]');
      await mattermostInput.fill(testMessage);
      await mattermostPage.keyboard.press('Enter');
      console.log('✅ Mattermostからメッセージを送信');
    } catch (error) {
      console.error('❌ Mattermostでのメッセージ送信に失敗:', error);
      throw error;
    }

    // 10. 統合アプリ側でメッセージ同期を確認
    console.log('⏳ 統合アプリでメッセージ同期を待機中...');
    
    // アプリのページに戻る
    await page.bringToFront();
    
    // WebSocketイベントログを確認
    const websocketEvents = await page.evaluate(() => {
      return new Promise((resolve) => {
        const events = [];
        const originalLog = console.log;
        console.log = (...args) => {
          const message = args.join(' ');
          if (message.includes('WebSocketイベント') || message.includes('posted') || message.includes('メッセージ受信')) {
            events.push(message);
          }
          originalLog.apply(console, args);
        };
        
        setTimeout(() => {
          console.log = originalLog;
          resolve(events);
        }, 5000);
      });
    });
    
    console.log('📨 WebSocketイベントログ:', websocketEvents);

    // 11. メッセージが表示されるまで最大30秒待機
    let messageFound = false;
    let attempts = 0;
    const maxAttempts = 15; // 30秒 (2秒間隔 × 15回)

    while (!messageFound && attempts < maxAttempts) {
      attempts++;
      console.log(`🔍 メッセージ確認 (${attempts}/${maxAttempts})`);
      
      // メッセージの存在確認
      const messageExists = await page.locator(`text=${testMessage}`).count();
      
      if (messageExists > 0) {
        messageFound = true;
        console.log('🎉 SUCCESS: Mattermostからのメッセージが統合アプリに表示されました！');
        break;
      }
      
      // 現在のメッセージ数
      const currentMessageCount = await page.locator('[data-testid="message-item"]').count();
      console.log(`📊 現在のメッセージ数: ${currentMessageCount} (初期: ${initialMessageCount})`);
      
      // WebSocket接続状態確認
      const wsConnected = await page.evaluate(() => {
        return window.mattermostDebug ? window.mattermostDebug.showState() : 'デバッグ情報なし';
      });
      console.log('🔌 WebSocket状態:', wsConnected);
      
      await page.waitForTimeout(2000);
    }

    // 12. 同期に失敗した場合の詳細診断
    if (!messageFound) {
      console.log('❌ FAIL: Mattermostからのメッセージが統合アプリに同期されませんでした');
      
      // デバッグ情報収集
      const debugInfo = await page.evaluate(() => {
        if (window.mattermostDebug) {
          return {
            websocketStatus: window.mattermostDebug.testWebSocket(),
            pollingStatus: window.mattermostDebug.testPolling(),
            appState: window.mattermostDebug.showState()
          };
        }
        return { error: 'デバッグ関数が利用できません' };
      });
      
      console.log('🔧 デバッグ情報:', debugInfo);
      
      // ページの内容確認
      const dialogContent = await page.locator('[role="dialog"]').textContent();
      console.log('📋 現在のダイアログ内容:', dialogContent?.substring(0, 300));
      
      // ネットワークタブの確認
      console.log('🌐 ネットワークログ確認のため、開発者ツールを確認してください');
    }

    // 13. Mattermostページを閉じる
    await mattermostPage.close();

    // 14. 結果検証
    expect(messageFound).toBe(true);
    
    // 15. 追加検証: メッセージが実際に表示されている
    if (messageFound) {
      await expect(page.locator(`text=${testMessage}`)).toBeVisible();
      console.log('✅ メッセージの表示確認完了');
    }
  });

  test('WebSocket接続状態の詳細診断', async ({ page }) => {
    console.log('🔧 WebSocket診断テスト開始');

    // 1. アプリケーションにアクセス
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');

    // 2. WebSocket状態の詳細確認
    const websocketDiagnosis = await page.evaluate(() => {
      if (!window.mattermostDebug) {
        return { error: 'デバッグ関数が利用できません' };
      }

      const diagnosis = {
        websocketStatus: null,
        pollingStatus: null,
        appState: null,
        networkState: null
      };

      try {
        diagnosis.websocketStatus = window.mattermostDebug.testWebSocket();
        diagnosis.pollingStatus = window.mattermostDebug.testPolling();
        diagnosis.appState = window.mattermostDebug.showState();
        
        // ネットワーク状態の確認
        diagnosis.networkState = {
          online: navigator.onLine,
          connection: navigator.connection ? {
            effectiveType: navigator.connection.effectiveType,
            downlink: navigator.connection.downlink
          } : 'Connection API not supported'
        };
      } catch (error) {
        diagnosis.error = error.message;
      }

      return diagnosis;
    });

    console.log('📊 WebSocket診断結果:', JSON.stringify(websocketDiagnosis, null, 2));

    // 3. ネットワークタブでWebSocket接続を確認
    const webSocketConnections = await page.evaluate(() => {
      return new Promise((resolve) => {
        const connections = [];
        
        // Performance API を使ってネットワーク情報を取得
        const entries = performance.getEntriesByType('resource');
        const wsEntries = entries.filter(entry => entry.name.includes('websocket') || entry.name.includes('ws://'));
        
        resolve({
          totalRequests: entries.length,
          websocketRequests: wsEntries.length,
          websocketDetails: wsEntries.map(entry => ({
            name: entry.name,
            startTime: entry.startTime,
            duration: entry.duration
          }))
        });
      });
    });

    console.log('🌐 ネットワーク状態:', JSON.stringify(webSocketConnections, null, 2));

    // 結果の検証
    expect(websocketDiagnosis).toBeDefined();
  });
});