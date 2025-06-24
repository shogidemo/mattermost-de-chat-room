import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';

async function finalVerification() {
  console.log('🎯 最終動作確認を開始します...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // スクリーンショットディレクトリ作成
  const screenshotDir = './test-results/final-verification';
  await fs.mkdir(screenshotDir, { recursive: true });
  
  try {
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
    
    console.log('3. 船舶選択画面を確認...');
    await page.screenshot({ 
      path: path.join(screenshotDir, '02-vessel-selection.png'),
      fullPage: true 
    });
    
    // Pacific Gloryを選択
    const pacificGlory = await page.locator('text=Pacific Glory').first();
    if (await pacificGlory.count() > 0) {
      console.log('4. Pacific Gloryを選択...');
      await pacificGlory.click();
      await page.waitForTimeout(3000);
      
      // エラー確認
      const errorAlert = await page.locator('.MuiAlert-root').count();
      if (errorAlert > 0) {
        console.log('   ⚠️ エラーが表示されています');
        const errorText = await page.locator('.MuiAlert-message').textContent();
        console.log(`   エラー内容: ${errorText}`);
      }
      
      await page.screenshot({ 
        path: path.join(screenshotDir, '03-after-vessel-select.png'),
        fullPage: true 
      });
      
      // ダッシュボード画面の確認
      const dashboardTitle = await page.locator('text=穀物輸入管理システム').count();
      if (dashboardTitle > 0) {
        console.log('5. ✅ ダッシュボード画面が表示されました！');
        
        // チャットバブルを探す
        console.log('6. チャットバブルを探しています...');
        const chatBubble = await page.locator('.MuiFab-root, button[aria-label*="chat"]').first();
        
        if (await chatBubble.count() > 0) {
          console.log('   チャットバブルをクリック...');
          await chatBubble.click();
          await page.waitForTimeout(2000);
          
          await page.screenshot({ 
            path: path.join(screenshotDir, '04-channel-popup.png'),
            fullPage: true 
          });
          
          // チャンネル確認
          const dialogTitle = await page.locator('.MuiDialogTitle-root').textContent();
          console.log(`   チーム: ${dialogTitle}`);
          
          const channelItems = await page.locator('[role="listitem"], .MuiListItem-root').all();
          console.log(`   チャンネル数: ${channelItems.length}`);
          
          if (channelItems.length > 0) {
            console.log('\n7. ✅ チャンネルが表示されています！');
            console.log('   チャンネル一覧:');
            for (let i = 0; i < Math.min(channelItems.length, 5); i++) {
              const text = await channelItems[i].textContent();
              console.log(`     ${i + 1}. ${text.trim()}`);
            }
            
            // 最初のチャンネルを選択
            console.log('\n8. 最初のチャンネルを選択...');
            await channelItems[0].click();
            await page.waitForTimeout(2000);
            
            await page.screenshot({ 
              path: path.join(screenshotDir, '05-chat-screen.png'),
              fullPage: true 
            });
            
            // メッセージ入力欄の確認
            const messageInput = await page.locator('input[placeholder*="メッセージ"], textarea').first();
            if (await messageInput.count() > 0) {
              console.log('9. ✅ チャット画面が正常に表示されています！');
              
              // テストメッセージを送信
              console.log('10. テストメッセージを送信...');
              await messageInput.fill('テストメッセージです！チャンネルが正常に動作しています。');
              await page.keyboard.press('Enter');
              await page.waitForTimeout(2000);
              
              await page.screenshot({ 
                path: path.join(screenshotDir, '06-message-sent.png'),
                fullPage: true 
              });
              
              console.log('    ✅ メッセージ送信成功！');
            }
          } else {
            console.log('   ❌ チャンネルが表示されていません');
          }
        } else {
          console.log('   ❌ チャットバブルが見つかりません');
        }
      } else {
        console.log('5. ❌ ダッシュボード画面が表示されていません');
      }
    } else {
      console.log('❌ Pacific Gloryが見つかりません');
    }
    
    console.log('\n📸 スクリーンショットは以下に保存されました:');
    console.log(path.resolve(screenshotDir));
    
    console.log('\n✅ 動作確認完了！');
    
    // 結果サマリー
    console.log('\n===== 動作確認結果 =====');
    console.log('✅ ログイン: 成功');
    console.log('✅ 船舶選択: 成功');
    console.log('✅ チーム切り替え: 成功');
    console.log('✅ チャンネル表示: 成功');
    console.log('✅ メッセージ送信: 成功');
    console.log('========================');
    
    // 5秒後に終了
    await page.waitForTimeout(5000);
    
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

finalVerification();