const { chromium } = require('playwright');

async function testUIFeatures() {
  console.log('🚀 チャットUI機能の動作確認開始');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  try {
    // コンソールログを監視
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ コンソールエラー:', msg.text());
      } else if (msg.text().includes('チャンネル') || msg.text().includes('ユーザー')) {
        console.log('📝 ログ:', msg.text());
      }
    });

    // ページにアクセス
    console.log('1. アプリケーションにアクセス中...');
    await page.goto('http://localhost:5173/');
    await page.waitForTimeout(3000);

    // スクリーンショット1: 初期画面
    await page.screenshot({ path: 'debug-1-initial.png', fullPage: true });
    console.log('📸 初期画面のスクリーンショットを保存: debug-1-initial.png');

    // ログインフォームの確認
    console.log('2. ログインフォームの確認...');
    const loginForm = await page.isVisible('form');
    const usernameField = await page.isVisible('input[type="text"], input[name="username"]');
    const passwordField = await page.isVisible('input[type="password"]');
    
    console.log('ログインフォーム:', { loginForm, usernameField, passwordField });

    if (loginForm && usernameField && passwordField) {
      // ログイン実行
      console.log('3. ログイン中...');
      await page.fill('input[type="text"], input[name="username"]', 'admin');
      await page.fill('input[type="password"]', 'admin123');
      await page.click('button[type="submit"], button:has-text("ログイン")');
      
      // ログイン後の画面を待機
      await page.waitForTimeout(5000);
      
      // スクリーンショット2: ログイン後
      await page.screenshot({ path: 'debug-2-after-login.png', fullPage: true });
      console.log('📸 ログイン後のスクリーンショットを保存: debug-2-after-login.png');

      // チャンネルリストの確認
      console.log('4. チャンネルリストの確認...');
      const channelListVisible = await page.isVisible('[data-testid="channel-list"], .MuiList-root');
      console.log('チャンネルリスト表示:', channelListVisible);

      if (channelListVisible) {
        // チャンネル要素を取得
        const channels = await page.$$eval('[role="button"]:has-text("チーム"), .MuiListItem-root', elements => 
          elements.map(el => ({
            text: el.textContent?.trim(),
            visible: el.offsetHeight > 0
          })).filter(ch => ch.text && ch.text.length > 0)
        );
        
        console.log('発見されたチャンネル:', channels);

        // フィルター機能の確認
        console.log('5. フィルター機能の確認...');
        const searchField = await page.isVisible('input[placeholder*="検索"], input[placeholder*="フィルター"]');
        console.log('検索フィールド表示:', searchField);

        if (searchField) {
          const searchValue = await page.inputValue('input[placeholder*="検索"], input[placeholder*="フィルター"]');
          console.log('現在の検索値:', searchValue);
        }

        // メッセージプレビューの確認
        console.log('6. メッセージプレビューの確認...');
        const previewElements = await page.$$eval('.MuiTypography-caption, [class*="secondary"]', elements => 
          elements.map(el => el.textContent?.trim()).filter(text => text && text.length > 0)
        );
        console.log('プレビューテキスト:', previewElements);

        // 未読バッジの確認
        console.log('7. 未読バッジの確認...');
        const badges = await page.$$eval('.MuiChip-root, .MuiBadge-badge', elements => 
          elements.map(el => ({
            text: el.textContent?.trim(),
            color: getComputedStyle(el).backgroundColor
          }))
        );
        console.log('未読バッジ:', badges);

        // チャンネル選択とメッセージ表示の確認
        console.log('8. チャンネル選択テスト...');
        const firstChannel = await page.$('[role="button"]:has-text("チーム"), .MuiListItemButton-root');
        if (firstChannel) {
          await firstChannel.click();
          await page.waitForTimeout(3000);

          // スクリーンショット3: チャンネル選択後
          await page.screenshot({ path: 'debug-3-channel-selected.png', fullPage: true });
          console.log('📸 チャンネル選択後のスクリーンショットを保存: debug-3-channel-selected.png');

          // メッセージエリアの確認
          const messageArea = await page.isVisible('[data-testid="message-list"], .message-list, [class*="message"]');
          console.log('メッセージエリア表示:', messageArea);

          // ユーザー名表示の確認
          console.log('9. ユーザー名表示の確認...');
          const userNames = await page.$$eval('[class*="username"], .MuiTypography-subtitle2', elements => 
            elements.map(el => el.textContent?.trim()).filter(text => text && text.length > 0)
          );
          console.log('表示されているユーザー名:', userNames);

          // テストメッセージ送信
          console.log('10. テストメッセージ送信...');
          const messageInput = await page.isVisible('input[placeholder*="メッセージ"], textarea');
          if (messageInput) {
            await page.fill('input[placeholder*="メッセージ"], textarea', 'UI機能テストメッセージ');
            await page.press('input[placeholder*="メッセージ"], textarea', 'Enter');
            await page.waitForTimeout(2000);

            // スクリーンショット4: メッセージ送信後
            await page.screenshot({ path: 'debug-4-message-sent.png', fullPage: true });
            console.log('📸 メッセージ送信後のスクリーンショットを保存: debug-4-message-sent.png');
          } else {
            console.log('❌ メッセージ入力フィールドが見つかりません');
          }
        } else {
          console.log('❌ 選択可能なチャンネルが見つかりません');
        }
      } else {
        console.log('❌ チャンネルリストが表示されていません');
      }
    } else {
      console.log('❌ ログインフォームが正しく表示されていません');
    }

    // 最終スクリーンショット
    await page.screenshot({ path: 'debug-5-final.png', fullPage: true });
    console.log('📸 最終スクリーンショットを保存: debug-5-final.png');

  } catch (error) {
    console.error('❌ テスト実行エラー:', error);
    await page.screenshot({ path: 'debug-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
  
  console.log('✅ 動作確認完了');
}

testUIFeatures().catch(console.error);