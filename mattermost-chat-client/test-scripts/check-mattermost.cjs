const { chromium } = require('playwright');

async function checkMattermost() {
  console.log('🔍 Mattermostサーバーの状態確認');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Mattermostサーバーに直接アクセス
    console.log('1. Mattermostサーバーにアクセス...');
    await page.goto('http://localhost:8065/');
    await page.waitForTimeout(3000);

    // スクリーンショット
    await page.screenshot({ path: 'mattermost-server.png', fullPage: true });
    console.log('📸 Mattermostサーバーのスクリーンショット: mattermost-server.png');

    // ログインフォームの確認
    const loginVisible = await page.isVisible('input[name="loginId"], input[id="loginId"]');
    const passwordVisible = await page.isVisible('input[name="password"], input[type="password"]');
    
    console.log('Mattermostログインフォーム:', { loginVisible, passwordVisible });

    if (loginVisible && passwordVisible) {
      console.log('2. 管理者でログイン試行...');
      
      // よくあるデフォルト認証情報を試行
      const credentials = [
        { username: 'admin', password: 'admin123' },
        { username: 'admin', password: 'password' },
        { username: 'sysadmin', password: 'sysadmin' },
        { username: 'test', password: 'test' }
      ];
      
      for (const cred of credentials) {
        console.log(`試行中: ${cred.username}/${cred.password}`);
        
        await page.fill('input[name="loginId"], input[id="loginId"]', cred.username);
        await page.fill('input[name="password"], input[type="password"]', cred.password);
        await page.click('button[type="submit"], button:has-text("ログイン"), button:has-text("Sign in")');
        
        await page.waitForTimeout(2000);
        
        // ログイン成功の確認
        const currentUrl = page.url();
        const hasError = await page.isVisible('.error, .alert-danger, [class*="error"]');
        
        console.log(`結果: URL=${currentUrl}, エラー=${hasError}`);
        
        if (!hasError && !currentUrl.includes('/login')) {
          console.log(`✅ ログイン成功: ${cred.username}/${cred.password}`);
          
          // 成功後のスクリーンショット
          await page.screenshot({ path: 'mattermost-logged-in.png', fullPage: true });
          
          // ユーザー一覧の確認
          console.log('3. ユーザー管理の確認...');
          
          // システムコンソールに移動
          const systemConsoleVisible = await page.isVisible('[data-testid="systemConsole"], a:has-text("システムコンソール"), a:has-text("System Console")');
          if (systemConsoleVisible) {
            await page.click('[data-testid="systemConsole"], a:has-text("システムコンソール"), a:has-text("System Console")');
            await page.waitForTimeout(2000);
          }
          
          // チーム作成の確認
          console.log('4. チーム・チャンネルの確認...');
          await page.goto('http://localhost:8065/');
          await page.waitForTimeout(2000);
          
          await page.screenshot({ path: 'mattermost-teams.png', fullPage: true });
          
          break;
        }
        
        await page.waitForTimeout(1000);
      }
    }

  } catch (error) {
    console.error('❌ エラー:', error);
    await page.screenshot({ path: 'mattermost-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
  
  console.log('✅ Mattermost確認完了');
}

checkMattermost().catch(console.error);