const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('1. Mattermostにアクセス中...');
    await page.goto('http://localhost:8065');
    await page.waitForLoadState('networkidle');

    // アプリ選択画面が表示されたら「View in Browser」をクリック
    const viewInBrowserButton = await page.locator('text="View in Browser"').isVisible().catch(() => false);
    if (viewInBrowserButton) {
      console.log('  → ブラウザで表示を選択中...');
      await page.click('text="View in Browser"');
      await page.waitForTimeout(2000);
    }

    // ログイン状態を確認
    const isLoggedIn = await page.locator('[data-testid="channel-header"]').isVisible().catch(() => false);
    
    if (!isLoggedIn) {
      console.log('2. ログイン中...');
      // ユーザー名またはメールアドレス入力
      await page.fill('input[id="input_loginId"]', 'admin');
      // パスワード入力
      await page.fill('input[id="input_password-input"]', 'Admin123456!');
      // ログインボタンをクリック
      await page.click('button[id="saveSetting"]');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    } else {
      console.log('2. 既にログイン済み');
    }

    // チャンネルを作成する関数
    const createChannel = async (channelName, displayName) => {
      console.log(`\n${displayName} (${channelName}) を作成中...`);
      
      try {
        // チャンネルが既に存在するか確認
        const channelExists = await page.locator(`a[aria-label*="${displayName}"]`).isVisible().catch(() => false);
        if (channelExists) {
          console.log(`  → ${displayName} は既に存在します`);
          return;
        }

        // サイドバーの「+」ボタンまたは「チャンネルを追加」をクリック
        const addChannelButton = await page.locator('button[aria-label="Add channels"]').first();
        if (await addChannelButton.isVisible()) {
          await addChannelButton.click();
        } else {
          // 代替: Browse channelsボタンを探す
          await page.click('text="Browse channels"');
        }
        await page.waitForTimeout(1000);

        // 「新しいチャンネルを作成」を選択
        await page.click('text="Create new channel"');
        await page.waitForTimeout(1000);

        // チャンネル名を入力
        await page.fill('input[placeholder="Channel name"]', channelName);
        
        // 表示名を入力（もし別フィールドがある場合）
        const displayNameField = await page.locator('input[placeholder="Channel display name"]').isVisible().catch(() => false);
        if (displayNameField) {
          await page.fill('input[placeholder="Channel display name"]', displayName);
        }

        // 作成ボタンをクリック
        await page.click('button:has-text("Create channel")');
        await page.waitForTimeout(2000);

        console.log(`  → ${displayName} を作成しました`);

        // テストメッセージを投稿
        const messageInput = await page.locator('textarea[placeholder*="Write to"]').or(page.locator('#post_textbox'));
        await messageInput.fill(`${displayName}へようこそ！これはテストメッセージです。`);
        await messageInput.press('Enter');
        await page.waitForTimeout(1000);

        console.log(`  → テストメッセージを投稿しました`);

      } catch (error) {
        console.log(`  → エラー: ${error.message}`);
      }
    };

    // チャンネルを作成
    await createChannel('sales-team', '営業チーム');
    await createChannel('dev-team', '開発チーム');
    await createChannel('qa-team', '品質管理');

    // 最終的なスクリーンショットを撮影
    console.log('\n最終スクリーンショットを撮影中...');
    await page.screenshot({ path: 'channels-created.png', fullPage: false });
    console.log('channels-created.png として保存しました');

    // 各チャンネルのスクリーンショットも撮影
    const channels = [
      { name: 'sales-team', displayName: '営業チーム' },
      { name: 'dev-team', displayName: '開発チーム' },
      { name: 'qa-team', displayName: '品質管理' }
    ];

    for (const channel of channels) {
      try {
        const channelLink = await page.locator(`a[aria-label*="${channel.displayName}"]`).first();
        if (await channelLink.isVisible()) {
          await channelLink.click();
          await page.waitForTimeout(1500);
          await page.screenshot({ path: `channel-${channel.name}.png`, fullPage: false });
          console.log(`channel-${channel.name}.png として保存しました`);
        }
      } catch (error) {
        console.log(`${channel.displayName} のスクリーンショット撮影をスキップ`);
      }
    }

    console.log('\n✅ すべての処理が完了しました');

  } catch (error) {
    console.error('エラーが発生しました:', error);
    await page.screenshot({ path: 'error-screenshot.png' });
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
})();