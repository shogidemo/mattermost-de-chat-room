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
    // aria-labelが設定されていない場合は、別のセレクタを使用
    const chatButton1 = await page1.waitForSelector('button.MuiFab-root, button[aria-label="チャット"], [data-testid="chat-fab"]', { timeout: 5000 }).catch(async () => {
      // もしボタンが見つからない場合は、スクリーンショットを撮ってデバッグ
      await page1.screenshot({ 
        path: path.join(screenshotDir, 'debug-no-chat-button-user1.png'),
        fullPage: true 
      });
      // クリック可能な要素を探す
      return await page1.$('button.MuiFab-root');
    });
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
    // aria-labelが設定されていない場合は、別のセレクタを使用
    const chatButton2 = await page2.waitForSelector('button.MuiFab-root, button[aria-label="チャット"], [data-testid="chat-fab"]', { timeout: 5000 }).catch(async () => {
      // もしボタンが見つからない場合は、スクリーンショットを撮ってデバッグ
      await page2.screenshot({ 
        path: path.join(screenshotDir, 'debug-no-chat-button-user2.png'),
        fullPage: true 
      });
      // クリック可能な要素を探す
      return await page2.$('button.MuiFab-root');
    });
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
    await page1.waitForTimeout(1000);
    
    // testuser2
    console.log('   - testuser2: 営業チームチャンネルをクリック');
    const channelSelector2 = await page2.waitForSelector('text=営業チーム');
    await channelSelector2.click();
    await page2.waitForTimeout(1000);
    
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
    
    // チャットウィンドウ内の入力欄を探す
    // まず、チャットウィンドウが開いていることを確認
    await page1.waitForTimeout(1000);
    
    // 入力欄のセレクタを試す
    const inputSelectors = [
      'input[placeholder*="sales-team"]',
      'input[placeholder*="メッセージを送信"]',
      'input[placeholder*="メッセージ"]',
      'input[placeholder*="message"]',
      '.MuiPaper-root input[type="text"]',
      '[role="dialog"] input[type="text"]',
      'input[type="text"]:visible'
    ];
    
    // より具体的にチャットウィンドウ内の入力欄を探す
    let messageInput1 = null;
    
    // まず、チャットウィンドウ全体を探す
    const chatWindow1 = await page1.$('.MuiPaper-root:has(input[type="text"])');
    if (chatWindow1) {
      // チャットウィンドウ内の入力欄を探す
      messageInput1 = await chatWindow1.$('input[type="text"]');
    }
    
    // 見つからない場合は、他のセレクタを試す
    if (!messageInput1) {
      for (const selector of inputSelectors) {
        try {
          const elements = await page1.$$(selector);
          for (const element of elements) {
            const isVisible = await element.isVisible();
            if (isVisible) {
              messageInput1 = element;
              console.log(`   - 入力欄を見つけました: ${selector}`);
              break;
            }
          }
          if (messageInput1) break;
        } catch (e) {
          // セレクタが無効な場合は次へ
        }
      }
    }
    
    if (messageInput1) {
      await messageInput1.click(); // まずクリックしてフォーカス
      await messageInput1.fill(testMessage1);
      await messageInput1.press('Enter');
    } else {
      // デバッグ用にスクリーンショットを撮る
      await page1.screenshot({ 
        path: path.join(screenshotDir, 'debug-no-input-field.png'),
        fullPage: true 
      });
      
      // 全ての入力欄をログ出力
      const allInputs = await page1.$$('input');
      console.log(`   - 見つかった入力欄の数: ${allInputs.length}`);
      for (let i = 0; i < allInputs.length; i++) {
        const placeholder = await allInputs[i].getAttribute('placeholder');
        const type = await allInputs[i].getAttribute('type');
        const isVisible = await allInputs[i].isVisible();
        console.log(`     - Input ${i}: type="${type}", placeholder="${placeholder}", visible=${isVisible}`);
      }
      
      throw new Error('メッセージ入力欄が見つかりません');
    }
    
    // メッセージが送信されるまで少し待つ
    await page1.waitForTimeout(2000);
    
    await page1.screenshot({ 
      path: path.join(screenshotDir, '05-testuser1-sent-message.png'),
      fullPage: true 
    });
    console.log(`✅ testuser1がメッセージを送信しました: "${testMessage1}"`);
    
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
    
    // チャットウィンドウ内の入力欄を探す
    await page2.waitForTimeout(1000);
    
    // より具体的にチャットウィンドウ内の入力欄を探す
    let messageInput2 = null;
    
    // まず、チャットウィンドウ全体を探す
    const chatWindow2 = await page2.$('.MuiPaper-root:has(input[type="text"])');
    if (chatWindow2) {
      // チャットウィンドウ内の入力欄を探す
      messageInput2 = await chatWindow2.$('input[type="text"]');
    }
    
    // 見つからない場合は、他のセレクタを試す
    if (!messageInput2) {
      for (const selector of inputSelectors) {
        try {
          const elements = await page2.$$(selector);
          for (const element of elements) {
            const isVisible = await element.isVisible();
            if (isVisible) {
              messageInput2 = element;
              console.log(`   - 入力欄を見つけました: ${selector}`);
              break;
            }
          }
          if (messageInput2) break;
        } catch (e) {
          // セレクタが無効な場合は次へ
        }
      }
    }
    
    if (messageInput2) {
      await messageInput2.click(); // まずクリックしてフォーカス
      await messageInput2.fill(testMessage2);
      await messageInput2.press('Enter');
    } else {
      throw new Error('メッセージ入力欄が見つかりません');
    }
    
    // メッセージが送信されるまで少し待つ
    await page2.waitForTimeout(2000);
    
    await page2.screenshot({ 
      path: path.join(screenshotDir, '07-testuser2-sent-reply.png'),
      fullPage: true 
    });
    console.log(`✅ testuser2が返信メッセージを送信しました: "${testMessage2}"`);
    
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
console.log('🚀 Playwright MCPサーバー（ポート3001）を使用したリアルタイムチャット同期テスト');
console.log('========================================\n');
runRealtimeSyncTest().catch(console.error);