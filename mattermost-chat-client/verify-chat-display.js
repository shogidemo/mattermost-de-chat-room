import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';

async function verifyChatDisplay() {
  console.log('🔍 チャット表示の詳細確認を開始します...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // コンソールログをキャプチャ
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`[エラー] ${msg.text()}`);
    }
  });
  
  const screenshotDir = './test-results/chat-verification';
  await fs.mkdir(screenshotDir, { recursive: true });
  
  try {
    console.log('1. アプリケーションにアクセス...');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    
    console.log('2. sho1でログイン...');
    await page.fill('input[name="username"]', 'sho1');
    await page.fill('input[name="password"]', 'sho12345');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    console.log('3. 船舶選択画面の状態確認...');
    const vesselCards = await page.locator('.MuiCard-root').count();
    console.log(`  船舶カード数: ${vesselCards}`);
    
    console.log('4. Pacific Gloryを選択...');
    await page.locator('text=Pacific Glory').first().click();
    await page.waitForTimeout(5000);
    
    // エラーメッセージの確認
    const errorAlert = await page.locator('.MuiAlert-root').first();
    if (await errorAlert.count() > 0) {
      const errorText = await errorAlert.textContent();
      console.log(`  ⚠️ エラー発生: ${errorText}`);
      
      // エラーを閉じる
      const closeButton = await page.locator('.MuiAlert-root button').first();
      if (await closeButton.count() > 0) {
        await closeButton.click();
        await page.waitForTimeout(1000);
      }
    }
    
    // 現在の画面を確認
    console.log('\n5. 現在の画面状態を確認...');
    const currentUrl = page.url();
    console.log(`  URL: ${currentUrl}`);
    
    // タイトルで画面を判定
    const mainTitle = await page.locator('text=本船選択 - 穀物輸入管理システム').count();
    const dashboardTitle = await page.locator('text=穀物輸入管理システム').count();
    
    if (mainTitle > 0) {
      console.log('  📍 現在の画面: 船舶選択画面');
      
      // リロードして再試行
      console.log('\n6. ページをリロードして再試行...');
      await page.reload();
      await page.waitForTimeout(3000);
      
      // 再度船舶を選択
      console.log('7. 再度Pacific Gloryを選択...');
      await page.locator('text=Pacific Glory').first().click();
      await page.waitForTimeout(5000);
    }
    
    await page.screenshot({ 
      path: path.join(screenshotDir, '01-after-selection.png'),
      fullPage: true 
    });
    
    // チャットバブルを探す（複数のセレクタで試行）
    console.log('\n8. チャットバブルを探しています...');
    const chatBubbleSelectors = [
      '.MuiFab-root',
      'button[aria-label*="chat"]',
      'button[aria-label*="チャット"]',
      '[data-testid="chat-bubble"]',
      'button:has-text("💬")',
      'button svg[data-testid="ChatBubbleOutlineIcon"]'
    ];
    
    let chatBubbleFound = false;
    for (const selector of chatBubbleSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`  ✅ チャットバブル発見: ${selector}`);
        chatBubbleFound = true;
        
        // クリックして開く
        await page.locator(selector).first().click();
        await page.waitForTimeout(2000);
        
        await page.screenshot({ 
          path: path.join(screenshotDir, '02-chat-opened.png'),
          fullPage: true 
        });
        
        break;
      }
    }
    
    if (!chatBubbleFound) {
      console.log('  ❌ チャットバブルが見つかりません');
      
      // 開発者ツールでReactコンポーネントを確認
      console.log('\n9. Reactコンポーネント状態を確認...');
      const reactState = await page.evaluate(() => {
        const root = document.getElementById('root');
        if (root && root._reactRootContainer) {
          return 'React root found';
        }
        return 'React root not found';
      });
      console.log(`  ${reactState}`);
      
      // 画面要素の詳細確認
      console.log('\n10. 画面要素の詳細確認...');
      const elements = await page.evaluate(() => {
        return {
          buttons: document.querySelectorAll('button').length,
          fabs: document.querySelectorAll('.MuiFab-root').length,
          svgs: document.querySelectorAll('svg').length,
          chatIcons: document.querySelectorAll('[data-testid*="Chat"]').length
        };
      });
      console.log('  要素数:', elements);
    }
    
    console.log('\n✅ 確認完了');
    console.log(`📸 スクリーンショット: ${path.resolve(screenshotDir)}`);
    
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
    await page.screenshot({ 
      path: path.join(screenshotDir, 'error.png'),
      fullPage: true 
    });
  } finally {
    await browser.close();
  }
}

verifyChatDisplay();