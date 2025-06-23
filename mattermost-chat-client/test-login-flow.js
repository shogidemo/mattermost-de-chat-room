import { chromium } from 'playwright';

async function testLoginFlow() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  try {
    console.log('📸 ログインフローのテストを開始します...');

    // 1. ログイン画面
    console.log('1. ログイン画面を開きます...');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ 
      path: 'test-results/login-flow-01-login.png',
      fullPage: true 
    });

    // 2. デモアカウントでログイン（Mattermostサーバーが無い場合用）
    console.log('2. デモアカウントでログインを試みます...');
    
    // まずデモアカウントでログイン
    await page.fill('input[name="username"]', 'demo');
    await page.fill('input[name="password"]', 'demo');
    await page.screenshot({ 
      path: 'test-results/login-flow-02-demo-filled.png',
      fullPage: true 
    });
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // 3. チャンネル選択画面の確認
    console.log('3. チャンネル選択画面を確認します...');
    const hasChannelSelection = await page.locator('text=チャンネルを選択してください').count() > 0;
    
    if (hasChannelSelection) {
      console.log('✅ チャンネル選択画面が表示されました！');
      await page.screenshot({ 
        path: 'test-results/login-flow-03-channel-selection.png',
        fullPage: true 
      });
      
      // チャンネルカードの確認
      const channelCards = await page.locator('.MuiCard-root').count();
      console.log(`📋 表示されているチャンネル数: ${channelCards}`);
      
      if (channelCards > 0) {
        // 最初のチャンネルをホバー
        await page.locator('.MuiCard-root').first().hover();
        await page.waitForTimeout(500);
        await page.screenshot({ 
          path: 'test-results/login-flow-04-channel-hover.png',
          fullPage: true 
        });
        
        // チャンネルを選択
        await page.locator('.MuiCard-root').first().click();
        await page.waitForTimeout(2000);
        await page.screenshot({ 
          path: 'test-results/login-flow-05-main-screen.png',
          fullPage: true 
        });
      }
    } else {
      console.log('❌ チャンネル選択画面が表示されませんでした');
      await page.screenshot({ 
        path: 'test-results/login-flow-03-no-channel-selection.png',
        fullPage: true 
      });
    }

    console.log('✅ ログインフローのテストが完了しました！');
    console.log('📂 結果は test-results フォルダに保存されました。');

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    await page.screenshot({ 
      path: 'test-results/login-flow-error.png',
      fullPage: true 
    });
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

// スクリプトを実行
testLoginFlow();