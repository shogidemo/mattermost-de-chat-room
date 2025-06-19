import { chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createTestUsers() {
  console.log('Mattermostでテストユーザーを作成します...');
  
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--disable-web-security']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  try {
    // Mattermostに直接アクセス
    console.log('\n1. Mattermostにアクセスしています...');
    await page.goto('http://localhost:8065');
    
    // ユーザー作成画面に移動（サインアップリンクをクリック）
    try {
      const signupLink = await page.waitForSelector('text=アカウントを作成', { timeout: 5000 });
      await signupLink.click();
      console.log('✅ アカウント作成画面に移動しました');
    } catch (e) {
      console.log('❌ サインアップリンクが見つかりません。管理者でログインして手動でユーザーを作成してください。');
      
      // スクリーンショットを保存
      await page.screenshot({ 
        path: path.join(__dirname, '../screenshots/mattermost-login-page.png'),
        fullPage: true 
      });
      
      console.log('\nMattermostの初期設定が必要です:');
      console.log('1. ブラウザで http://localhost:8065 にアクセス');
      console.log('2. 管理者アカウントを作成（まだの場合）');
      console.log('3. チームを作成');
      console.log('4. 以下のチャンネルを作成:');
      console.log('   - 営業チーム');
      console.log('   - 開発チーム');
      console.log('   - 品質管理');
      console.log('5. テストユーザーを2つ作成:');
      console.log('   - ユーザー名: testuser1, パスワード: testuser1pass');
      console.log('   - ユーザー名: testuser2, パスワード: testuser2pass');
    }
    
    // 10秒待つ（手動確認のため）
    console.log('\n10秒後にブラウザを閉じます...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
  } finally {
    await browser.close();
  }
}

// スクリプトの実行
createTestUsers().catch(console.error);