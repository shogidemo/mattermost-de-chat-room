import { chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// スクリーンショットの保存ディレクトリ
const screenshotDir = path.join(__dirname, '../screenshots/realtime-sync-test');

async function runRealtimeSyncTest() {
  console.log('リアルタイムチャット同期テストを開始します...');
  
  // ブラウザの起動
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--disable-web-security'] // CORS回避用
  });
  
  // 2つのブラウザコンテキストを作成（別々のセッション）
  const context1 = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const context2 = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  // 各コンテキストでページを開く
  const page1 = await context1.newPage();
  const page2 = await context2.newPage();
  
  try {
    // 1. 両方のブラウザでアプリケーションを開く
    console.log('\n1. アプリケーションを開いています...');
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
    
    // 2. User1でログイン
    console.log('\n2. User1でログインしています...');
    await page1.fill('input[name="username"]', 'user1');
    await page1.fill('input[name="password"]', 'user1password');
    await page1.click('button[type="submit"]');
    await page1.waitForSelector('text=チャンネル', { timeout: 10000 });
    
    await page1.screenshot({ 
      path: path.join(screenshotDir, '02-user1-logged-in.png'),
      fullPage: true 
    });
    
    // 3. User2でログイン
    console.log('\n3. User2でログインしています...');
    await page2.fill('input[name="username"]', 'user2');
    await page2.fill('input[name="password"]', 'user2password');
    await page2.click('button[type="submit"]');
    await page2.waitForSelector('text=チャンネル', { timeout: 10000 });
    
    await page2.screenshot({ 
      path: path.join(screenshotDir, '03-user2-logged-in.png'),
      fullPage: true 
    });
    
    // 4. 両方のユーザーで営業チームチャンネルに移動
    console.log('\n4. 両方のユーザーで営業チームチャンネルに移動しています...');
    
    // User1
    const channelSelector1 = await page1.waitForSelector('text=営業チーム');
    await channelSelector1.click();
    await page1.waitForTimeout(1000);
    
    // User2
    const channelSelector2 = await page2.waitForSelector('text=営業チーム');
    await channelSelector2.click();
    await page2.waitForTimeout(1000);
    
    await page1.screenshot({ 
      path: path.join(screenshotDir, '04-both-in-sales-channel.png'),
      fullPage: true 
    });
    
    // 5. User1からメッセージを送信
    console.log('\n5. User1からメッセージを送信しています...');
    const testMessage1 = `テストメッセージ from User1 - ${new Date().toLocaleTimeString()}`;
    
    await page1.fill('textarea[placeholder="メッセージを入力..."]', testMessage1);
    await page1.press('textarea[placeholder="メッセージを入力..."]', 'Enter');
    
    // メッセージが送信されるまで少し待つ
    await page1.waitForTimeout(2000);
    
    await page1.screenshot({ 
      path: path.join(screenshotDir, '05-user1-sent-message.png'),
      fullPage: true 
    });
    
    // 6. User2の画面でメッセージが表示されることを確認
    console.log('\n6. User2の画面でメッセージが表示されることを確認しています...');
    
    // User2の画面でメッセージを確認
    const message1InUser2 = await page2.waitForSelector(`text="${testMessage1}"`, {
      timeout: 5000
    });
    
    if (message1InUser2) {
      console.log('✅ User1のメッセージがUser2の画面に表示されました！');
      await page2.screenshot({ 
        path: path.join(screenshotDir, '06-user2-received-message.png'),
        fullPage: true 
      });
    }
    
    // 7. User2から返信メッセージを送信
    console.log('\n7. User2から返信メッセージを送信しています...');
    const testMessage2 = `返信メッセージ from User2 - ${new Date().toLocaleTimeString()}`;
    
    await page2.fill('textarea[placeholder="メッセージを入力..."]', testMessage2);
    await page2.press('textarea[placeholder="メッセージを入力..."]', 'Enter');
    
    // メッセージが送信されるまで少し待つ
    await page2.waitForTimeout(2000);
    
    await page2.screenshot({ 
      path: path.join(screenshotDir, '07-user2-sent-reply.png'),
      fullPage: true 
    });
    
    // 8. User1の画面でメッセージが表示されることを確認
    console.log('\n8. User1の画面で返信メッセージが表示されることを確認しています...');
    
    // User1の画面でメッセージを確認
    const message2InUser1 = await page1.waitForSelector(`text="${testMessage2}"`, {
      timeout: 5000
    });
    
    if (message2InUser1) {
      console.log('✅ User2の返信メッセージがUser1の画面に表示されました！');
      await page1.screenshot({ 
        path: path.join(screenshotDir, '08-user1-received-reply.png'),
        fullPage: true 
      });
    }
    
    // 最終的な両画面のスクリーンショット
    await page1.screenshot({ 
      path: path.join(screenshotDir, '09-final-user1.png'),
      fullPage: true 
    });
    await page2.screenshot({ 
      path: path.join(screenshotDir, '09-final-user2.png'),
      fullPage: true 
    });
    
    console.log('\n✅ リアルタイムチャット同期テストが完了しました！');
    console.log(`スクリーンショットは ${screenshotDir} に保存されています。`);
    
  } catch (error) {
    console.error('\n❌ テスト中にエラーが発生しました:', error);
    
    // エラー時のスクリーンショット
    await page1.screenshot({ 
      path: path.join(screenshotDir, 'error-user1.png'),
      fullPage: true 
    });
    await page2.screenshot({ 
      path: path.join(screenshotDir, 'error-user2.png'),
      fullPage: true 
    });
    
    throw error;
  } finally {
    // ブラウザを閉じる
    await browser.close();
  }
}

// スクリーンショットディレクトリの作成
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

// テストの実行
runRealtimeSyncTest().catch(console.error);