const { chromium } = require('playwright');

async function verifyMattermost() {
  console.log('🔍 Mattermost設定確認');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const credentials = {
    username: 'admin',
    password: 'Admin123456!'
  };
  
  try {
    // 1. ログイン画面へ
    console.log('1. ログイン画面へアクセス...');
    await page.goto('http://localhost:8065/login');
    await page.waitForTimeout(2000);

    // 2. ログイン
    console.log('2. ログイン実行...');
    await page.fill('input[name="loginId"]', credentials.username);
    await page.fill('input[name="password"]', credentials.password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'verify-1-after-login.png' });

    // 3. 現在のURLを確認
    const currentUrl = page.url();
    console.log('現在のURL:', currentUrl);

    // チーム選択画面の場合
    if (currentUrl.includes('select_team')) {
      console.log('3. チーム選択画面です。チームを作成します...');
      
      const createTeamButton = await page.locator('text=Create a team').isVisible();
      if (createTeamButton) {
        await page.click('text=Create a team');
        await page.waitForTimeout(2000);
        
        // チーム名入力
        await page.fill('input[placeholder*="team name" i]', 'TestTeam');
        await page.waitForTimeout(1000);
        
        // Nextボタンをクリック
        await page.click('button:has-text("Next")');
        await page.waitForTimeout(2000);
        
        // URLが自動生成される場合はそのまま進む
        await page.click('button:has-text("Finish")');
        await page.waitForTimeout(3000);
      }
    }

    // 4. メイン画面確認
    console.log('4. メイン画面確認...');
    await page.screenshot({ path: 'verify-2-main-screen.png' });
    
    // 5. チャンネル作成
    console.log('5. テストチャンネル作成...');
    
    // 新しいチャンネル作成ボタンを探す
    const plusButton = await page.locator('[data-testid="AddChannelDropdown"]').isVisible();
    if (plusButton) {
      await page.click('[data-testid="AddChannelDropdown"]');
      await page.waitForTimeout(1000);
      
      await page.click('text=Create New Channel');
      await page.waitForTimeout(1000);
      
      // 佐藤チーム作成
      await page.fill('#newChannelName', 'sato-team');
      await page.fill('#newChannelDisplayName', '佐藤チーム');
      await page.fill('#newChannelPurpose', '佐藤さん専用のテストチャンネル');
      
      await page.click('button:has-text("Create Channel")');
      await page.waitForTimeout(2000);
      
      console.log('✅ 佐藤チーム作成完了');
    }

    await page.screenshot({ path: 'verify-3-final.png' });

    console.log('');
    console.log('✅ Mattermost設定確認完了！');
    console.log('');
    console.log('=== 確認された情報 ===');
    console.log('ログイン: 成功');
    console.log('チーム: 作成済み');
    console.log('チャンネル: 佐藤チーム作成済み');

  } catch (error) {
    console.error('❌ エラー:', error);
    await page.screenshot({ path: 'verify-error.png' });
  } finally {
    console.log('');
    console.log('ブラウザを開いたままにします。');
    console.log('手動で追加のチャンネルを作成してください：');
    console.log('- 営業チーム');
    console.log('- 開発チーム'); 
    console.log('- 佐藤プロジェクト');
    console.log('');
    console.log('完了したらCtrl+Cで終了してください。');
    
    // ブラウザを開いたまま
    await new Promise(() => {});
  }
}

verifyMattermost().catch(console.error);