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

    // 現在のURLを確認
    const currentUrl = page.url();
    console.log(`  → 現在のURL: ${currentUrl}`);

    // ログイン画面の確認
    const loginIdInput = await page.locator('input[name="loginId"], input[id*="loginId"], input[placeholder*="Username"], input[placeholder*="Email"]').first();
    const isLoginPage = await loginIdInput.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (isLoginPage) {
      console.log('2. ログイン画面を検出 - ログイン中...');
      
      // ユーザー名入力
      await loginIdInput.fill('admin');
      console.log('  → ユーザー名を入力');
      
      // パスワード入力
      const passwordInput = await page.locator('input[type="password"], input[name="password"], input[id*="password"]').first();
      await passwordInput.fill('Admin123456!');
      console.log('  → パスワードを入力');
      
      // ログインボタンをクリック
      const loginButton = await page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Log in"), button:has-text("ログイン")').first();
      await loginButton.click();
      console.log('  → ログインボタンをクリック');
      
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(5000);
    } else {
      console.log('2. 既にログイン済み');
    }

    // 現在の画面のスクリーンショットを撮影
    await page.screenshot({ path: 'after-login.png' });
    console.log('ログイン後の状態: after-login.png');

    // チャンネルを作成する関数（手動でUIを操作）
    const createChannelManually = async (channelName, displayName) => {
      console.log(`\n=== ${displayName} (${channelName}) の作成 ===`);
      
      try {
        // 1. まずチャンネルが既に存在するか確認
        await page.waitForTimeout(1000);
        const existingChannel = await page.locator(`text="${displayName}"`).isVisible({ timeout: 3000 }).catch(() => false);
        
        if (existingChannel) {
          console.log(`  → ${displayName} は既に存在します`);
          
          // チャンネルをクリックして移動
          await page.click(`text="${displayName}"`);
          await page.waitForTimeout(2000);
          
          // テストメッセージを投稿
          try {
            const textArea = await page.locator('textarea').first();
            if (await textArea.isVisible()) {
              await textArea.fill(`${displayName}のテストメッセージ - ${new Date().toLocaleString('ja-JP')}`);
              await textArea.press('Enter');
              console.log('  → テストメッセージを投稿しました');
            }
          } catch (e) {
            console.log('  → メッセージ投稿をスキップ');
          }
          
          return;
        }

        // 2. チャンネル作成を開始
        console.log('  → チャンネル作成プロセスを開始...');
        
        // サイドバーのチャンネル追加ボタンを探す（複数の可能性）
        const addChannelSelectors = [
          'button[aria-label*="add channel"]',
          'button[aria-label*="Add channel"]',
          'button:has-text("+")',
          '.AddChannelDropdown button',
          '.SidebarChannelNavigator button[aria-label*="Add"]',
          'button[data-testid="AddChannelDropdown.dropdownButton"]'
        ];

        let clicked = false;
        for (const selector of addChannelSelectors) {
          try {
            const button = await page.locator(selector).first();
            if (await button.isVisible({ timeout: 1000 })) {
              await button.click();
              console.log(`  → チャンネル追加ボタンをクリック (${selector})`);
              clicked = true;
              break;
            }
          } catch (e) {
            // 次のセレクタを試す
          }
        }

        if (!clicked) {
          console.log('  → チャンネル追加ボタンが見つかりません');
          await page.screenshot({ path: `cannot-find-add-button-${channelName}.png` });
          return;
        }

        await page.waitForTimeout(1500);

        // 3. "Create new channel" オプションを選択
        const createNewSelectors = [
          'text="Create New Channel"',
          'text="Create new channel"',
          'span:has-text("Create New Channel")',
          'button:has-text("Create New Channel")',
          'li:has-text("Create New Channel")'
        ];

        clicked = false;
        for (const selector of createNewSelectors) {
          try {
            const option = await page.locator(selector).first();
            if (await option.isVisible({ timeout: 1000 })) {
              await option.click();
              console.log(`  → "Create new channel"を選択`);
              clicked = true;
              break;
            }
          } catch (e) {
            // 次のセレクタを試す
          }
        }

        if (!clicked) {
          console.log('  → Create new channelオプションが見つかりません');
          await page.screenshot({ path: `cannot-find-create-option-${channelName}.png` });
          return;
        }

        await page.waitForTimeout(2000);

        // 4. チャンネル名を入力
        const nameInputSelectors = [
          'input[placeholder*="channel name" i]',
          'input[name="name"]',
          'input#channel_name',
          'input[data-testid="new-channel-modal-name"]'
        ];

        let inputFilled = false;
        for (const selector of nameInputSelectors) {
          try {
            const input = await page.locator(selector).first();
            if (await input.isVisible({ timeout: 1000 })) {
              await input.fill(channelName);
              console.log(`  → チャンネル名を入力: ${channelName}`);
              inputFilled = true;
              break;
            }
          } catch (e) {
            // 次のセレクタを試す
          }
        }

        if (!inputFilled) {
          console.log('  → チャンネル名入力フィールドが見つかりません');
          await page.screenshot({ path: `cannot-find-name-input-${channelName}.png` });
          return;
        }

        // 5. 作成ボタンをクリック
        await page.waitForTimeout(1000);
        
        const createButtonSelectors = [
          'button:has-text("Create channel")',
          'button:has-text("Create Channel")',
          'button:has-text("Create")',
          'button[type="submit"]:visible'
        ];

        clicked = false;
        for (const selector of createButtonSelectors) {
          try {
            const button = await page.locator(selector).first();
            if (await button.isVisible({ timeout: 1000 })) {
              await button.click();
              console.log(`  → 作成ボタンをクリック`);
              clicked = true;
              break;
            }
          } catch (e) {
            // 次のセレクタを試す
          }
        }

        if (!clicked) {
          console.log('  → 作成ボタンが見つかりません');
          await page.screenshot({ path: `cannot-find-create-button-${channelName}.png` });
          return;
        }

        await page.waitForTimeout(3000);
        console.log(`  → ${displayName} を作成しました！`);

        // 6. テストメッセージを投稿
        try {
          const textArea = await page.locator('textarea').first();
          if (await textArea.isVisible({ timeout: 3000 })) {
            await textArea.fill(`${displayName}へようこそ！これは最初のテストメッセージです。`);
            await textArea.press('Enter');
            console.log('  → テストメッセージを投稿しました');
          }
        } catch (e) {
          console.log('  → メッセージ投稿をスキップ');
        }

      } catch (error) {
        console.log(`  → エラーが発生: ${error.message}`);
        await page.screenshot({ path: `error-${channelName}.png` });
      }
    };

    // チャンネルを作成
    await createChannelManually('sales-team', '営業チーム');
    await createChannelManually('dev-team', '開発チーム');
    await createChannelManually('qa-team', '品質管理');

    // 最終的なスクリーンショットを撮影
    console.log('\n=== 最終結果 ===');
    await page.screenshot({ path: 'final-channels.png', fullPage: false });
    console.log('最終状態: final-channels.png');

    // 各チャンネルのスクリーンショットを撮影
    const channels = ['営業チーム', '開発チーム', '品質管理'];
    
    for (const channelName of channels) {
      try {
        const channelElement = await page.locator(`text="${channelName}"`).first();
        if (await channelElement.isVisible({ timeout: 3000 })) {
          await channelElement.click();
          await page.waitForTimeout(2000);
          await page.screenshot({ path: `channel-${channelName}.png` });
          console.log(`${channelName}のスクリーンショット: channel-${channelName}.png`);
        }
      } catch (e) {
        console.log(`${channelName}のスクリーンショットをスキップ`);
      }
    }

    console.log('\n✅ 処理が完了しました！');

  } catch (error) {
    console.error('致命的なエラーが発生しました:', error);
    await page.screenshot({ path: 'fatal-error.png' });
  } finally {
    console.log('\nブラウザを10秒後に閉じます...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
})();