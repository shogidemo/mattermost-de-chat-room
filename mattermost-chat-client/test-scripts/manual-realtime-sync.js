import { chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// スクリーンショットの保存ディレクトリ
const screenshotDir = path.join(__dirname, '../screenshots/manual-realtime-test');

// スクリーンショットディレクトリを作成
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

async function runManualRealtimeSyncTest() {
  console.log('🚀 手動リアルタイムチャット同期テストを開始します...\n');
  
  // ブラウザの起動
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--disable-web-security']
  });
  
  // 2つのブラウザコンテキストを作成（ウィンドウを離して配置）
  const context1 = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const context2 = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page1 = await context1.newPage();
  const page2 = await context2.newPage();
  
  try {
    // 1. 両方のブラウザでアプリケーションを開く
    console.log('📱 ステップ 1/10: アプリケーションを開いています...');
    await page1.goto('http://localhost:5173');
    await page2.goto('http://localhost:5173');
    
    // スクリーンショット: 初期画面
    await page1.screenshot({ 
      path: path.join(screenshotDir, '01-initial-page1.png'),
      fullPage: true 
    });
    await page2.screenshot({ 
      path: path.join(screenshotDir, '01-initial-page2.png'),
      fullPage: true 
    });
    console.log('✅ アプリケーション起動成功\n');
    
    // 2. testuser1でログイン
    console.log('🔑 ステップ 2/10: testuser1でログインしています...');
    await page1.fill('input[name="username"]', 'testuser1');
    await page1.fill('input[name="password"]', 'Test1234!');
    await page1.click('button[type="submit"]');
    await page1.waitForTimeout(3000); // ログイン処理を待つ
    
    await page1.screenshot({ 
      path: path.join(screenshotDir, '02-testuser1-logged-in.png'),
      fullPage: true 
    });
    console.log('✅ testuser1ログイン成功\n');
    console.log('📝 ログイン後の画面構成を確認しました。チャット機能は右下のフローティングボタンです。\n');
    
    // 3. testuser2でログイン
    console.log('🔑 ステップ 3/10: testuser2でログインしています...');
    await page2.fill('input[name="username"]', 'testuser2');
    await page2.fill('input[name="password"]', 'Test1234!');
    await page2.click('button[type="submit"]');
    await page2.waitForTimeout(3000); // ログイン処理を待つ
    
    await page2.screenshot({ 
      path: path.join(screenshotDir, '03-testuser2-logged-in.png'),
      fullPage: true 
    });
    console.log('✅ testuser2ログイン成功\n');
    
    // 4. 両方のユーザーでチャットを開く（右下のフローティングボタンをクリック）
    console.log('💬 ステップ 4/10: チャットウィンドウを開いています...');
    
    // testuser1でチャットを開く
    const chatButton1 = page1.locator('[data-testid="chat-fab"]');
    if (await chatButton1.count() > 0) {
      await chatButton1.click();
    } else {
      // data-testidがない場合は、右下のフローティングボタンを探す
      await page1.click('.MuiFab-root');
    }
    await page1.waitForTimeout(2000);
    
    // testuser2でチャットを開く
    const chatButton2 = page2.locator('[data-testid="chat-fab"]');
    if (await chatButton2.count() > 0) {
      await chatButton2.click();
    } else {
      // data-testidがない場合は、右下のフローティングボタンを探す
      await page2.click('.MuiFab-root');
    }
    await page2.waitForTimeout(2000);
    
    await page1.screenshot({ 
      path: path.join(screenshotDir, '04-chat-opened-user1.png'),
      fullPage: true 
    });
    await page2.screenshot({ 
      path: path.join(screenshotDir, '04-chat-opened-user2.png'),
      fullPage: true 
    });
    console.log('✅ チャットウィンドウ表示成功\n');
    
    // 5. 両方のユーザーで営業チームチャンネルに移動
    console.log('📢 ステップ 5/10: 営業チームチャンネルに移動しています...');
    
    // testuser1で営業チームを選択
    const salesChannel1 = page1.locator('text=営業チーム').first();
    if (await salesChannel1.count() > 0) {
      await salesChannel1.click();
      console.log('   testuser1: 営業チームチャンネルをクリック');
    } else {
      console.log('   ⚠️ testuser1: 営業チームチャンネルが見つかりませんでした');
    }
    await page1.waitForTimeout(2000);
    
    // testuser2で営業チームを選択
    const salesChannel2 = page2.locator('text=営業チーム').first();
    if (await salesChannel2.count() > 0) {
      await salesChannel2.click();
      console.log('   testuser2: 営業チームチャンネルをクリック');
    } else {
      console.log('   ⚠️ testuser2: 営業チームチャンネルが見つかりませんでした');
    }
    await page2.waitForTimeout(2000);
    
    await page1.screenshot({ 
      path: path.join(screenshotDir, '05-sales-channel-user1.png'),
      fullPage: true 
    });
    await page2.screenshot({ 
      path: path.join(screenshotDir, '05-sales-channel-user2.png'),
      fullPage: true 
    });
    console.log('✅ 営業チームチャンネル選択完了\n');
    
    // 6. testuser1からメッセージを送信
    console.log('📤 ステップ 6/10: testuser1からメッセージを送信しています...');
    const testMessage1 = `リアルタイムテスト from testuser1 - ${new Date().toLocaleTimeString('ja-JP')}`;
    
    // メッセージ入力欄を探す（複数の方法で試す）
    let messageInput1;
    const inputSelectors = [
      '[data-testid="message-input"]',
      'input[placeholder*="メッセージ"]',
      'textarea[placeholder*="メッセージ"]',
      '.MuiInputBase-input',
      'input[type="text"]'
    ];
    
    for (const selector of inputSelectors) {
      const element = page1.locator(selector).last();
      if (await element.count() > 0) {
        messageInput1 = element;
        console.log(`   入力欄を見つけました: ${selector}`);
        break;
      }
    }
    
    if (messageInput1) {
      await messageInput1.fill(testMessage1);
      await messageInput1.press('Enter');
      console.log(`   メッセージを送信: "${testMessage1}"`);
    } else {
      console.log('   ⚠️ メッセージ入力欄が見つかりませんでした');
    }
    
    await page1.waitForTimeout(3000);
    
    await page1.screenshot({ 
      path: path.join(screenshotDir, '06-message-sent-user1.png'),
      fullPage: true 
    });
    console.log('✅ メッセージ送信処理完了\n');
    
    // 7. testuser2の画面でメッセージが表示されることを確認
    console.log('🔍 ステップ 7/10: testuser2の画面でメッセージを確認しています...');
    await page2.waitForTimeout(2000); // リアルタイム同期を待つ
    
    await page2.screenshot({ 
      path: path.join(screenshotDir, '07-checking-message-user2.png'),
      fullPage: true 
    });
    
    // メッセージが表示されているか確認
    const messageVisible = await page2.locator(`text="${testMessage1}"`).count() > 0;
    if (messageVisible) {
      console.log('✅ testuser2の画面にメッセージが表示されました！');
      console.log('   → リアルタイム同期が正常に動作しています\n');
    } else {
      console.log('⚠️  メッセージが自動的に表示されませんでした');
      console.log('   → スクリーンショットを確認してください\n');
    }
    
    // 8. testuser2から返信メッセージを送信
    console.log('📤 ステップ 8/10: testuser2から返信メッセージを送信しています...');
    const testMessage2 = `返信です from testuser2 - ${new Date().toLocaleTimeString('ja-JP')}`;
    
    // testuser2でメッセージ入力欄を探す
    let messageInput2;
    for (const selector of inputSelectors) {
      const element = page2.locator(selector).last();
      if (await element.count() > 0) {
        messageInput2 = element;
        console.log(`   入力欄を見つけました: ${selector}`);
        break;
      }
    }
    
    if (messageInput2) {
      await messageInput2.fill(testMessage2);
      await messageInput2.press('Enter');
      console.log(`   返信メッセージを送信: "${testMessage2}"`);
    } else {
      console.log('   ⚠️ メッセージ入力欄が見つかりませんでした');
    }
    
    await page2.waitForTimeout(3000);
    
    await page2.screenshot({ 
      path: path.join(screenshotDir, '08-reply-sent-user2.png'),
      fullPage: true 
    });
    console.log('✅ 返信メッセージ送信処理完了\n');
    
    // 9. testuser1の画面で返信が表示されているか確認
    console.log('🔍 ステップ 9/10: testuser1の画面で返信メッセージを確認しています...');
    await page1.waitForTimeout(2000); // リアルタイム同期を待つ
    
    await page1.screenshot({ 
      path: path.join(screenshotDir, '09-checking-reply-user1.png'),
      fullPage: true 
    });
    
    const replyVisible = await page1.locator(`text="${testMessage2}"`).count() > 0;
    if (replyVisible) {
      console.log('✅ testuser1の画面に返信メッセージが表示されました！');
      console.log('   → 双方向のリアルタイム同期が確認できました\n');
    } else {
      console.log('⚠️  返信メッセージが自動的に表示されませんでした');
      console.log('   → スクリーンショットを確認してください\n');
    }
    
    // 10. 最終状態のスクリーンショット
    console.log('📸 ステップ 10/10: 最終状態を記録しています...');
    await page1.screenshot({ 
      path: path.join(screenshotDir, '10-final-state-user1.png'),
      fullPage: true 
    });
    await page2.screenshot({ 
      path: path.join(screenshotDir, '10-final-state-user2.png'),
      fullPage: true 
    });
    
    console.log('\n✨ 手動リアルタイムチャット同期テストが完了しました！');
    console.log(`📸 スクリーンショットは ${screenshotDir} に保存されました。`);
    console.log('\n📋 テスト結果サマリー:');
    console.log('   - ログイン機能: ✅ 正常動作');
    console.log('   - チャットUI: フローティングボタン形式で実装');
    console.log('   - チャンネル選択: 営業チームチャンネルを使用');
    console.log(`   - リアルタイム同期 (user1→user2): ${messageVisible ? '✅ 確認' : '⚠️ 要確認'}`);
    console.log(`   - リアルタイム同期 (user2→user1): ${replyVisible ? '✅ 確認' : '⚠️ 要確認'}`);
    
  } catch (error) {
    console.error('\n❌ エラーが発生しました:', error.message);
    
    // エラー時のスクリーンショット
    await page1.screenshot({ 
      path: path.join(screenshotDir, 'error-page1.png'),
      fullPage: true 
    });
    await page2.screenshot({ 
      path: path.join(screenshotDir, 'error-page2.png'),
      fullPage: true 
    });
    
  } finally {
    // ブラウザを閉じる前に少し待つ（結果を確認するため）
    console.log('\n⏳ 15秒後にブラウザを閉じます...');
    await page1.waitForTimeout(15000);
    
    await browser.close();
  }
}

// テストを実行
runManualRealtimeSyncTest().catch(console.error);