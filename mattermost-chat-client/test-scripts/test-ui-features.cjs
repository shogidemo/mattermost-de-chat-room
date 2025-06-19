const { chromium } = require('playwright');

async function testUIFeatures() {
  console.log('🧪 UI機能テスト開始');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 1. Reactアプリにアクセス
    console.log('1. Reactアプリにアクセス...');
    await page.goto('http://localhost:5178/');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'test-1-app-initial.png', fullPage: true });
    console.log('📸 初期画面: test-1-app-initial.png');

    // 2. チャットバブルをクリック
    console.log('2. チャットバブルをクリック...');
    const chatBubble = await page.isVisible('[data-testid="chat-bubble"], .chat-bubble, button[title*="チャット"], button[aria-label*="チャット"]');
    if (chatBubble) {
      await page.click('[data-testid="chat-bubble"], .chat-bubble, button[title*="チャット"], button[aria-label*="チャット"]');
      await page.waitForTimeout(2000);
    } else {
      // フローティングボタンを探す
      console.log('チャットバブルが見つからない - フローティングボタンを探します');
      const floatingButton = await page.isVisible('button[style*="position: fixed"]');
      if (floatingButton) {
        await page.click('button[style*="position: fixed"]');
        await page.waitForTimeout(2000);
      }
    }

    await page.screenshot({ path: 'test-2-chat-popup.png', fullPage: true });
    console.log('📸 チャットポップアップ: test-2-chat-popup.png');

    // 3. チャンネルフィルターを確認
    console.log('3. チャンネルフィルターを確認...');
    
    // 検索ボックスがあるかチェック
    const searchBox = await page.isVisible('input[placeholder*="検索"], input[placeholder*="フィルター"]');
    if (searchBox) {
      console.log('✅ 検索ボックス発見');
      
      // 現在の値を確認
      const currentValue = await page.inputValue('input[placeholder*="検索"], input[placeholder*="フィルター"]');
      console.log('🔍 デフォルトフィルター値:', currentValue);
      
      // フィルターをクリアして確認
      await page.fill('input[placeholder*="検索"], input[placeholder*="フィルター"]', '');
      await page.waitForTimeout(1000);
      
      await page.screenshot({ path: 'test-3-filter-cleared.png', fullPage: true });
      console.log('📸 フィルタークリア: test-3-filter-cleared.png');
      
      // 佐藤フィルターを適用
      await page.fill('input[placeholder*="検索"], input[placeholder*="フィルター"]', '佐藤');
      await page.waitForTimeout(1000);
      
      await page.screenshot({ path: 'test-4-sato-filter.png', fullPage: true });
      console.log('📸 佐藤フィルター適用: test-4-sato-filter.png');
    } else {
      console.log('❌ 検索ボックスが見つかりません');
    }

    // 4. チャンネルリストを確認
    console.log('4. チャンネルリストを確認...');
    
    // チャンネルアイテムをカウント
    const channelItems = await page.locator('[role="button"], .channel-item, .MuiListItem-root').count();
    console.log('📋 表示チャンネル数:', channelItems);
    
    // 未読バッジを確認
    const unreadBadges = await page.locator('.MuiChip-root, .unread-badge, [class*="badge"]').count();
    console.log('🔴 未読バッジ数:', unreadBadges);
    
    // メッセージプレビューを確認
    const messagePreviews = await page.locator('[class*="secondary"], .message-preview').count();
    console.log('💬 メッセージプレビュー数:', messagePreviews);

    // 5. UI機能の総合評価
    console.log('5. UI機能の総合評価...');
    
    const features = {
      チャンネルフィルター: searchBox,
      未読バッジ: unreadBadges > 0,
      メッセージプレビュー: messagePreviews > 0,
      チャンネル表示: channelItems > 0
    };
    
    console.log('');
    console.log('🎯 機能テスト結果:');
    Object.entries(features).forEach(([feature, working]) => {
      console.log(`${working ? '✅' : '❌'} ${feature}: ${working ? '動作中' : '未実装/未動作'}`);
    });
    
    // ユーザー名の確認（ダミーデータで）
    const userNames = await page.locator('text=/ユーザー|佐藤|admin/').count();
    console.log(`👤 ユーザー名表示: ${userNames > 0 ? '✅ 動作中' : '❌ 未動作'}`);
    
    // 最終スクリーンショット
    await page.screenshot({ path: 'test-5-final-state.png', fullPage: true });
    console.log('📸 最終状態: test-5-final-state.png');

    console.log('');
    console.log('🎉 UI機能テスト完了！');
    console.log('📸 撮影されたスクリーンショット:');
    console.log('  - test-1-app-initial.png: 初期画面');
    console.log('  - test-2-chat-popup.png: チャットポップアップ');
    console.log('  - test-3-filter-cleared.png: フィルタークリア');
    console.log('  - test-4-sato-filter.png: 佐藤フィルター適用');
    console.log('  - test-5-final-state.png: 最終状態');

  } catch (error) {
    console.error('❌ テストエラー:', error);
    await page.screenshot({ path: 'test-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testUIFeatures().catch(console.error);