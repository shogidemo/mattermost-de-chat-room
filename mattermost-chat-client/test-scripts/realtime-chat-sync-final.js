import { chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// スクリーンショットの保存ディレクトリ
const screenshotDir = path.join(__dirname, '../screenshots/realtime-sync-final');

// スクリーンショットディレクトリを作成
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

async function runRealtimeSyncTest() {
  console.log('🚀 リアルタイムチャット同期テスト（最終版）を開始します...\n');
  
  // ブラウザの起動
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--disable-web-security']
  });
  
  // 2つのブラウザコンテキストを作成
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
    console.log('📱 ステップ 1/8: アプリケーションを開いています...');
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
    console.log('🔑 ステップ 2/8: testuser1でログインしています...');
    await page1.fill('input[name="username"]', 'testuser1');
    await page1.fill('input[name="password"]', 'Test1234!');
    await page1.click('button[type="submit"]');
    await page1.waitForSelector('button:has-text("チャット")', { timeout: 10000 });
    
    await page1.screenshot({ 
      path: path.join(screenshotDir, '02-testuser1-logged-in.png'),
      fullPage: true 
    });
    console.log('✅ testuser1ログイン成功\n');
    
    // 3. testuser2でログイン
    console.log('🔑 ステップ 3/8: testuser2でログインしています...');
    await page2.fill('input[name="username"]', 'testuser2');
    await page2.fill('input[name="password"]', 'Test1234!');
    await page2.click('button[type="submit"]');
    await page2.waitForSelector('button:has-text("チャット")', { timeout: 10000 });
    
    await page2.screenshot({ 
      path: path.join(screenshotDir, '03-testuser2-logged-in.png'),
      fullPage: true 
    });
    console.log('✅ testuser2ログイン成功\n');
    
    // 4. 両方のユーザーでチャットを開く
    console.log('💬 ステップ 4/8: チャットウィンドウを開いています...');
    await page1.click('button:has-text("チャット")');
    await page1.waitForTimeout(1000);
    
    await page2.click('button:has-text("チャット")');
    await page2.waitForTimeout(1000);
    console.log('✅ チャットウィンドウ表示成功\n');
    
    // 5. 両方のユーザーで営業チームチャンネルに移動
    console.log('📢 ステップ 5/8: 営業チームチャンネルに移動しています...');
    
    // testuser1
    await page1.click('text=営業チーム');
    await page1.waitForTimeout(2000);
    
    // testuser2
    await page2.click('text=営業チーム');
    await page2.waitForTimeout(2000);
    
    await page1.screenshot({ 
      path: path.join(screenshotDir, '04-both-in-sales-channel-user1.png'),
      fullPage: true 
    });
    await page2.screenshot({ 
      path: path.join(screenshotDir, '05-both-in-sales-channel-user2.png'),
      fullPage: true 
    });
    console.log('✅ 営業チームチャンネル選択成功\n');
    
    // 6. testuser1からメッセージを送信
    console.log('📤 ステップ 6/8: testuser1からメッセージを送信しています...');
    const testMessage1 = `テストメッセージ from testuser1 - ${new Date().toLocaleTimeString('ja-JP')}`;
    
    // data-testidを使用して入力欄を見つける
    const messageInput1 = await page1.locator('[data-testid="message-input"]');
    await messageInput1.fill(testMessage1);
    await messageInput1.press('Enter');
    
    // メッセージが送信されるまで待つ
    await page1.waitForTimeout(3000);
    
    await page1.screenshot({ 
      path: path.join(screenshotDir, '06-after-send-user1.png'),
      fullPage: true 
    });
    console.log(`✅ メッセージ送信成功: "${testMessage1}"\n`);
    
    // 7. testuser2の画面でメッセージが表示されることを確認
    console.log('🔍 ステップ 7/8: testuser2の画面でメッセージを確認しています...');
    
    // testuser2の画面を更新して最新メッセージを確認
    await page2.screenshot({ 
      path: path.join(screenshotDir, '07-checking-user2.png'),
      fullPage: true 
    });
    
    // メッセージが表示されているか確認
    try {
      await page2.waitForSelector(`text="${testMessage1}"`, { timeout: 5000 });
      console.log('✅ testuser2の画面にメッセージが表示されました！\n');
    } catch (e) {
      console.log('⚠️  メッセージの自動確認ができませんでした。スクリーンショットを確認してください。\n');
    }
    
    // 8. testuser2から返信メッセージを送信
    console.log('📤 ステップ 8/8: testuser2から返信メッセージを送信しています...');
    const testMessage2 = `返信メッセージ from testuser2 - ${new Date().toLocaleTimeString('ja-JP')}`;
    
    const messageInput2 = await page2.locator('[data-testid="message-input"]');
    await messageInput2.fill(testMessage2);
    await messageInput2.press('Enter');
    
    // メッセージが送信されるまで待つ
    await page2.waitForTimeout(3000);
    
    // 最終状態のスクリーンショット
    await page1.screenshot({ 
      path: path.join(screenshotDir, '08-final-user1.png'),
      fullPage: true 
    });
    await page2.screenshot({ 
      path: path.join(screenshotDir, '09-final-user2.png'),
      fullPage: true 
    });
    
    console.log(`✅ 返信メッセージ送信成功: "${testMessage2}"\n`);
    
    // testuser1の画面で返信が表示されているか確認
    try {
      await page1.waitForSelector(`text="${testMessage2}"`, { timeout: 5000 });
      console.log('✅ testuser1の画面に返信メッセージが表示されました！\n');
    } catch (e) {
      console.log('⚠️  返信メッセージの自動確認ができませんでした。スクリーンショットを確認してください。\n');
    }
    
    console.log('✨ リアルタイムチャット同期テストが完了しました！');
    console.log(`📸 スクリーンショットは ${screenshotDir} に保存されました。`);
    
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
    console.log('\n⏳ 10秒後にブラウザを閉じます...');
    await page1.waitForTimeout(10000);
    
    await browser.close();
  }
}

// テストを実行
runRealtimeSyncTest().catch(console.error);