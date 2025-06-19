const { chromium } = require('playwright');

(async () => {
  console.log('🔍 重複メッセージ修正確認 - 自動化テスト');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 // 動作を見やすくするため
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 1. Reactアプリにアクセス
    console.log('\n📱 Step 1: Reactアプリにアクセス...');
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(2000);
    
    // スクリーンショット
    await page.screenshot({ path: 'duplicate-fix-1-initial.png' });
    
    // 2. ログイン
    console.log('\n🔐 Step 2: ログイン処理...');
    const loginForm = await page.locator('form').first();
    const isLoginPage = await loginForm.isVisible();
    
    if (isLoginPage) {
      await page.fill('input[name="username"]', 'admin');
      await page.fill('input[name="password"]', 'Admin123456!');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
    }
    
    // スクリーンショット
    await page.screenshot({ path: 'duplicate-fix-2-after-login.png' });
    
    // 3. チャットボタンの存在確認
    console.log('\n💬 Step 3: チャットボタンを探す...');
    // 複数のセレクタを試す
    const chatButtonSelectors = [
      'button[aria-label="チャット"]',
      'button:has-text("チャット")',
      '[data-testid="chat-button"]',
      '.MuiFab-root',
      'button.MuiFab-primary',
      'button[style*="position: fixed"]'
    ];
    
    let chatButton = null;
    for (const selector of chatButtonSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 })) {
          chatButton = element;
          console.log(`✅ チャットボタンを発見: ${selector}`);
          break;
        }
      } catch (e) {
        // 次のセレクタを試す
      }
    }
    
    if (chatButton) {
      await chatButton.click();
      await page.waitForTimeout(2000);
      console.log('✅ チャットポップアップが開きました');
      
      // スクリーンショット
      await page.screenshot({ path: 'duplicate-fix-3-chat-open.png' });
      
      // 4. Town Squareチャンネルを探す
      console.log('\n📢 Step 4: Town Squareチャンネルを選択...');
      const channelSelectors = [
        'text=Town Square',
        '[data-channel-name="town-square"]',
        '.channel-item:has-text("Town Square")'
      ];
      
      let channelClicked = false;
      for (const selector of channelSelectors) {
        try {
          const channel = page.locator(selector).first();
          if (await channel.isVisible({ timeout: 1000 })) {
            await channel.click();
            channelClicked = true;
            console.log(`✅ チャンネルをクリック: ${selector}`);
            break;
          }
        } catch (e) {
          // 次のセレクタを試す
        }
      }
      
      if (channelClicked) {
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'duplicate-fix-4-channel-selected.png' });
        
        // 5. 現在のメッセージ数を確認
        console.log('\n📊 Step 5: 現在のメッセージ状態を確認...');
        const messageCount = await page.locator('[class*="MuiBox"]:has-text("admin")').count();
        console.log(`現在のメッセージ数: ${messageCount}`);
        
        // 開発者ツールのコンソールメッセージを監視
        page.on('console', msg => {
          const text = msg.text();
          if (text.includes('重複メッセージ') || text.includes('WebSocket') || text.includes('ポーリング')) {
            console.log(`🔍 Console: ${text}`);
          }
        });
        
        console.log('\n✅ テスト準備完了！');
        console.log('次の手順:');
        console.log('1. 別のブラウザウィンドウで http://localhost:8065 を開く');
        console.log('2. admin/Admin123456! でログイン');
        console.log('3. Town Squareチャンネルでメッセージを送信');
        console.log('4. このReactアプリでメッセージが重複なく表示されるか確認');
        console.log('5. コンソールログに「重複メッセージを検出」が表示されるか確認');
        
        // ブラウザを開いたままにする
        console.log('\n⏳ ブラウザは開いたままです。手動テスト後、Ctrl+Cで終了してください。');
        await new Promise(() => {});
      } else {
        console.log('❌ Town Squareチャンネルが見つかりません');
        await page.screenshot({ path: 'duplicate-fix-error-no-channel.png' });
      }
    } else {
      console.log('❌ チャットボタンが見つかりません');
      await page.screenshot({ path: 'duplicate-fix-error-no-button.png' });
    }
    
  } catch (error) {
    console.error('❌ エラー:', error);
    await page.screenshot({ path: 'duplicate-fix-error.png' });
  }
})();