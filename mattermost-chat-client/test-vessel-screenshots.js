import { chromium } from 'playwright';

async function takeVesselScreenshots() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  try {
    console.log('📸 本船選択画面のスクリーンショット撮影を開始します...');

    // 1. 本船選択画面（初期画面）
    console.log('1. 本船選択画面を開きます...');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ 
      path: 'test-results/vessel-01-selection-screen.png',
      fullPage: true 
    });

    // 2. 本船カードのホバー効果（Pacific Glory）
    console.log('2. Pacific Glory号のカードをホバーします...');
    const firstCard = await page.locator('.MuiCard-root').first();
    if (await firstCard.count() > 0) {
      await firstCard.hover();
      await page.waitForTimeout(500);
      await page.screenshot({ 
        path: 'test-results/vessel-02-hover-pacific-glory.png',
        fullPage: true 
      });
    }

    // 3. 別の本船カードをホバー（Ocean Dream）
    console.log('3. Ocean Dream号のカードをホバーします...');
    const secondCard = await page.locator('.MuiCard-root').nth(1);
    if (await secondCard.count() > 0) {
      await secondCard.hover();
      await page.waitForTimeout(500);
      await page.screenshot({ 
        path: 'test-results/vessel-03-hover-ocean-dream.png',
        fullPage: true 
      });
    }

    // 4. 本船を選択してメイン画面へ遷移
    console.log('4. Pacific Glory号を選択してメイン画面へ遷移します...');
    await page.click('.MuiCard-root:first-child');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ 
      path: 'test-results/vessel-04-main-screen-pacific-glory.png',
      fullPage: true 
    });

    // 5. チャットバブルをクリック
    console.log('5. チャットバブルをクリックします...');
    const chatBubble = await page.locator('[data-testid="chat-bubble"], .MuiFab-root').first();
    if (await chatBubble.count() > 0) {
      await chatBubble.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ 
        path: 'test-results/vessel-05-chat-popup.png',
        fullPage: true 
      });
      
      // チャットポップアップを閉じる
      const closeButton = await page.locator('[aria-label="close"]').first();
      if (await closeButton.count() > 0) {
        await closeButton.click();
        await page.waitForTimeout(500);
      }
    }

    // 6. ブラウザの戻るボタンで本船選択画面に戻る
    console.log('6. ブラウザをリロードして本船選択画面に戻ります...');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    // 7. 別の本船（Grain Master）を選択
    console.log('7. Grain Master号を選択します...');
    await page.click('.MuiCard-root:nth-child(3)');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ 
      path: 'test-results/vessel-06-main-screen-grain-master.png',
      fullPage: true 
    });

    console.log('✅ 本船選択画面のスクリーンショット撮影が完了しました！');
    console.log('📂 結果は test-results フォルダに保存されました。');

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

// スクリプトを実行
takeVesselScreenshots();