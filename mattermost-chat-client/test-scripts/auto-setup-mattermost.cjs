const { chromium } = require('playwright');

async function autoSetupMattermost() {
  console.log('🤖 Mattermost自動セットアップ開始');
  
  const browser = await chromium.launch({ 
    headless: false, // 画面を表示して進捗を確認
    slowMo: 1000 // 各操作を1秒遅延
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // セットアップ情報
  const setupInfo = {
    email: 'admin@localhost.com',
    username: 'admin',
    password: 'Admin123456!',
    teamName: 'TestTeam',
    teamUrl: 'testteam',
    channels: [
      { name: 'sales-team', displayName: '営業チーム' },
      { name: 'dev-team', displayName: '開発チーム' },
      { name: 'sato-team', displayName: '佐藤チーム' },
      { name: 'sato-project', displayName: '佐藤プロジェクト' }
    ]
  };
  
  try {
    // 1. Mattermostにアクセス
    console.log('1. Mattermostサーバーにアクセス...');
    await page.goto('http://localhost:8065/');
    await page.waitForTimeout(3000);

    // デスクトップアプリ選択画面の処理
    const browserOption = await page.locator('text=View in Browser').isVisible();
    if (browserOption) {
      console.log('2. ブラウザ表示を選択...');
      await page.click('text=View in Browser');
      await page.waitForTimeout(2000);
    }

    await page.screenshot({ path: 'auto-setup-1-initial.png' });

    // 現在のURLを確認
    const currentUrl = page.url();
    console.log('現在のURL:', currentUrl);

    // ログイン画面の場合、サインアップページへ
    if (currentUrl.includes('/login')) {
      console.log('3. サインアップページへ移動...');
      
      // "Don't have an account?"リンクをクリック
      const signupLink = await page.locator('text=Don\'t have an account?').isVisible();
      if (signupLink) {
        await page.click('text=Don\'t have an account?');
        await page.waitForTimeout(2000);
      } else {
        // 直接サインアップURLへ
        await page.goto('http://localhost:8065/signup');
        await page.waitForTimeout(2000);
      }
    }

    // サインアップ画面の処理
    console.log('4. アカウント情報を入力...');
    
    // まずメールアドレスから入力を試みる
    try {
      // 方法1: name属性で特定
      await page.fill('input[name="email"]', setupInfo.email);
    } catch {
      try {
        // 方法2: type属性で特定
        await page.fill('input[type="email"]', setupInfo.email);
      } catch {
        // 方法3: プレースホルダーで特定
        await page.fill('input[placeholder*="mail" i]', setupInfo.email);
      }
    }
    await page.waitForTimeout(500);

    // ユーザー名入力
    try {
      await page.fill('input[name="username"]', setupInfo.username);
    } catch {
      try {
        await page.fill('input[placeholder*="username" i]', setupInfo.username);
      } catch {
        // 2番目の入力フィールドを使用
        const inputs = await page.locator('input[type="text"]').all();
        if (inputs.length > 0) {
          await inputs[0].fill(setupInfo.username);
        }
      }
    }
    await page.waitForTimeout(500);

    // パスワード入力
    await page.fill('input[type="password"]', setupInfo.password);
    await page.waitForTimeout(500);

    await page.screenshot({ path: 'auto-setup-2-filled.png' });

    // Create Accountボタンをクリック
    console.log('5. アカウント作成実行...');
    
    // ボタンが有効になるまで待機
    const createButton = page.locator('button[type="submit"]:has-text("Create")');
    await createButton.waitFor({ state: 'visible', timeout: 5000 });
    
    // ボタンの状態を確認
    const isDisabled = await createButton.isDisabled();
    if (!isDisabled) {
      await createButton.click();
      console.log('✅ Create Accountボタンをクリックしました');
      await page.waitForTimeout(5000);
    } else {
      console.log('⚠️ ボタンが無効です。フォームの入力を確認してください。');
      await page.screenshot({ path: 'auto-setup-error-disabled.png' });
    }

    // アカウント作成後の処理
    await page.screenshot({ path: 'auto-setup-3-after-create.png' });
    
    // メール確認画面が出た場合はスキップ
    if (page.url().includes('should_verify_email')) {
      console.log('6. メール確認画面をスキップ...');
      await page.goto('http://localhost:8065/login');
      await page.waitForTimeout(2000);
    }

    // ログイン
    console.log('7. 作成したアカウントでログイン...');
    const needsLogin = await page.locator('input[name="loginId"]').isVisible();
    if (needsLogin) {
      await page.fill('input[name="loginId"]', setupInfo.username);
      await page.fill('input[name="password"]', setupInfo.password);
      await page.click('button[type="submit"]:has-text("Log")');
      await page.waitForTimeout(3000);
    }

    // チーム作成または選択画面
    const createTeamVisible = await page.locator('text=Create a team').isVisible();
    if (createTeamVisible) {
      console.log('8. チーム作成...');
      await page.click('text=Create a team');
      await page.waitForTimeout(2000);
      
      // チーム名入力
      await page.fill('input[name="name"]', setupInfo.teamName);
      await page.waitForTimeout(500);
      
      // URL自動生成を待つ
      await page.waitForTimeout(1000);
      
      // Next/Create ボタンをクリック
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
    }

    // メイン画面に移動
    console.log('9. メイン画面に移動...');
    await page.goto(`http://localhost:8065/${setupInfo.teamUrl}/channels/town-square`);
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: 'auto-setup-4-main.png' });

    // チャンネル作成
    console.log('10. チャンネル作成開始...');
    for (const channel of setupInfo.channels) {
      console.log(`   - ${channel.displayName}を作成中...`);
      
      try {
        // サイドバーの+ボタンをクリック
        const addButton = await page.locator('.AddChannelDropdown button, [aria-label*="add"]').first();
        if (await addButton.isVisible()) {
          await addButton.click();
          await page.waitForTimeout(1000);
          
          // "Create New Channel"をクリック
          await page.click('text=Create New Channel');
          await page.waitForTimeout(1000);
          
          // チャンネル情報入力
          await page.fill('input[placeholder*="Channel name"]', channel.name);
          await page.fill('input[placeholder*="Channel display name"]', channel.displayName);
          
          // 作成ボタンクリック
          await page.click('button:has-text("Create Channel")');
          await page.waitForTimeout(2000);
          
          console.log(`   ✅ ${channel.displayName}作成完了`);
        }
      } catch (error) {
        console.log(`   ❌ ${channel.displayName}作成エラー:`, error.message);
      }
    }

    await page.screenshot({ path: 'auto-setup-5-complete.png' });

    console.log('');
    console.log('🎉 Mattermostセットアップ完了！');
    console.log('');
    console.log('=== 作成された認証情報 ===');
    console.log(`ユーザー名: ${setupInfo.username}`);
    console.log(`パスワード: ${setupInfo.password}`);
    console.log(`メール: ${setupInfo.email}`);
    console.log(`チーム: ${setupInfo.teamName}`);
    console.log('');
    console.log('=== 次のステップ ===');
    console.log('1. src/App.tsx の DEVELOPMENT_MODE を false に変更');
    console.log('2. npm run dev でアプリを再起動');
    console.log('3. 上記の認証情報でログイン');
    
  } catch (error) {
    console.error('❌ セットアップエラー:', error);
    await page.screenshot({ path: 'auto-setup-error.png' });
    console.log('');
    console.log('エラーが発生しました。手動でのセットアップが必要かもしれません。');
    console.log('SETUP_GUIDE.md を参照してください。');
  } finally {
    console.log('');
    console.log('📸 スクリーンショット:');
    console.log('- auto-setup-1-initial.png');
    console.log('- auto-setup-2-filled.png');
    console.log('- auto-setup-3-after-create.png');
    console.log('- auto-setup-4-main.png');
    console.log('- auto-setup-5-complete.png');
    
    await browser.close();
  }
}

autoSetupMattermost().catch(console.error);