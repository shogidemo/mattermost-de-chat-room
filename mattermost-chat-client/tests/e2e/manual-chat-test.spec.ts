import { test, expect } from '@playwright/test';

test.describe('手動チャットテスト', () => {
  test('UI要素の確認のみ', async ({ page }) => {
    // コンソールログを取得
    page.on('console', msg => {
      console.log('ブラウザコンソール:', msg.text());
    });

    // 正しいポートに変更
    await page.goto('http://localhost:5173');
    
    // ページが読み込まれるまで待機
    await page.waitForTimeout(2000);
    
    // 画面の状態を確認
    const screenshot1 = await page.screenshot();
    console.log('初期画面をスクリーンショット撮影済み');
    
    // メイン画面が表示されているか確認
    const mainTitle = page.locator('text=穀物輸入管理システム');
    
    if (await mainTitle.isVisible()) {
      console.log('✅ メイン画面が表示されています（開発モード）');
      
      // チャットバブルを探す
      const chatBubble = page.locator('[data-testid="chat-bubble"]');
      if (await chatBubble.isVisible()) {
        console.log('✅ チャットバブルが見つかりました');
        
        await chatBubble.click();
        await page.waitForTimeout(2000);
        
        const screenshot3 = await page.screenshot();
        console.log('チャットバブルクリック後の画面をスクリーンショット撮影済み');
        
        // ポップアップ内のチャンネルを探す
        const channelItems = page.locator('[role="dialog"] .MuiListItem-root');
        const channelCount = await channelItems.count();
        console.log(`🔍 チャンネル数: ${channelCount}`);
        
        if (channelCount > 0) {
          console.log('✅ チャンネルが見つかりました');
          
          await channelItems.first().click();
          await page.waitForTimeout(5000); // 待機時間を増やす
          
          const screenshot4 = await page.screenshot();
          console.log('チャンネル選択後の画面をスクリーンショット撮影済み');
          
          // チャット入力欄を複数のセレクターで探す
          const messageInput1 = page.locator('input[placeholder*="メッセージを送信"]');
          const messageInput2 = page.locator('input[placeholder*="営業チーム"]');
          const messageInput3 = page.locator('[role="dialog"] input[type="text"]');
          
          let messageInput = null;
          if (await messageInput1.isVisible()) {
            messageInput = messageInput1;
            console.log('✅ メッセージ入力欄が見つかりました（セレクター1）');
          } else if (await messageInput2.isVisible()) {
            messageInput = messageInput2;
            console.log('✅ メッセージ入力欄が見つかりました（セレクター2）');
          } else if (await messageInput3.isVisible()) {
            messageInput = messageInput3;
            console.log('✅ メッセージ入力欄が見つかりました（セレクター3）');
          }
          
          if (messageInput && await messageInput.isVisible()) {
            await messageInput.fill('テストメッセージ from Playwright');
            
            const sendButton = page.locator('[data-testid="send-button"]');
            if (await sendButton.isVisible() && await sendButton.isEnabled()) {
              console.log('✅ 送信ボタンが有効です');
              
              await sendButton.click();
              await page.waitForTimeout(2000);
              
              const screenshot5 = await page.screenshot();
              console.log('メッセージ送信後の画面をスクリーンショット撮影済み');
              
              // 入力欄がクリアされたか確認
              const inputValue = await messageInput.inputValue();
              if (inputValue === '') {
                console.log('✅ メッセージ送信成功: 入力欄がクリアされました');
              } else {
                console.log('❌ メッセージ送信失敗: 入力欄がクリアされていません');
              }
            } else {
              console.log('❌ 送信ボタンが無効または見つかりません');
            }
          } else {
            console.log('❌ メッセージ入力欄が見つかりません');
          }
        } else {
          console.log('❌ チャンネルが見つかりません');
        }
      } else {
        console.log('❌ チャットバブルが見つかりません');
      }
    } else {
      console.log('❌ メイン画面が表示されていません');
    }
  });
});