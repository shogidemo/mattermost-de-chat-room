const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('1. Mattermostにアクセス中...');
    await page.goto('http://localhost:8065');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // アプリ選択画面の処理
    try {
      const viewInBrowserLink = await page.locator('a:has-text("View in Browser")').first();
      if (await viewInBrowserLink.isVisible({ timeout: 5000 })) {
        console.log('  → ブラウザで表示を選択中...');
        await viewInBrowserLink.click();
        await page.waitForTimeout(3000);
      }
    } catch (e) {
      console.log('  → アプリ選択画面はスキップ');
    }

    // ログイン処理
    const loginIdInput = await page.locator('input[name="loginId"], input[id*="loginId"]').first();
    const isLoginPage = await loginIdInput.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (isLoginPage) {
      console.log('2. ログイン中...');
      await loginIdInput.fill('admin');
      const passwordInput = await page.locator('input[type="password"]').first();
      await passwordInput.fill('Admin123456!');
      const loginButton = await page.locator('button[type="submit"]').first();
      await loginButton.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(5000);
    } else {
      console.log('2. 既にログイン済み');
    }

    // チャンネル作成
    const channels = [
      { id: 'sales-team', name: '営業チーム' },
      { id: 'dev-team', name: '開発チーム' },
      { id: 'qa-team', name: '品質管理' }
    ];

    for (const channel of channels) {
      console.log(`\n${channel.name} を作成中...`);
      
      try {
        // チャンネルが既に存在するか確認
        const channelExists = await page.locator(`text="${channel.name}"`).isVisible({ timeout: 2000 }).catch(() => false);
        if (channelExists) {
          console.log(`  → ${channel.name} は既に存在します`);
          continue;
        }

        // "Add channels" をクリック
        console.log('  → Add channelsをクリック');
        await page.click('text="Add channels"');
        await page.waitForTimeout(2000);

        // "Create new channel" をクリック（小文字のnに注意）
        console.log('  → Create new channelを選択');
        await page.click('text="Create new channel"');
        await page.waitForTimeout(2000);

        // チャンネル名を入力
        console.log(`  → チャンネル名を入力: ${channel.id}`);
        const nameInput = await page.locator('input[placeholder*="channel name" i], input[placeholder*="Channel name" i]').first();
        await nameInput.fill(channel.id);
        await page.waitForTimeout(500);

        // 必要に応じて表示名も入力
        try {
          const displayNameInput = await page.locator('input[placeholder*="display name" i]').first();
          if (await displayNameInput.isVisible({ timeout: 1000 })) {
            await displayNameInput.fill(channel.name);
          }
        } catch (e) {
          // 表示名フィールドがない場合はスキップ
        }

        // 作成ボタンをクリック
        console.log('  → チャンネルを作成');
        const createButton = await page.locator('button:has-text("Create Channel"), button:has-text("Create channel")').first();
        await createButton.click();
        await page.waitForTimeout(3000);

        console.log(`  → ${channel.name} を作成しました！`);

        // テストメッセージを投稿
        try {
          const messageInput = await page.locator('textarea[placeholder*="Write"]').first();
          await messageInput.fill(`${channel.name}へようこそ！これはテストメッセージです。`);
          await messageInput.press('Enter');
          console.log('  → テストメッセージを投稿しました');
        } catch (e) {
          console.log('  → メッセージ投稿をスキップ');
        }

      } catch (error) {
        console.log(`  → エラー: ${error.message}`);
        await page.screenshot({ path: `error-${channel.id}.png` });
      }
    }

    // 最終スクリーンショット
    console.log('\n最終結果のスクリーンショットを撮影中...');
    await page.screenshot({ path: 'channels-created.png' });
    console.log('channels-created.png として保存しました');

    console.log('\n✅ 完了しました！');

  } catch (error) {
    console.error('エラー:', error);
    await page.screenshot({ path: 'error.png' });
  } finally {
    console.log('\n5秒後にブラウザを閉じます...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
})();