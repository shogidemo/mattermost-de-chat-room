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
    const screenshotDir = './test-results/channel-check-v2';
    await fs.mkdir(screenshotDir, { recursive: true });

    console.log('2. 初期画面のスクリーンショットを撮影...');
    await page.screenshot({ 
      path: path.join(screenshotDir, '01-initial.png'),
      fullPage: true 
    });

    // ログイン
    console.log('3. ログインします...');
    await page.fill('input[name="username"]', 'sho1');
    await page.fill('input[name="password"]', 'sho12345');
    await page.screenshot({ 
      path: path.join(screenshotDir, '02-login-filled.png'),
      fullPage: true 
    });
    
    await page.click('button[type="submit"]');
    console.log('   ログインボタンをクリックしました。応答を待っています...');
    
    // ログイン後の画面を待つ
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');
    
    console.log('4. ログイン後の画面...');
    await page.screenshot({ 
      path: path.join(screenshotDir, '03-after-login.png'),
      fullPage: true 
    });

    // 船舶選択画面の確認
    try {
      await page.waitForSelector('text=Pacific Glory', { timeout: 5000 });
      console.log('5. 船舶選択画面が表示されました。Pacific Gloryを選択...');
      await page.click('text=Pacific Glory');
      await page.waitForTimeout(3000);
      
      await page.screenshot({ 
        path: path.join(screenshotDir, '04-after-vessel-select.png'),
        fullPage: true 
      });
    } catch (e) {
      console.log('   船舶選択画面が表示されませんでした。');
    }

    // チャットバブルの確認
    console.log('6. チャットバブルを探しています...');
    const fabButton = await page.locator('.MuiFab-root, [aria-label*="chat"], [aria-label*="チャット"]').first();
    if (await fabButton.count() > 0) {
      console.log('   チャットバブルが見つかりました。クリックします...');
      await fabButton.click();
      await page.waitForTimeout(2000);
      
      await page.screenshot({ 
        path: path.join(screenshotDir, '05-chat-popup.png'),
        fullPage: true 
      });
    } else {
      console.log('   チャットバブルが見つかりませんでした。');
    }

    // チャンネルセレクターの確認
    console.log('7. チャンネルセレクターを確認...');
    const channelSelector = await page.locator('.MuiDialog-root, [role="dialog"]').first();
    if (await channelSelector.count() > 0) {
      console.log('   チャンネルセレクターが開きました。');
      
      // チャンネルリストの取得
      const channelItems = await page.locator('[role="listitem"], .MuiListItem-root').all();
      console.log(`\n✅ 表示されているチャンネル数: ${channelItems.length}`);
      
      if (channelItems.length > 0) {
        console.log('\nチャンネル一覧:');
        for (let i = 0; i < Math.min(channelItems.length, 10); i++) {
          const channelText = await channelItems[i].textContent();
          console.log(`  ${i + 1}. ${channelText.trim()}`);
        }
        
        await page.screenshot({ 
          path: path.join(screenshotDir, '06-channels-visible.png'),
          fullPage: true 
        });
        
        // 最初のチャンネルをクリック
        if (channelItems.length > 0) {
          console.log('\n8. 最初のチャンネルを選択します...');
          await channelItems[0].click();
          await page.waitForTimeout(2000);
          
          await page.screenshot({ 
            path: path.join(screenshotDir, '07-channel-selected.png'),
            fullPage: true 
          });
          
          // チャット画面の確認
          const messageInput = await page.locator('input[placeholder*="メッセージ"], textarea[placeholder*="メッセージ"]').first();
          if (await messageInput.count() > 0) {
            console.log('9. チャット画面が表示されました！');
            await page.screenshot({ 
              path: path.join(screenshotDir, '08-chat-screen.png'),
              fullPage: true 
            });
          }
        }
      } else {
        console.log('❌ チャンネルが表示されていません');
        await page.screenshot({ 
          path: path.join(screenshotDir, '06-no-channels.png'),
          fullPage: true 
        });
      }
    }

    // コンソールエラーの確認
    console.log('\n📋 コンソールエラーを確認中...');
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('コンソールエラー:', msg.text());
      }
    });

    console.log('\n📸 スクリーンショットは以下に保存されました:');
    console.log(path.resolve(screenshotDir));

    // ブラウザは開いたままにする
    console.log('\n🔍 ブラウザで手動確認してください。終了するにはCtrl+Cを押してください。');
    await new Promise(() => {}); // 無限に待機

  } catch (error) {
    console.error('エラーが発生しました:', error);
    await page.screenshot({ 
      path: './test-results/channel-check-v2/error.png',
      fullPage: true 
    });
  }
}

checkChannels();