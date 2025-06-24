import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';

async function checkChannelsAsAdmin() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('1. アプリケーションにアクセス...');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // スクリーンショットディレクトリ作成
    const screenshotDir = './test-results/channel-check-admin';
    await fs.mkdir(screenshotDir, { recursive: true });

    console.log('2. 管理者でログイン...');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'Admin123456!');
    await page.screenshot({ 
      path: path.join(screenshotDir, '01-login.png'),
      fullPage: true 
    });
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    console.log('3. ログイン後の画面...');
    await page.screenshot({ 
      path: path.join(screenshotDir, '02-after-login.png'),
      fullPage: true 
    });

    // 船舶選択
    try {
      await page.waitForSelector('text=Pacific Glory', { timeout: 5000 });
      console.log('4. Pacific Gloryを選択...');
      await page.click('text=Pacific Glory');
      await page.waitForTimeout(3000);
      
      await page.screenshot({ 
        path: path.join(screenshotDir, '03-after-vessel-select.png'),
        fullPage: true 
      });
    } catch (e) {
      console.log('   船舶選択画面が表示されませんでした。');
    }

    // チャットバブルを探す
    console.log('5. チャットバブルを探しています...');
    const fabButton = await page.locator('.MuiFab-root').first();
    
    if (await fabButton.count() > 0) {
      console.log('   チャットバブルをクリック...');
      await fabButton.click();
      await page.waitForTimeout(2000);
      
      await page.screenshot({ 
        path: path.join(screenshotDir, '04-channel-popup.png'),
        fullPage: true 
      });
      
      // チャンネル数を確認
      const channelItems = await page.locator('[role="listitem"], .MuiListItem-root').all();
      console.log(`\n✅ 表示されているチャンネル数: ${channelItems.length}`);
      
      if (channelItems.length > 0) {
        console.log('\nチャンネル一覧:');
        for (let i = 0; i < Math.min(channelItems.length, 5); i++) {
          const text = await channelItems[i].textContent();
          console.log(`  ${i + 1}. ${text.trim()}`);
        }
        
        // 最初のチャンネルを選択
        console.log('\n6. 最初のチャンネルを選択...');
        await channelItems[0].click();
        await page.waitForTimeout(2000);
        
        await page.screenshot({ 
          path: path.join(screenshotDir, '05-chat-screen.png'),
          fullPage: true 
        });
      }
    }

    console.log('\n📸 スクリーンショットは以下に保存されました:');
    console.log(path.resolve(screenshotDir));
    
    console.log('\n🔍 ブラウザで手動確認してください。終了するにはCtrl+Cを押してください。');
    await new Promise(() => {});

  } catch (error) {
    console.error('エラーが発生しました:', error);
  }
}

checkChannelsAsAdmin();