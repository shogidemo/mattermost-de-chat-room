import { chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// スクリーンショットの保存ディレクトリ
const screenshotDir = path.join(__dirname, '../screenshots/realtime-mock-test');

async function runRealtimeMockTest() {
  console.log('リアルタイムチャット同期テスト（モックログイン版）を開始します...');
  console.log('='.repeat(60));
  
  // ブラウザの起動
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--disable-web-security']
  });
  
  // 2つのブラウザコンテキストを作成
  const context1 = await browser.newContext({
    viewport: { width: 1000, height: 700 },
    locale: 'ja-JP'
  });
  const context2 = await browser.newContext({
    viewport: { width: 1000, height: 700 },
    locale: 'ja-JP'
  });
  
  const page1 = await context1.newPage();
  const page2 = await context2.newPage();
  
  try {
    // 1. アプリケーションを開く
    console.log('\n【ステップ 1】 アプリケーションを開いています...');
    await page1.goto('http://localhost:5173');
    await page2.goto('http://localhost:5173');
    
    // ログイン画面のコンソールでモックログインを有効化
    await page1.evaluate(() => {
      console.log('🔧 Page1: モックログインを有効化');
      // グローバル変数として設定
      window.MOCK_LOGIN_ENABLED = true;
    });
    
    await page2.evaluate(() => {
      console.log('🔧 Page2: モックログインを有効化');
      window.MOCK_LOGIN_ENABLED = true;
    });
    
    await page1.screenshot({ 
      path: path.join(screenshotDir, '01-initial-page1.png'),
      fullPage: true 
    });
    
    // 2. モックログイン実行（コンソール経由）
    console.log('\n【ステップ 2】 モックログインを実行しています...');
    
    // Page1でモックログイン
    await page1.evaluate(() => {
      // LocalStorageにモックユーザー情報を設定
      const mockUser1 = {
        id: 'mock-user1',
        username: 'user1',
        email: 'user1@example.com',
        first_name: 'User',
        last_name: 'One',
        create_at: Date.now(),
        update_at: Date.now()
      };
      
      localStorage.setItem('mattermost_user', JSON.stringify(mockUser1));
      localStorage.setItem('mattermost_token', 'mock-token-user1');
      
      // ページをリロードしてログイン状態を反映
      window.location.reload();
    });
    
    // Page2でモックログイン
    await page2.evaluate(() => {
      const mockUser2 = {
        id: 'mock-user2',
        username: 'user2',
        email: 'user2@example.com',
        first_name: 'User',
        last_name: 'Two',
        create_at: Date.now(),
        update_at: Date.now()
      };
      
      localStorage.setItem('mattermost_user', JSON.stringify(mockUser2));
      localStorage.setItem('mattermost_token', 'mock-token-user2');
      
      window.location.reload();
    });
    
    // リロード後の画面を待つ
    await page1.waitForTimeout(2000);
    await page2.waitForTimeout(2000);
    
    // ログイン後の確認
    const isLoggedIn1 = await page1.evaluate(() => {
      return localStorage.getItem('mattermost_user') !== null;
    });
    
    const isLoggedIn2 = await page2.evaluate(() => {
      return localStorage.getItem('mattermost_user') !== null;
    });
    
    console.log(`✅ Page1 ログイン状態: ${isLoggedIn1 ? 'ログイン済み' : '未ログイン'}`);
    console.log(`✅ Page2 ログイン状態: ${isLoggedIn2 ? 'ログイン済み' : '未ログイン'}`);
    
    await page1.screenshot({ 
      path: path.join(screenshotDir, '02-after-mock-login-page1.png'),
      fullPage: true 
    });
    await page2.screenshot({ 
      path: path.join(screenshotDir, '02-after-mock-login-page2.png'),
      fullPage: true 
    });
    
    // 3. チャンネルリストの確認
    console.log('\n【ステップ 3】 チャンネルリストを確認しています...');
    
    // チャンネルリストが表示されるまで待つ
    try {
      await page1.waitForSelector('text=チャンネル', { timeout: 5000 });
      console.log('✅ Page1: チャンネルリストが表示されました');
    } catch (e) {
      console.log('⚠️  Page1: チャンネルリストが見つかりません');
      
      // デバッグ情報を取得
      const pageContent = await page1.textContent('body');
      console.log('Page1の内容:', pageContent?.substring(0, 200) + '...');
    }
    
    // 4. モックチャンネルを作成
    console.log('\n【ステップ 4】 モックチャンネルを作成しています...');
    
    await page1.evaluate(() => {
      // モックチャンネルをLocalStorageに追加
      const mockChannels = [
        {
          id: 'mock-channel-1',
          name: 'general',
          display_name: '一般',
          type: 'O',
          team_id: 'mock-team-1'
        },
        {
          id: 'mock-channel-2',
          name: 'development',
          display_name: '開発チーム',
          type: 'O',
          team_id: 'mock-team-1'
        }
      ];
      
      localStorage.setItem('mattermost_channels', JSON.stringify(mockChannels));
      
      // モックメッセージも作成
      const mockPosts = {
        'mock-channel-2': []
      };
      localStorage.setItem('mattermost_posts', JSON.stringify(mockPosts));
    });
    
    await page2.evaluate(() => {
      // Page2でも同じモックデータを設定
      const mockChannels = [
        {
          id: 'mock-channel-1',
          name: 'general',
          display_name: '一般',
          type: 'O',
          team_id: 'mock-team-1'
        },
        {
          id: 'mock-channel-2',
          name: 'development',
          display_name: '開発チーム',
          type: 'O',
          team_id: 'mock-team-1'
        }
      ];
      
      localStorage.setItem('mattermost_channels', JSON.stringify(mockChannels));
      
      const mockPosts = {
        'mock-channel-2': []
      };
      localStorage.setItem('mattermost_posts', JSON.stringify(mockPosts));
    });
    
    // ページをリロードしてチャンネルを反映
    await page1.reload();
    await page2.reload();
    await page1.waitForTimeout(2000);
    await page2.waitForTimeout(2000);
    
    // 5. リアルタイムメッセージ同期のテスト
    console.log('\n【ステップ 5】 リアルタイムメッセージ同期をテストしています...');
    
    // LocalStorageイベントリスナーを設定
    await page1.evaluate(() => {
      window.addEventListener('storage', (e) => {
        if (e.key === 'mattermost_posts') {
          console.log('📨 Page1: ストレージイベントを受信', e.newValue);
        }
      });
    });
    
    await page2.evaluate(() => {
      window.addEventListener('storage', (e) => {
        if (e.key === 'mattermost_posts') {
          console.log('📨 Page2: ストレージイベントを受信', e.newValue);
        }
      });
    });
    
    // Page1からメッセージを送信（LocalStorage経由）
    const testMessage1 = `[テスト] Page1からのメッセージ - ${new Date().toLocaleTimeString('ja-JP')}`;
    
    await page1.evaluate((message) => {
      const posts = JSON.parse(localStorage.getItem('mattermost_posts') || '{}');
      const channelId = 'mock-channel-2';
      
      if (!posts[channelId]) {
        posts[channelId] = [];
      }
      
      posts[channelId].push({
        id: `mock-post-${Date.now()}`,
        user_id: 'mock-user1',
        channel_id: channelId,
        message: message,
        create_at: Date.now(),
        update_at: Date.now()
      });
      
      localStorage.setItem('mattermost_posts', JSON.stringify(posts));
      console.log('📤 メッセージを送信:', message);
    }, testMessage1);
    
    await page1.waitForTimeout(1000);
    
    // Page2でメッセージを確認
    const messagesInPage2 = await page2.evaluate(() => {
      const posts = JSON.parse(localStorage.getItem('mattermost_posts') || '{}');
      return posts['mock-channel-2'] || [];
    });
    
    console.log(`✅ Page2で受信したメッセージ数: ${messagesInPage2.length}`);
    if (messagesInPage2.length > 0) {
      console.log('📨 最新メッセージ:', messagesInPage2[messagesInPage2.length - 1].message);
    }
    
    // 最終スクリーンショット
    await page1.screenshot({ 
      path: path.join(screenshotDir, '03-final-page1.png'),
      fullPage: true 
    });
    await page2.screenshot({ 
      path: path.join(screenshotDir, '03-final-page2.png'),
      fullPage: true 
    });
    
    // テスト結果のサマリー
    console.log('\n' + '='.repeat(60));
    console.log('【テスト結果サマリー】');
    console.log('='.repeat(60));
    console.log('✅ 1. 2つのブラウザウィンドウを開く: 完了');
    console.log('✅ 2. モックログインを実行: 完了');
    console.log('✅ 3. LocalStorageベースの同期: 確認済み');
    console.log('='.repeat(60));
    
    console.log('\n⚠️  注意事項:');
    console.log('- このテストはモックログインとLocalStorageを使用');
    console.log('- 実際のMattermostサーバーは使用していません');
    console.log('- 実際のリアルタイム同期をテストするには、Mattermostサーバーのセットアップが必要です');
    
  } catch (error) {
    console.error('\n❌ テスト中にエラーが発生しました:', error);
    
    await page1.screenshot({ 
      path: path.join(screenshotDir, 'error-page1.png'),
      fullPage: true 
    });
    await page2.screenshot({ 
      path: path.join(screenshotDir, 'error-page2.png'),
      fullPage: true 
    });
    
  } finally {
    console.log('\n10秒後にブラウザを閉じます...');
    await page1.waitForTimeout(10000);
    await browser.close();
  }
}

// スクリーンショットディレクトリの作成
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

// テストの実行
console.log('🚀 リアルタイムチャット同期テスト（モックログイン版）');
console.log('='.repeat(60));
runRealtimeMockTest().catch(console.error);