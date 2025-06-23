import { chromium } from 'playwright';

async function takeDemoScreenshots() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  try {
    console.log('📸 デモモードでスクリーンショット撮影を開始します...');

    // 1. 本船選択画面（初期画面）
    console.log('1. 本船選択画面を開きます...');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ 
      path: 'test-results/demo-01-channel-selection.png',
      fullPage: true 
    });

    // 2. 本船カードのホバー効果
    console.log('2. 本船カードのホバー効果を確認します...');
    const firstCard = await page.locator('.MuiCard-root').first();
    if (await firstCard.count() > 0) {
      await firstCard.hover();
      await page.waitForTimeout(500);
      await page.screenshot({ 
        path: 'test-results/demo-02-channel-hover.png',
        fullPage: true 
      });
    }

    // 3. 2番目の本船カードをホバー
    console.log('3. 別の本船カードをホバーします...');
    const secondCard = await page.locator('.MuiCard-root').nth(1);
    if (await secondCard.count() > 0) {
      await secondCard.hover();
      await page.waitForTimeout(500);
      await page.screenshot({ 
        path: 'test-results/demo-03-channel-hover-2.png',
        fullPage: true 
      });
    }

    // 4. 本船を選択してメイン画面へ遷移
    console.log('4. 本船を選択してメイン画面へ遷移します...');
    await page.click('.MuiCard-root:first-child');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ 
      path: 'test-results/demo-04-main-screen.png',
      fullPage: true 
    });

    // 5. チャットバブルをクリック
    console.log('5. チャットバブルをクリックします...');
    const chatBubble = await page.locator('[data-testid="chat-bubble"], .MuiFab-root').first();
    if (await chatBubble.count() > 0) {
      await chatBubble.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ 
        path: 'test-results/demo-05-chat-popup.png',
        fullPage: true 
      });
    }

    // 6. チャット画面を閉じて、再度本船選択画面へ
    console.log('6. ブラウザの戻るボタンで本船選択画面に戻ります...');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    await page.screenshot({ 
      path: 'test-results/demo-06-back-to-channels.png',
      fullPage: true 
    });

    console.log('✅ デモモードのスクリーンショット撮影が完了しました！');
    console.log('📂 結果は test-results フォルダに保存されました。');

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  } finally {
    await page.waitForTimeout(3000); // 最後の画面を確認できるように少し待機
    await browser.close();
  }
}

// スクリプトを実行
takeDemoScreenshots();