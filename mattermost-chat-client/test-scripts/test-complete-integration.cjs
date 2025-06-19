const { chromium } = require('playwright');

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testCompleteIntegration() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  
  try {
    console.log('=== Mattermost + React チャット統合テスト ===\n');
    
    // ステップ1: Reactアプリにアクセス
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await wait(2000);
    await page.screenshot({ path: 'complete-1-login.png' });
    console.log('✅ 1. Reactアプリにアクセスしました');
    
    // ステップ2: ログイン
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'Admin123456!');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await wait(3000);
    await page.screenshot({ path: 'complete-2-main.png' });
    console.log('✅ 2. ログイン完了');
    
    // ステップ3: チャットボタンクリック
    await page.click('[data-testid="chat-bubble"]');
    await wait(2000);
    await page.screenshot({ path: 'complete-3-channel-list.png' });
    console.log('✅ 3. チャネルリストを開きました');
    
    // ステップ4: フィルタークリア
    const clearButton = page.locator('svg[data-testid="ClearIcon"]').locator('..');
    if (await clearButton.isVisible()) {
      await clearButton.click();
      await wait(1000);
      console.log('✅ 4. フィルターをクリアしました');
    }
    
    // チャンネルリストの内容を確認
    await page.screenshot({ path: 'complete-4-all-channels.png' });
    
    // ステップ5: sales-teamチャンネルをダブルクリック（確実にチャット画面に遷移）
    const salesChannel = page.locator('.MuiListItem-root:has-text("sales-team")');
    if (await salesChannel.isVisible()) {
      // ダブルクリックで確実に選択
      await salesChannel.dblclick();
      await wait(3000);
      await page.screenshot({ path: 'complete-5-sales-chat.png' });
      console.log('✅ 5. sales-teamチャンネルのチャット画面を開きました');
    }
    
    // チャット画面が表示されているか確認
    const chatView = page.locator('text=sales-team').first();
    if (await chatView.isVisible()) {
      console.log('✅ チャット画面が表示されています');
      
      // ステップ6: メッセージ送信
      const messageInput = page.locator('textarea').first();
      if (await messageInput.isVisible()) {
        const message = `統合テストメッセージ - ${new Date().toLocaleTimeString('ja-JP')}`;
        await messageInput.fill(message);
        await messageInput.press('Enter');
        await wait(2000);
        await page.screenshot({ path: 'complete-6-message-sent.png' });
        console.log('✅ 6. メッセージを送信しました:', message);
      }
    }
    
    // ステップ7: Mattermost側の確認
    const mattermostPage = await context.newPage();
    await mattermostPage.goto('http://localhost:8065');
    await wait(2000);
    
    // Mattermostログイン（必要な場合）
    if (await mattermostPage.locator('#loginId').isVisible()) {
      await mattermostPage.fill('#loginId', 'admin');
      await mattermostPage.fill('#loginPassword', 'Admin123456!');
      await mattermostPage.click('button[type="submit"]');
      await wait(3000);
    }
    
    // sales-teamチャンネルを開く
    try {
      // 複数のセレクタを試す
      const selectors = [
        'a:has-text("sales-team")',
        '.SidebarChannel:has-text("sales-team")',
        'div[class*="SidebarChannel"]:has-text("sales-team")'
      ];
      
      let clicked = false;
      for (const selector of selectors) {
        const element = mattermostPage.locator(selector).first();
        if (await element.isVisible()) {
          await element.click();
          clicked = true;
          break;
        }
      }
      
      if (clicked) {
        await wait(2000);
        await mattermostPage.screenshot({ path: 'complete-7-mattermost.png' });
        console.log('✅ 7. Mattermostでsales-teamチャンネルを開きました');
      }
    } catch (e) {
      console.log('⚠️  Mattermostでチャンネルが見つかりませんでした');
    }
    
    // ステップ8: Mattermostから返信
    try {
      const inputSelectors = [
        '#post_textbox',
        'div[contenteditable="true"]',
        'textarea[placeholder*="メッセージ"]'
      ];
      
      let inputFound = false;
      for (const selector of inputSelectors) {
        const input = mattermostPage.locator(selector).first();
        if (await input.isVisible()) {
          const reply = `Mattermostからの返信 - ${new Date().toLocaleTimeString('ja-JP')}`;
          await input.fill(reply);
          await input.press('Enter');
          inputFound = true;
          await wait(2000);
          await mattermostPage.screenshot({ path: 'complete-8-mattermost-reply.png' });
          console.log('✅ 8. Mattermostから返信しました:', reply);
          break;
        }
      }
      
      if (!inputFound) {
        console.log('⚠️  Mattermostで入力フィールドが見つかりませんでした');
      }
    } catch (e) {
      console.log('⚠️  Mattermostでメッセージ送信できませんでした');
    }
    
    // ステップ9: Reactアプリでリアルタイム更新確認
    await page.bringToFront();
    await wait(3000);
    await page.screenshot({ path: 'complete-9-realtime.png' });
    console.log('✅ 9. リアルタイム更新を待機しました');
    
    // ステップ10: 最終確認
    // チャットを閉じる
    const closeBtn = page.locator('button:has(svg[data-testid="CloseIcon"])').first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await wait(1000);
    }
    
    // 再度開く
    await page.click('[data-testid="chat-bubble"]');
    await wait(2000);
    
    // フィルタークリア
    const clearBtn2 = page.locator('svg[data-testid="ClearIcon"]').locator('..');
    if (await clearBtn2.isVisible()) {
      await clearBtn2.click();
      await wait(1000);
    }
    
    await page.screenshot({ path: 'complete-10-final.png' });
    console.log('✅ 10. 最終状態を確認しました');
    
    console.log('\n=== テスト完了 ===');
    console.log('スクリーンショット: complete-*.png');
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
    await page.screenshot({ path: 'complete-error.png' });
  }
  
  // ブラウザは開いたままにする
  console.log('\n💡 ブラウザは開いています。確認後、手動で閉じてください。');
}

testCompleteIntegration().catch(console.error);