import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';

async function checkChannels() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('1. アプリケーションにアクセス...');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // スクリーンショットディレクトリ作成
    const screenshotDir = './test-results/channel-check';
    await fs.mkdir(screenshotDir, { recursive: true });

    console.log('2. 初期画面のスクリーンショットを撮影...');
    await page.screenshot({ 
      path: path.join(screenshotDir, '01-initial.png'),
      fullPage: true 
    });

    // ログイン画面が表示されるか確認
    const loginForm = await page.locator('text=ログイン').first();
    if (await loginForm.isVisible()) {
      console.log('3. ログイン画面が表示されました。ログインします...');
      
      // ログイン
      await page.fill('input[name="username"]', 'sho1');
      await page.fill('input[name="password"]', 'sho12345');
      await page.screenshot({ 
        path: path.join(screenshotDir, '02-login-filled.png'),
        fullPage: true 
      });
      
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
      
      console.log('4. ログイン後の画面...');
      await page.screenshot({ 
        path: path.join(screenshotDir, '03-after-login.png'),
        fullPage: true 
      });
    }

    // 船舶選択画面の確認
    const vesselCard = await page.locator('text=Pacific Glory').first();
    if (await vesselCard.isVisible()) {
      console.log('5. 船舶選択画面が表示されました。Pacific Gloryを選択...');
      await page.click('text=Pacific Glory');
      await page.waitForTimeout(2000);
      
      await page.screenshot({ 
        path: path.join(screenshotDir, '04-after-vessel-select.png'),
        fullPage: true 
      });
    }

    // チャットバブルをクリック
    const chatBubble = await page.locator('[data-testid="chat-bubble"], .MuiFab-root').first();
    if (await chatBubble.isVisible()) {
      console.log('6. チャットバブルをクリック...');
      await chatBubble.click();
      await page.waitForTimeout(1000);
      
      await page.screenshot({ 
        path: path.join(screenshotDir, '05-chat-popup.png'),
        fullPage: true 
      });
    }

    // チャンネルリストの確認
    const channels = await page.locator('[role="listitem"], .channel-item').all();
    console.log(`\n✅ 表示されているチャンネル数: ${channels.length}`);
    
    if (channels.length > 0) {
      console.log('チャンネル一覧:');
      for (let i = 0; i < Math.min(channels.length, 10); i++) {
        const channelText = await channels[i].textContent();
        console.log(`  - ${channelText}`);
      }
      
      await page.screenshot({ 
        path: path.join(screenshotDir, '06-channels-visible.png'),
        fullPage: true 
      });
    } else {
      console.log('❌ チャンネルが表示されていません');
      
      // デベロッパーツールでエラーを確認
      const consoleMessages = [];
      page.on('console', msg => consoleMessages.push(msg.text()));
      
      await page.screenshot({ 
        path: path.join(screenshotDir, '07-no-channels.png'),
        fullPage: true 
      });
    }

    console.log('\n📸 スクリーンショットは以下に保存されました:');
    console.log(path.resolve(screenshotDir));

    // ブラウザは開いたままにする
    console.log('\n🔍 ブラウザで手動確認してください。終了するにはCtrl+Cを押してください。');
    await new Promise(() => {}); // 無限に待機

  } catch (error) {
    console.error('エラーが発生しました:', error);
    await page.screenshot({ 
      path: './test-results/channel-check/error.png',
      fullPage: true 
    });
  }
}

checkChannels();