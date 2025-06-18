import { test, expect } from '@playwright/test';

test.describe('WebSocket接続診断テスト', () => {
  test('WebSocket接続の詳細ログ確認', async ({ page }) => {
    console.log('🔧 WebSocket接続診断テスト開始');

    // コンソールログを収集
    const logs: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      logs.push(text);
      if (text.includes('WebSocket') || text.includes('🔌') || text.includes('❌') || text.includes('✅')) {
        console.log('📋 アプリログ:', text);
      }
    });

    // 1. アプリケーションにアクセス
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    console.log('✅ アプリケーションアクセス完了');

    // 2. 少し待ってからWebSocket接続の試行ログを確認
    await page.waitForTimeout(5000);

    // 3. ログイン状態をシミュレート
    try {
      const hasLoginForm = await page.locator('input[type="text"], input[placeholder*="ユーザー名"], input[placeholder*="Username"]').count();
      
      if (hasLoginForm > 0) {
        console.log('📝 ログインフォームが見つかりました - ログインを実行');
        
        // ログインフォームに入力
        await page.fill('input[type="text"], input[placeholder*="ユーザー名"], input[placeholder*="Username"]', 'shogidemo');
        await page.fill('input[type="password"]', 'hqe8twt_ety!phv3TMH');
        await page.click('button[type="submit"], button:has-text("ログイン")');
        
        console.log('📤 ログイン実行完了');
        await page.waitForTimeout(3000);
      } else {
        console.log('🔄 セッション復元中...');
      }
    } catch (error) {
      console.log('ℹ️ ログインスキップ:', error);
    }

    // 4. WebSocket接続の状態確認
    console.log('⏳ WebSocket接続状態確認中...');
    await page.waitForTimeout(5000);

    // 5. デバッグ関数の確認
    const debugResult = await page.evaluate(() => {
      return new Promise((resolve) => {
        setTimeout(() => {
          if ((window as any).mattermostDebug) {
            try {
              const result = (window as any).mattermostDebug.testWebSocket();
              resolve({ success: true, result });
            } catch (error) {
              resolve({ success: false, error: (error as any).message });
            }
          } else {
            resolve({ success: false, error: 'mattermostDebug not available' });
          }
        }, 1000);
      });
    });

    console.log('🛠️ デバッグ関数結果:', debugResult);

    // 6. コンソールログの分析
    const websocketLogs = logs.filter(log => 
      log.includes('WebSocket') || 
      log.includes('🔌') || 
      log.includes('🔗') || 
      log.includes('認証') ||
      log.includes('プロキシ')
    );

    console.log('📊 WebSocket関連ログ:', websocketLogs);

    // 7. ネットワークタブでWebSocket接続確認
    const websocketConnections = await page.evaluate(() => {
      return new Promise((resolve) => {
        // WebSocketの接続状態を確認
        const wsStatus = {
          hasWebSocket: !!window.WebSocket,
          userAgent: navigator.userAgent,
          onLine: navigator.onLine
        };
        resolve(wsStatus);
      });
    });

    console.log('🌐 WebSocket環境:', websocketConnections);

    // 8. 直接WebSocket接続テスト
    const directWebSocketTest = await page.evaluate(() => {
      return new Promise((resolve) => {
        try {
          const testWs = new WebSocket('ws://localhost:5173/api/v4/websocket');
          
          const result = {
            created: true,
            url: testWs.url,
            readyState: testWs.readyState,
            events: [] as string[]
          };

          testWs.onopen = () => {
            result.events.push('open');
            testWs.close();
          };

          testWs.onclose = (event) => {
            result.events.push(`close: code=${event.code}, reason=${event.reason}`);
            resolve(result);
          };

          testWs.onerror = (error) => {
            result.events.push(`error: ${error}`);
            resolve(result);
          };

          // タイムアウト
          setTimeout(() => {
            if (testWs.readyState === WebSocket.CONNECTING) {
              result.events.push('timeout');
              testWs.close();
              resolve(result);
            }
          }, 5000);

        } catch (error) {
          resolve({ created: false, error: (error as any).message });
        }
      });
    });

    console.log('🧪 直接WebSocketテスト結果:', directWebSocketTest);

    // 9. 結果の検証
    const hasWebSocketLogs = websocketLogs.length > 0;
    console.log(`📈 WebSocket関連ログ数: ${websocketLogs.length}`);

    // テストとして期待値を設定
    expect(hasWebSocketLogs).toBe(true); // WebSocket関連のログが存在すること
  });

  test('Docker Mattermost接続確認', async ({ page }) => {
    console.log('🐳 Docker Mattermost接続確認');

    // Mattermostサーバーの疎通確認
    const mattermostConnection = await page.evaluate(async () => {
      try {
        const response = await fetch('http://localhost:8065/api/v4/system/ping');
        const data = await response.text();
        return {
          success: true,
          status: response.status,
          data: data,
          headers: Object.fromEntries(response.headers.entries())
        };
      } catch (error) {
        return {
          success: false,
          error: (error as any).message
        };
      }
    });

    console.log('🔗 Mattermostサーバー疎通結果:', mattermostConnection);

    // WebSocket URL の確認
    const websocketUrlTest = await page.evaluate(() => {
      const testUrls = [
        'ws://localhost:5173/api/v4/websocket',
        'ws://localhost:8065/api/v4/websocket'
      ];

      return Promise.all(testUrls.map(url => {
        return new Promise((resolve) => {
          try {
            const testWs = new WebSocket(url);
            
            const result = {
              url: url,
              created: true,
              events: [] as string[]
            };

            testWs.onopen = () => {
              result.events.push('open');
              testWs.close();
            };

            testWs.onclose = (event) => {
              result.events.push(`close: ${event.code}`);
              resolve(result);
            };

            testWs.onerror = () => {
              result.events.push('error');
              resolve(result);
            };

            setTimeout(() => {
              if (testWs.readyState === WebSocket.CONNECTING) {
                result.events.push('timeout');
                testWs.close();
                resolve(result);
              }
            }, 3000);

          } catch (error) {
            resolve({ 
              url: url, 
              created: false, 
              error: (error as any).message 
            });
          }
        });
      }));
    });

    console.log('🌐 WebSocket URL テスト結果:', websocketUrlTest);

    expect(mattermostConnection.success).toBe(true);
  });
});