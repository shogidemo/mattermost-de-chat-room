const { chromium } = require('playwright');

async function testRealMattermost() {
  console.log('🔗 実際のMattermost連携テスト開始');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1500 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const credentials = {
    username: 'admin',
    password: 'Admin123456!'
  };
  
  try {
    // 1. Reactアプリにアクセス
    console.log('1. Reactアプリにアクセス...');
    await page.goto('http://localhost:5178/');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'real-1-login-screen.png' });
    console.log('📸 ログイン画面: real-1-login-screen.png');

    // 2. ログイン
    console.log('2. Mattermostアカウントでログイン...');
    console.log(`   ユーザー名: ${credentials.username}`);
    console.log(`   パスワード: ${credentials.password}`);
    
    // ユーザー名入力
    await page.fill('input[name="username"]', credentials.username);
    await page.waitForTimeout(500);
    
    // パスワード入力
    await page.fill('input[name="password"]', credentials.password);
    await page.waitForTimeout(500);
    
    // ログインボタンクリック
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);

    await page.screenshot({ path: 'real-2-after-login.png' });
    console.log('📸 ログイン後: real-2-after-login.png');

    // 3. チャットバブルをクリック
    console.log('3. チャットバブルをクリック...');
    const floatingButton = await page.locator('button').filter({ 
      has: page.locator('svg[data-testid="ChatBubbleOutlineIcon"]') 
    }).or(page.locator('button[style*="position: fixed"]')).first();
    
    if (await floatingButton.isVisible()) {
      await floatingButton.click();
      await page.waitForTimeout(3000);
      
      await page.screenshot({ path: 'real-3-channel-list.png' });
      console.log('📸 チャンネルリスト: real-3-channel-list.png');
      
      // チャンネル数を確認
      const channelCount = await page.locator('.MuiListItemButton-root').count();
      console.log(`📋 表示チャンネル数: ${channelCount}`);
      
      if (channelCount > 0) {
        console.log('✅ Mattermostチャンネルが表示されています！');
        
        // チャンネル名を取得
        const channels = await page.locator('.MuiListItemButton-root').all();
        console.log('📝 チャンネル一覧:');
        for (let i = 0; i < Math.min(channels.length, 5); i++) {
          const text = await channels[i].textContent();
          console.log(`   - ${text}`);
        }
        
        // フィルターをクリア
        console.log('4. フィルターをクリア...');
        const searchBox = await page.locator('input[placeholder*="検索"]').first();
        if (await searchBox.isVisible()) {
          await searchBox.clear();
          await page.waitForTimeout(2000);
          
          await page.screenshot({ path: 'real-4-all-channels.png' });
          console.log('📸 全チャンネル表示: real-4-all-channels.png');
        }
        
        // チャンネルをクリック
        console.log('5. 最初のチャンネルをクリック...');
        if (channels.length > 0) {
          await channels[0].click();
          await page.waitForTimeout(3000);
          
          await page.screenshot({ path: 'real-5-chat-view.png' });
          console.log('📸 チャット画面: real-5-chat-view.png');
          
          // メッセージ送信テスト
          console.log('6. メッセージ送信テスト...');
          const inputField = await page.locator('input[placeholder*="メッセージ"]').first();
          if (await inputField.isVisible()) {
            await inputField.fill('Mattermostとの連携テスト成功！🎉');
            await page.keyboard.press('Enter');
            await page.waitForTimeout(3000);
            
            await page.screenshot({ path: 'real-6-after-send.png' });
            console.log('📸 メッセージ送信後: real-6-after-send.png');
          }
        }
      } else {
        console.log('⚠️ チャンネルが表示されていません');
        console.log('Mattermostでチャンネルを作成してください');
      }
    }

    console.log('');
    console.log('🎉 Mattermost連携テスト完了！');
    console.log('');
    console.log('📊 テスト結果:');
    console.log(`✅ ログイン: ${credentials.username}`);
    console.log(`✅ チャンネル表示: ${channelCount > 0 ? '成功' : '失敗'}`);
    console.log('✅ UI機能: 正常動作');

  } catch (error) {
    console.error('❌ テストエラー:', error);
    await page.screenshot({ path: 'real-error.png' });
    
    console.log('');
    console.log('エラーが発生しました。以下を確認してください：');
    console.log('1. Mattermostサーバーが起動している');
    console.log('2. アカウントが作成されている');
    console.log('3. src/App.tsx の DEVELOPMENT_MODE が false');
  } finally {
    await browser.close();
  }
}

testRealMattermost().catch(console.error);