import { test, expect } from '@playwright/test';

test.describe('最終チャット送信テスト', () => {
  test('チャット送信機能の動作確認', async ({ page }) => {
    page.on('console', msg => {
      console.log('ブラウザコンソール:', msg.text());
    });

    await page.goto('http://localhost:5173');
    
    console.log('✅ 開発モードでメイン画面を表示');
    
    // チャットバブルをクリック
    await page.click('[data-testid="chat-bubble"]');
    await page.waitForTimeout(1000);
    
    console.log('✅ チャットポップアップを開いた');
    
    // チャンネルを選択（営業チーム）
    await page.click('text=営業チーム');
    await page.waitForTimeout(2000);
    
    console.log('✅ 営業チームを選択');
    
    // DOM の詳細を確認
    const allInputs = await page.locator('input').count();
    console.log(`🔍 全入力欄数: ${allInputs}`);
    
    const dialogInputs = await page.locator('[role="dialog"] input').count();
    console.log(`🔍 ダイアログ内入力欄数: ${dialogInputs}`);
    
    // すべての入力欄のプレースホルダーを確認
    const inputs = page.locator('[role="dialog"] input');
    const inputCount = await inputs.count();
    for (let i = 0; i < inputCount; i++) {
      const placeholder = await inputs.nth(i).getAttribute('placeholder');
      console.log(`🔍 入力欄 ${i}: placeholder="${placeholder}"`);
    }
    
    // data-testidでメッセージ入力欄を探す
    const messageInput = page.locator('[data-testid="message-input"]');
    
    if (await messageInput.isVisible()) {
      console.log('✅ メッセージ入力欄を発見！');
      
      // メッセージを入力
      await messageInput.fill('Playwrightからのテストメッセージ 🚀');
      
      // 送信ボタンを探してクリック
      const sendButton = page.locator('[data-testid="send-button"]');
      if (await sendButton.isVisible()) {
        console.log('✅ 送信ボタンを発見！');
        await sendButton.click();
        
        await page.waitForTimeout(1000);
        
        // 入力欄がクリアされたか確認
        const inputValue = await messageInput.inputValue();
        if (inputValue === '') {
          console.log('🎉 SUCCESS: メッセージ送信成功！入力欄がクリアされました');
          
          // 送信されたメッセージが表示されているか確認
          const messageText = page.locator('text=Playwrightからのテストメッセージ 🚀');
          if (await messageText.isVisible()) {
            console.log('🎉 DOUBLE SUCCESS: 送信されたメッセージが画面に表示されています！');
          }
        } else {
          console.log(`❌ 入力欄がクリアされていません。現在の値: "${inputValue}"`);
        }
      } else {
        console.log('❌ 送信ボタンが見つかりません');
      }
    } else {
      console.log('❌ メッセージ入力欄が見つかりません');
      
      // デバッグ用にページの内容を確認
      const pageContent = await page.content();
      const hasInput = pageContent.includes('input');
      const hasDialog = pageContent.includes('role="dialog"');
      console.log(`デバッグ: hasInput=${hasInput}, hasDialog=${hasDialog}`);
    }
  });
});