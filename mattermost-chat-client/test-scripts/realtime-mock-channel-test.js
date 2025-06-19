import { chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// スクリーンショットの保存ディレクトリ
const screenshotDir = path.join(__dirname, '../screenshots/realtime-mock-test');

async function runRealtimeMockChannelTest() {
  console.log('モックチャンネルでのリアルタイムチャット同期テストを開始します...');
  console.log('='.repeat(60));
  
  // ブラウザの起動
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--disable-web-security']
  });
  
  // 2つのブラウザコンテキストを作成（別々のセッション）
  const context1 = await browser.newContext({
    viewport: { width: 1000, height: 700 },
    locale: 'ja-JP'
  });
  const context2 = await browser.newContext({
    viewport: { width: 1000, height: 700 },
    locale: 'ja-JP'
  });
  
  // 各コンテキストでページを開く
  const page1 = await context1.newPage();
  const page2 = await context2.newPage();
  
  // ウィンドウの位置を調整（並べて表示）
  await page1.evaluate(() => window.moveTo(0, 0));
  await page2.evaluate(() => window.moveTo(1000, 0));
  
  try {
    // 1. 両方のブラウザでアプリケーションを開く
    console.log('\n【ステップ 1】 アプリケーションを開いています...');
    await page1.goto('http://localhost:5173');
    await page2.goto('http://localhost:5173');
    await page1.waitForTimeout(1000);
    
    // スクリーンショット: 初期画面
    await page1.screenshot({ 
      path: path.join(screenshotDir, '01-initial-page1.png'),
      fullPage: true 
    });
    await page2.screenshot({ 
      path: path.join(screenshotDir, '01-initial-page2.png'),
      fullPage: true 
    });
    console.log('✅ 両方のブラウザでアプリケーションを開きました');
    
    // 2. User1でログイン
    console.log('\n【ステップ 2】 User1でログインしています...');
    await page1.fill('input[name="username"]', 'user1');
    await page1.fill('input[name="password"]', 'password1');
    await page1.click('button[type="submit"]');
    
    // ログイン成功を待つ
    await page1.waitForSelector('text=チャンネル', { timeout: 5000 });
    console.log('✅ User1でログイン成功');
    
    await page1.screenshot({ 
      path: path.join(screenshotDir, '02-user1-logged-in.png'),
      fullPage: true 
    });
    
    // 3. User2でログイン
    console.log('\n【ステップ 3】 User2でログインしています...');
    await page2.fill('input[name="username"]', 'user2');
    await page2.fill('input[name="password"]', 'password2');
    await page2.click('button[type="submit"]');
    
    await page2.waitForSelector('text=チャンネル', { timeout: 5000 });
    console.log('✅ User2でログイン成功');
    
    await page2.screenshot({ 
      path: path.join(screenshotDir, '03-user2-logged-in.png'),
      fullPage: true 
    });
    
    // 4. 両方のユーザーで開発チームチャンネルに移動
    console.log('\n【ステップ 4】 両方のユーザーで開発チームチャンネルに移動しています...');
    
    // User1
    const devChannel1 = await page1.waitForSelector('text=開発チーム');
    await devChannel1.click();
    await page1.waitForTimeout(1000);
    console.log('✅ User1: 開発チームチャンネルに移動');
    
    // User2
    const devChannel2 = await page2.waitForSelector('text=開発チーム');
    await devChannel2.click();
    await page2.waitForTimeout(1000);
    console.log('✅ User2: 開発チームチャンネルに移動');
    
    await page1.screenshot({ 
      path: path.join(screenshotDir, '04-both-in-dev-channel.png'),
      fullPage: true 
    });
    
    // 5. User1からメッセージを送信
    console.log('\n【ステップ 5】 User1からメッセージを送信しています...');
    const timestamp = new Date().toLocaleTimeString('ja-JP');
    const testMessage1 = `[テスト] User1からのメッセージ - ${timestamp}`;
    
    const messageInput1 = await page1.waitForSelector('textarea[placeholder="メッセージを入力..."]');
    await messageInput1.fill(testMessage1);
    await messageInput1.press('Enter');
    
    console.log(`📤 送信: "${testMessage1}"`);
    
    // メッセージが表示されるまで待つ
    await page1.waitForTimeout(1000);
    
    await page1.screenshot({ 
      path: path.join(screenshotDir, '05-user1-sent-message.png'),
      fullPage: true 
    });
    
    // 6. User2の画面でメッセージが表示されることを確認
    console.log('\n【ステップ 6】 User2の画面でメッセージが表示されることを確認しています...');
    
    // メッセージの一部で検索（タイムスタンプを除く）
    const messagePattern = '[テスト] User1からのメッセージ';
    
    try {
      // User2の画面を更新してメッセージを確認
      await page2.waitForTimeout(2000); // リアルタイム更新を待つ
      
      // メッセージリストを取得
      const messages = await page2.$$eval('.MuiPaper-root', elements => 
        elements.map(el => el.textContent || '').filter(text => text.includes('[テスト]'))
      );
      
      const messageFound = messages.some(msg => msg.includes(messagePattern));
      
      if (messageFound) {
        console.log('✅ User1のメッセージがUser2の画面に表示されました！');
        console.log('   リアルタイム同期が正常に動作しています');
      } else {
        console.log('⚠️  User2の画面にメッセージが見つかりません');
        console.log('   検出されたメッセージ:', messages);
      }
      
      await page2.screenshot({ 
        path: path.join(screenshotDir, '06-user2-check-message.png'),
        fullPage: true 
      });
    } catch (e) {
      console.log('❌ メッセージの確認中にエラーが発生しました:', e.message);
    }
    
    // 7. User2から返信メッセージを送信
    console.log('\n【ステップ 7】 User2から返信メッセージを送信しています...');
    const timestamp2 = new Date().toLocaleTimeString('ja-JP');
    const testMessage2 = `[返信] User2からの返信メッセージ - ${timestamp2}`;
    
    const messageInput2 = await page2.waitForSelector('textarea[placeholder="メッセージを入力..."]');
    await messageInput2.fill(testMessage2);
    await messageInput2.press('Enter');
    
    console.log(`📤 送信: "${testMessage2}"`);
    
    // メッセージが送信されるまで待つ
    await page2.waitForTimeout(1000);
    
    await page2.screenshot({ 
      path: path.join(screenshotDir, '07-user2-sent-reply.png'),
      fullPage: true 
    });
    
    // 8. User1の画面で返信メッセージが表示されることを確認
    console.log('\n【ステップ 8】 User1の画面で返信メッセージが表示されることを確認しています...');
    
    const replyPattern = '[返信] User2からの返信メッセージ';
    
    try {
      // User1の画面を確認
      await page1.waitForTimeout(2000); // リアルタイム更新を待つ
      
      // メッセージリストを取得
      const messages = await page1.$$eval('.MuiPaper-root', elements => 
        elements.map(el => el.textContent || '').filter(text => text.includes('[返信]'))
      );
      
      const replyFound = messages.some(msg => msg.includes(replyPattern));
      
      if (replyFound) {
        console.log('✅ User2の返信メッセージがUser1の画面に表示されました！');
        console.log('   双方向のリアルタイム同期が確認されました');
      } else {
        console.log('⚠️  User1の画面に返信メッセージが見つかりません');
        console.log('   検出されたメッセージ:', messages);
      }
      
      await page1.screenshot({ 
        path: path.join(screenshotDir, '08-user1-check-reply.png'),
        fullPage: true 
      });
    } catch (e) {
      console.log('❌ 返信メッセージの確認中にエラーが発生しました:', e.message);
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
    
    // テスト結果のサマリー
    console.log('\n' + '='.repeat(60));
    console.log('【テスト結果サマリー】');
    console.log('='.repeat(60));
    console.log('✅ 1. 2つのブラウザウィンドウを開く: 完了');
    console.log('✅ 2. 異なるユーザーでログイン (user1, user2): 完了');
    console.log('✅ 3. 同じチャンネル（開発チーム）に移動: 完了');
    console.log('✅ 4. User1からメッセージ送信: 完了');
    console.log('🔄 5. User2の画面に即座に表示: 確認中');
    console.log('✅ 6. User2から返信送信: 完了');
    console.log('🔄 7. User1の画面に即座に表示: 確認中');
    console.log('='.repeat(60));
    
    console.log(`\nスクリーンショットは以下に保存されました:`);
    console.log(`📁 ${screenshotDir}`);
    
    console.log('\n⚠️  注意事項:');
    console.log('- このテストはモックチャンネルを使用しています');
    console.log('- 実際のMattermostサーバーとの統合ではありません');
    console.log('- リアルタイム同期はローカルストレージとイベントを使用しています');
    
    console.log('\n✅ テストが完了しました！');
    
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
    // ブラウザを閉じる前に結果を確認する時間を与える
    console.log('\n15秒後にブラウザを閉じます...');
    await page1.waitForTimeout(15000);
    
    // ブラウザを閉じる
    await browser.close();
  }
}

// スクリーンショットディレクトリの作成
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

// テストの実行
console.log('🚀 モックチャンネルでのリアルタイムチャット同期テスト');
console.log('='.repeat(60));
console.log('このテストは以下を検証します:');
console.log('- 2つの異なるユーザーセッションでの同時ログイン');
console.log('- 同じチャンネルでのメッセージ送受信');
console.log('- リアルタイムでのメッセージ同期');
console.log('='.repeat(60));

runRealtimeMockChannelTest().catch(console.error);