import { chromium } from 'playwright';

async function takeScreenshots() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('📸 スクリーンショット撮影を開始します...');

    // 1. ログイン画面
    console.log('1. ログイン画面を開きます...');
    await page.goto('http://localhost:5174');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: 'test-results/01-login-screen.png',
      fullPage: true 
    });

    // 2. ログイン実行
    console.log('2. ログインします...');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.screenshot({ 
      path: 'test-results/02-login-filled.png',
      fullPage: true 
    });
    
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 3. 本船選択画面
    console.log('3. 本船選択画面を確認します...');
    await page.screenshot({ 
      path: 'test-results/03-vessel-selection.png',
      fullPage: true 
    });

    // 4. 本船カードのホバー効果
    console.log('4. 本船カードのホバー効果を確認します...');
    const firstCard = await page.locator('.MuiCard-root').first();
    if (firstCard) {
      await firstCard.hover();
      await page.waitForTimeout(500);
      await page.screenshot({ 
        path: 'test-results/04-channel-hover.png',
        fullPage: true 
      });
    }

    // 5. 本船を選択してメイン画面へ遷移
    console.log('5. 本船を選択します...');
    await page.click('.MuiCard-root:first-child');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 6. メイン画面とチャットバブル
    console.log('6. メイン画面を確認します...');
    await page.screenshot({ 
      path: 'test-results/05-main-screen.png',
      fullPage: true 
    });

    // 7. チャットバブルをクリック
    console.log('7. チャットバブルをクリックします...');
    const chatBubble = await page.locator('[data-testid="chat-bubble"], .MuiFab-root').first();
    if (chatBubble) {
      await chatBubble.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ 
        path: 'test-results/06-chat-popup.png',
        fullPage: true 
      });
    }

    console.log('✅ スクリーンショット撮影が完了しました！');
    console.log('📂 結果は test-results フォルダに保存されました。');

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  } finally {
    await browser.close();
  }
}

// スクリプトを実行
takeScreenshots();