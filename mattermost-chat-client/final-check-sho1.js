import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';

async function finalCheckWithSho1() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('=== 最終動作確認 (sho1ユーザー) ===\n');
    
    // スクリーンショットディレクトリ作成
    const screenshotDir = './test-results/final-check-sho1';
    await fs.mkdir(screenshotDir, { recursive: true });

    console.log('1. アプリケーションにアクセス...');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    console.log('2. sho1でログイン...');
    await page.fill('input[name="username"]', 'sho1');
    await page.fill('input[name="password"]', 'sho12345');
    await page.screenshot({ 
      path: path.join(screenshotDir, '01-login.png'),
      fullPage: true 
    });
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    console.log('3. 船舶選択画面...');
    await page.screenshot({ 
      path: path.join(screenshotDir, '02-vessel-selection.png'),
      fullPage: true 
    });

    // Pacific Gloryを選択
    await page.waitForSelector('text=Pacific Glory', { timeout: 5000 });
    console.log('4. Pacific Gloryを選択...');
    await page.click('text=Pacific Glory');
    await page.waitForTimeout(3000);
    
    // エラーが表示されているか確認
    const errorAlert = await page.locator('.MuiAlert-root').count();
    if (errorAlert > 0) {
      console.log('   ❌ エラーが表示されています');
      const errorText = await page.locator('.MuiAlert-message').textContent();
      console.log(`   エラー内容: ${errorText}`);
    } else {
      console.log('   ✅ エラーなし');
    }
    
    await page.screenshot({ 
      path: path.join(screenshotDir, '03-after-vessel-select.png'),
      fullPage: true 
    });

    // ダッシュボード画面が表示されているか確認
    const dashboardTitle = await page.locator('text=穀物輸入管理システム').count();
    if (dashboardTitle > 0) {
      console.log('5. ✅ ダッシュボード画面が表示されました！');
      
      // チャットバブルをクリック
      console.log('6. チャットバブルをクリック...');
      const fabButton = await page.locator('.MuiFab-root').first();
      await fabButton.click();
      await page.waitForTimeout(2000);
      
      await page.screenshot({ 
        path: path.join(screenshotDir, '04-channel-popup.png'),
        fullPage: true 
      });
      
      // チャンネル一覧を確認
      const teamTitle = await page.locator('.MuiDialogTitle-root').textContent();
      console.log(`   チーム: ${teamTitle}`);
      
      const channelCount = await page.locator('[role="listitem"], .MuiListItem-root').count();
      console.log(`   チャンネル数: ${channelCount}`);
      
      if (channelCount > 0) {
        console.log('\n7. ✅ チャンネルが表示されています！');
        const channels = await page.locator('[role="listitem"], .MuiListItem-root').all();
        for (let i = 0; i < Math.min(channels.length, 5); i++) {
          const text = await channels[i].textContent();
          console.log(`   ${i + 1}. ${text.trim()}`);
        }
        
        // 最初のチャンネルを選択
        console.log('\n8. 最初のチャンネルを選択...');
        await channels[0].click();
        await page.waitForTimeout(2000);
        
        await page.screenshot({ 
          path: path.join(screenshotDir, '05-chat-screen.png'),
          fullPage: true 
        });
        
        console.log('   ✅ チャット画面が表示されました！');
      }
    } else {
      console.log('5. ❌ まだ船舶選択画面のままです');
    }

    console.log('\n📸 スクリーンショットは以下に保存されました:');
    console.log(path.resolve(screenshotDir));
    
    console.log('\n✅ 動作確認完了！');
    
    // 5秒後に終了
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('エラーが発生しました:', error);
  } finally {
    await browser.close();
  }
}

finalCheckWithSho1();