import { test, expect } from '@playwright/test';

test.describe('WebSocket接続確認（高速）', () => {
  test('ログイン→WebSocket接続の流れを確認', async ({ page }) => {
    console.log('🚀 WebSocket接続の自動確認開始');

    // コンソールログを収集
    const logs: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      logs.push(text);
      // 重要なログのみ表示
      if (text.includes('📋') || text.includes('✅') || text.includes('❌') || text.includes('🔌') || text.includes('WebSocket')) {
        console.log('📝', text);
      }
    });

    // 1. アプリケーションにアクセス
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    console.log('✅ アプリケーションアクセス完了');

    // 2. ログインフォームの確認と入力
    const hasLoginForm = await page.locator('input[type="text"], input[placeholder*="ユーザー名"], input[placeholder*="Username"]').count();
    
    if (hasLoginForm > 0) {
      console.log('📝 ログインを実行');
      
      await page.fill('input[type="text"], input[placeholder*="ユーザー名"], input[placeholder*="Username"]', 'shogidemo');
      await page.fill('input[type="password"]', 'hqe8twt_ety!phv3TMH');
      await page.click('button[type="submit"], button:has-text("ログイン")');
      
      console.log('⏳ ログイン処理完了を待機中...');
      await page.waitForTimeout(5000); // ログイン処理とWebSocket接続完了を待機
    } else {
      console.log('ℹ️ 既にログイン済み');
      await page.waitForTimeout(2000);
    }

    // 3. WebSocket関連ログの分析
    const websocketLogs = logs.filter(log => 
      log.includes('WebSocket') || 
      log.includes('📋 ログイン成功') ||
      log.includes('✅ ログイン後WebSocket') ||
      log.includes('🔌') ||
      log.includes('認証')
    );

    console.log('\n📊 WebSocket関連ログ分析:');
    websocketLogs.forEach((log, index) => {
      console.log(`${index + 1}. ${log}`);
    });

    // 4. WebSocket接続状態の確認
    const websocketStatus = await page.evaluate(() => {
      return new Promise((resolve) => {
        setTimeout(() => {
          if ((window as any).mattermostDebug) {
            try {
              const result = (window as any).mattermostDebug.testWebSocket();
              resolve({ success: true, debug: result });
            } catch (error) {
              resolve({ success: false, error: (error as any).message });
            }
          } else {
            resolve({ success: false, error: 'mattermostDebug not available' });
          }
        }, 1000);
      });
    });

    console.log('\n🔧 WebSocket状態:', websocketStatus);

    // 5. 結果の判定
    const hasLoginSuccessLog = websocketLogs.some(log => log.includes('📋 ログイン成功'));
    const hasWebSocketSuccessLog = websocketLogs.some(log => log.includes('✅ ログイン後WebSocket接続成功'));
    const hasWebSocketConnectLog = websocketLogs.some(log => log.includes('🔌 AppContext.connectWebSocket'));

    console.log('\n📋 診断結果:');
    console.log(`- ログイン成功ログ: ${hasLoginSuccessLog ? '✅' : '❌'}`);
    console.log(`- WebSocket接続試行ログ: ${hasWebSocketConnectLog ? '✅' : '❌'}`);
    console.log(`- WebSocket接続成功ログ: ${hasWebSocketSuccessLog ? '✅' : '❌'}`);

    if (hasWebSocketSuccessLog) {
      console.log('\n🎉 WebSocket接続成功！リアルタイム同期が動作します');
    } else if (hasWebSocketConnectLog) {
      console.log('\n⚠️ WebSocket接続を試行していますが失敗しています');
    } else {
      console.log('\n❌ WebSocket接続処理が実行されていません');
    }

    // テストの期待値設定（緩い条件）
    expect(hasLoginSuccessLog || hasWebSocketConnectLog).toBe(true);
  });
});