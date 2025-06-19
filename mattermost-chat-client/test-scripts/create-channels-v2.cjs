const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('1. Mattermostにアクセス中...');
    await page.goto('http://localhost:8065');
    await page.waitForLoadState('networkidle');

    // アプリ選択画面が表示されたら「View in Browser」をクリック
    const viewInBrowserButton = await page.locator('button:has-text("View in Browser")').isVisible().catch(() => false);
    if (viewInBrowserButton) {
      console.log('  → ブラウザで表示を選択中...');
      await page.click('button:has-text("View in Browser")');
      await page.waitForTimeout(2000);
    }

    // ログイン状態を確認 - より汎用的なセレクタを使用
    const isLoggedIn = await page.locator('.SidebarChannelNavigator').isVisible().catch(() => false) || 
                        await page.locator('[data-testid="channel-header"]').isVisible().catch(() => false);
    
    if (!isLoggedIn) {
      console.log('2. ログイン中...');
      // ユーザー名またはメールアドレス入力
      await page.fill('input[id="input_loginId"]', 'admin');
      // パスワード入力
      await page.fill('input[id="input_password-input"]', 'Admin123456!');
      // ログインボタンをクリック
      await page.click('button[id="saveSetting"]');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
    } else {
      console.log('2. 既にログイン済み');
    }

    // 現在の画面のスクリーンショットを撮影
    await page.screenshot({ path: 'current-state.png' });
    console.log('現在の状態: current-state.png');

    // チャンネルを作成する関数
    const createChannel = async (channelName, displayName) => {
      console.log(`\n${displayName} (${channelName}) を作成中...`);
      
      try {
        // チャンネルが既に存在するか確認
        const channelExists = await page.locator(`a:has-text("${displayName}")`).isVisible().catch(() => false);
        if (channelExists) {
          console.log(`  → ${displayName} は既に存在します`);
          // チャンネルに移動してテストメッセージを投稿
          await page.click(`a:has-text("${displayName}")`);
          await page.waitForTimeout(1500);
          
          const messageInput = await page.locator('textarea[data-testid="post_textbox"]').or(
            page.locator('#post_textbox')
          ).or(
            page.locator('textarea[placeholder*="Write"]')
          );
          
          if (await messageInput.isVisible()) {
            await messageInput.fill(`${displayName}のテストメッセージ - ${new Date().toLocaleString('ja-JP')}`);
            await messageInput.press('Enter');
            await page.waitForTimeout(1000);
            console.log(`  → テストメッセージを投稿しました`);
          }
          return;
        }

        // まず左サイドバーの「+」ボタンを探す
        const plusButton = await page.locator('.SidebarChannelNavigator button[aria-label*="Add"]').first();
        const browseButton = await page.locator('button:has-text("Browse Channels")').first();
        
        if (await plusButton.isVisible()) {
          console.log('  → +ボタンをクリック');
          await plusButton.click();
          await page.waitForTimeout(1000);
        } else if (await browseButton.isVisible()) {
          console.log('  → Browse Channelsボタンをクリック');
          await browseButton.click();
          await page.waitForTimeout(1000);
        } else {
          // サイドバーのフッターにあるかもしれない
          const footerPlus = await page.locator('.SidebarChannelNavigator__footer button').first();
          if (await footerPlus.isVisible()) {
            console.log('  → フッターの+ボタンをクリック');
            await footerPlus.click();
            await page.waitForTimeout(1000);
          }
        }

        // 「Create New Channel」オプションを探してクリック
        const createNewOption = await page.locator('span:has-text("Create New Channel")').or(
          page.locator('button:has-text("Create New Channel")')
        ).or(
          page.locator('text="Create new channel"')
        );
        
        if (await createNewOption.isVisible()) {
          console.log('  → Create New Channelを選択');
          await createNewOption.click();
          await page.waitForTimeout(1500);
        }

        // チャンネル作成フォームに入力
        // チャンネル名
        const nameInput = await page.locator('input[placeholder*="Channel name"]').or(
          page.locator('input[id="channel-name"]')
        ).or(
          page.locator('input[name="name"]')
        );
        
        if (await nameInput.isVisible()) {
          await nameInput.fill(channelName);
          console.log(`  → チャンネル名を入力: ${channelName}`);
        }

        // 表示名（もしある場合）
        const displayNameInput = await page.locator('input[placeholder*="display name"]').isVisible().catch(() => false);
        if (displayNameInput) {
          await page.fill('input[placeholder*="display name"]', displayName);
        }

        // 作成ボタンをクリック
        const createButton = await page.locator('button:has-text("Create Channel")').or(
          page.locator('button:has-text("Create")')
        ).or(
          page.locator('button[type="submit"]')
        );
        
        if (await createButton.isVisible()) {
          console.log('  → チャンネルを作成中...');
          await createButton.click();
          await page.waitForTimeout(3000);
          console.log(`  → ${displayName} を作成しました`);
        }

        // テストメッセージを投稿
        const messageInput = await page.locator('textarea[data-testid="post_textbox"]').or(
          page.locator('#post_textbox')
        ).or(
          page.locator('textarea[placeholder*="Write"]')
        );
        
        if (await messageInput.isVisible()) {
          await messageInput.fill(`${displayName}へようこそ！これはテストメッセージです。`);
          await messageInput.press('Enter');
          await page.waitForTimeout(1000);
          console.log(`  → テストメッセージを投稿しました`);
        }

      } catch (error) {
        console.log(`  → エラー: ${error.message}`);
        await page.screenshot({ path: `error-${channelName}.png` });
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
        const channelLink = await page.locator(`a:has-text("${channel.displayName}")`).first();
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