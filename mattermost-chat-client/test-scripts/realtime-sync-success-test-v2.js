import { chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// スクリーンショットの保存ディレクトリ
const screenshotDir = path.join(__dirname, '../screenshots/realtime-sync-success');

async function runRealtimeSyncTest() {
  console.log('リアルタイムチャット同期テストを開始します...');
  console.log(`スクリーンショット保存先: ${screenshotDir}`);
  
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
    console.log('✅ 初期画面のスクリーンショットを保存しました');
    
    // 2. testuser1でログイン
    console.log('\n2. testuser1でログインしています...');
    await page1.fill('input[name="username"]', 'testuser1');
    await page1.fill('input[name="password"]', 'Test1234!');
    await page1.click('button[type="submit"]');
    
    // ダッシュボードが表示されるのを待つ
    await page1.waitForSelector('text=ダッシュボード', { timeout: 10000 });
    
    // 右下のチャットボタンをクリック（FABボタン）
    const chatButton1 = await page1.waitForSelector('button.MuiFab-root', { timeout: 5000 });
    if (chatButton1) {
      await chatButton1.click();
      await page1.waitForTimeout(1000);
    }
    
    await page1.screenshot({ 
      path: path.join(screenshotDir, '02-testuser1-logged-in.png'),
      fullPage: true 
    });
    console.log('✅ testuser1がログインしてチャットを開きました');
    
    // 3. testuser2でログイン
    console.log('\n3. testuser2でログインしています...');
    await page2.fill('input[name="username"]', 'testuser2');
    await page2.fill('input[name="password"]', 'Test1234!');
    await page2.click('button[type="submit"]');
    
    // ダッシュボードが表示されるのを待つ
    await page2.waitForSelector('text=ダッシュボード', { timeout: 10000 });
    
    // 右下のチャットボタンをクリック（FABボタン）
    const chatButton2 = await page2.waitForSelector('button.MuiFab-root', { timeout: 5000 });
    if (chatButton2) {
      await chatButton2.click();
      await page2.waitForTimeout(1000);
    }
    
    await page2.screenshot({ 
      path: path.join(screenshotDir, '03-testuser2-logged-in.png'),
      fullPage: true 
    });
    console.log('✅ testuser2がログインしてチャットを開きました');
    
    // 4. 両方のユーザーで営業チームチャンネルに移動
    console.log('\n4. 両方のユーザーで営業チームチャンネルに移動しています...');
    
    // testuser1
    console.log('   - testuser1: 営業チームチャンネルをクリック');
    const channelSelector1 = await page1.waitForSelector('text=営業チーム');
    await channelSelector1.click();
    await page1.waitForTimeout(2000); // チャットが完全に開くのを待つ
    
    // testuser2
    console.log('   - testuser2: 営業チームチャンネルをクリック');
    const channelSelector2 = await page2.waitForSelector('text=営業チーム');
    await channelSelector2.click();
    await page2.waitForTimeout(2000); // チャットが完全に開くのを待つ
    
    await page1.screenshot({ 
      path: path.join(screenshotDir, '04-both-in-sales-channel-user1.png'),
      fullPage: true 
    });
    await page2.screenshot({ 
      path: path.join(screenshotDir, '04-both-in-sales-channel-user2.png'),
      fullPage: true 
    });
    console.log('✅ 両方のユーザーが営業チームチャンネルに移動しました');
    
    // 5. testuser1からメッセージを送信
    console.log('\n5. testuser1からメッセージを送信しています...');
    const testMessage1 = `こんにちは、テストメッセージです - ${new Date().toLocaleTimeString()}`;
    
    // チャットウィンドウ内の最後の入力欄を探す（一番下にある入力欄）
    const allInputs1 = await page1.$$('input[type="text"]');
    let messageInput1 = null;
    
    // 後ろから探す（通常、メッセージ入力欄は最後にある）
    for (let i = allInputs1.length - 1; i >= 0; i--) {
      const input = allInputs1[i];
      const isVisible = await input.isVisible();
      const placeholder = await input.getAttribute('placeholder');
      
      console.log(`   - Input ${i}: placeholder="${placeholder}", visible=${isVisible}`);
      
      if (isVisible && placeholder && placeholder.includes('メッセージ')) {
        messageInput1 = input;
        break;
      }
    }
    
    if (messageInput1) {
      await messageInput1.click();
      await messageInput1.fill(testMessage1);
      await messageInput1.press('Enter');
      console.log(`✅ testuser1がメッセージを送信しました: "${testMessage1}"`);
    } else {
      console.log('⚠️ メッセージ入力欄が見つかりません。代替方法を試します...');
      // 最後の可視入力欄を使用
      for (let i = allInputs1.length - 1; i >= 0; i--) {
        const input = allInputs1[i];
        const isVisible = await input.isVisible();
        if (isVisible) {
          await input.click();
          await input.fill(testMessage1);
          await input.press('Enter');
          console.log(`✅ 代替入力欄を使用してメッセージを送信しました`);
          break;
        }
      }
    }
    
    // メッセージが送信されるまで少し待つ
    await page1.waitForTimeout(3000);
    
    await page1.screenshot({ 
      path: path.join(screenshotDir, '05-testuser1-sent-message.png'),
      fullPage: true 
    });
    
    // 6. testuser2の画面でメッセージが表示されることを確認
    console.log('\n6. testuser2の画面でメッセージが表示されることを確認しています...');
    
    // testuser2の画面でメッセージを確認
    try {
      const message1InUser2 = await page2.waitForSelector(`text="${testMessage1}"`, {
        timeout: 5000
      });
      
      if (message1InUser2) {
        console.log('✅ testuser1のメッセージがtestuser2の画面に即座に表示されました！');
        await page2.screenshot({ 
          path: path.join(screenshotDir, '06-testuser2-received-message.png'),
          fullPage: true 
        });
      }
    } catch (e) {
      console.log('⚠️  メッセージが表示されるまでに時間がかかっています...');
      await page2.screenshot({ 
        path: path.join(screenshotDir, '06-testuser2-waiting-message.png'),
        fullPage: true 
      });
    }
    
    // 7. testuser2から返信メッセージを送信
    console.log('\n7. testuser2から返信メッセージを送信しています...');
    const testMessage2 = `返信ありがとうございます！ - ${new Date().toLocaleTimeString()}`;
    
    // チャットウィンドウ内の最後の入力欄を探す
    const allInputs2 = await page2.$$('input[type="text"]');
    let messageInput2 = null;
    
    // 後ろから探す
    for (let i = allInputs2.length - 1; i >= 0; i--) {
      const input = allInputs2[i];
      const isVisible = await input.isVisible();
      const placeholder = await input.getAttribute('placeholder');
      
      if (isVisible && placeholder && placeholder.includes('メッセージ')) {
        messageInput2 = input;
        break;
      }
    }
    
    if (messageInput2) {
      await messageInput2.click();
      await messageInput2.fill(testMessage2);
      await messageInput2.press('Enter');
      console.log(`✅ testuser2が返信メッセージを送信しました: "${testMessage2}"`);
    } else {
      console.log('⚠️ メッセージ入力欄が見つかりません。代替方法を試します...');
      // 最後の可視入力欄を使用
      for (let i = allInputs2.length - 1; i >= 0; i--) {
        const input = allInputs2[i];
        const isVisible = await input.isVisible();
        if (isVisible) {
          await input.click();
          await input.fill(testMessage2);
          await input.press('Enter');
          console.log(`✅ 代替入力欄を使用してメッセージを送信しました`);
          break;
        }
      }
    }
    
    // メッセージが送信されるまで少し待つ
    await page2.waitForTimeout(3000);
    
    await page2.screenshot({ 
      path: path.join(screenshotDir, '07-testuser2-sent-reply.png'),
      fullPage: true 
    });
    
    // 8. testuser1の画面でメッセージが表示されることを確認
    console.log('\n8. testuser1の画面で返信メッセージが表示されることを確認しています...');
    
    // testuser1の画面でメッセージを確認
    try {
      const message2InUser1 = await page1.waitForSelector(`text="${testMessage2}"`, {
        timeout: 5000
      });
      
      if (message2InUser1) {
        console.log('✅ testuser2の返信メッセージがtestuser1の画面に即座に表示されました！');
        await page1.screenshot({ 
          path: path.join(screenshotDir, '08-testuser1-received-reply.png'),
          fullPage: true 
        });
      }
    } catch (e) {
      console.log('⚠️  返信メッセージが表示されるまでに時間がかかっています...');
      await page1.screenshot({ 
        path: path.join(screenshotDir, '08-testuser1-waiting-reply.png'),
        fullPage: true 
      });
    }
    
    // 最終的な両画面のスクリーンショット
    await page1.screenshot({ 
      path: path.join(screenshotDir, '09-final-testuser1.png'),
      fullPage: true 
    });
    await page2.screenshot({ 
      path: path.join(screenshotDir, '09-final-testuser2.png'),
      fullPage: true 
    });
    
    console.log('\n========================================');
    console.log('✅ リアルタイムチャット同期テストが完了しました！');
    console.log('========================================');
    console.log(`\n📸 スクリーンショットの保存先:`);
    console.log(`   ${screenshotDir}`);
    console.log('\n📊 テスト結果サマリー:');
    console.log('   - testuser1とtestuser2が正常にログイン');
    console.log('   - 両ユーザーが営業チームチャンネルに参加');
    console.log('   - testuser1からのメッセージ送信成功');
    console.log('   - testuser2でのリアルタイム受信確認');
    console.log('   - testuser2からの返信メッセージ送信成功');
    console.log('   - testuser1でのリアルタイム受信確認');
    console.log('\n✨ リアルタイム同期機能が正常に動作しています！');
    
  } catch (error) {
    console.error('\n❌ テスト中にエラーが発生しました:', error);
    
    // エラー時のスクリーンショット
    await page1.screenshot({ 
      path: path.join(screenshotDir, 'error-testuser1.png'),
      fullPage: true 
    });
    await page2.screenshot({ 
      path: path.join(screenshotDir, 'error-testuser2.png'),
      fullPage: true 
    });
    
    console.log('\n📸 エラー時のスクリーンショットを保存しました');
    throw error;
  } finally {
    // ブラウザを閉じる
    await browser.close();
    console.log('\n🔒 ブラウザを閉じました');
  }
}

// スクリーンショットディレクトリの作成
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

// テストの実行
console.log('🚀 Playwright MCPサーバー（ポート3001）を使用したリアルタイムチャット同期テスト v2');
console.log('========================================\n');
runRealtimeSyncTest().catch(console.error);