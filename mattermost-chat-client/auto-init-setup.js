import { chromium } from 'playwright';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

const API_URL = 'http://localhost:8065/api/v4';
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'Admin123456!';

async function autoInitSetup() {
  console.log('🚀 Mattermost自動初期セットアップを開始します...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // スクリーンショットディレクトリ作成
  const screenshotDir = './test-results/auto-setup';
  await fs.mkdir(screenshotDir, { recursive: true });
  
  try {
    console.log('1. Mattermostにアクセス...');
    await page.goto('http://localhost:8065');
    await page.waitForLoadState('networkidle');
    
    // "View in Browser"ボタンがあればクリック
    const viewInBrowserButton = await page.locator('text=View in Browser').first();
    if (await viewInBrowserButton.count() > 0) {
      console.log('2. "View in Browser"をクリック...');
      await viewInBrowserButton.click();
      await page.waitForTimeout(2000);
    }
    
    await page.screenshot({ 
      path: path.join(screenshotDir, '01-after-browser-select.png'),
      fullPage: true 
    });
    
    // 管理者アカウント作成画面を確認
    const createAccountButton = await page.locator('button:has-text("Create Account")').first();
    const emailInput = await page.locator('input[type="email"]').first();
    
    if (await emailInput.count() > 0) {
      console.log('3. 管理者アカウント作成画面が表示されました');
      
      // フォームに入力
      await page.fill('input[type="email"]', ADMIN_EMAIL);
      await page.fill('input[placeholder*="Choose a Username"]', ADMIN_USERNAME);
      await page.fill('input[type="password"]', ADMIN_PASSWORD);
      
      await page.screenshot({ 
        path: path.join(screenshotDir, '02-admin-filled.png'),
        fullPage: true 
      });
      
      // Create Accountボタンをクリック
      console.log('4. アカウントを作成中...');
      await page.click('button:has-text("Create Account")');
      await page.waitForTimeout(3000);
      
      await page.screenshot({ 
        path: path.join(screenshotDir, '03-after-account-create.png'),
        fullPage: true 
      });
      
      // チーム作成画面の処理
      const teamNameInput = await page.locator('input[placeholder*="Team Name"]').first();
      if (await teamNameInput.count() > 0) {
        console.log('5. チーム作成画面が表示されました');
        await teamNameInput.fill('Default Team');
        
        // Nextボタンをクリック
        await page.click('button:has-text("Next"), button:has-text("Finish")');
        await page.waitForTimeout(2000);
        
        await page.screenshot({ 
          path: path.join(screenshotDir, '04-team-created.png'),
          fullPage: true 
        });
      }
      
      console.log('✅ 初期セットアップ完了！');
      
    } else {
      console.log('ℹ️ 既に初期セットアップ済みのようです');
    }
    
    // ブラウザを閉じる
    await browser.close();
    
    // 追加のセットアップを続行
    console.log('\n6. 追加セットアップを実行中...');
    await additionalSetup();
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
    await page.screenshot({ 
      path: path.join(screenshotDir, 'error.png'),
      fullPage: true 
    });
    await browser.close();
  }
}

async function additionalSetup() {
  try {
    // 少し待ってからAPI接続
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 管理者でログイン
    console.log('7. APIでログイン中...');
    const loginResponse = await axios.post(`${API_URL}/users/login`, {
      login_id: ADMIN_USERNAME,
      password: ADMIN_PASSWORD,
    });
    
    const token = loginResponse.headers.token;
    console.log('✅ ログイン成功');
    
    // Axiosインスタンスを作成
    const api = axios.create({
      baseURL: API_URL,
      headers: { Authorization: `Bearer ${token}` },
    });
    
    // sho1ユーザーを作成
    console.log('\n8. sho1ユーザーを作成中...');
    try {
      await api.post('/users', {
        email: 'sho1@example.com',
        username: 'sho1',
        password: 'sho12345',
      });
      console.log('✅ sho1ユーザー作成成功');
    } catch (error) {
      console.log('ℹ️ sho1ユーザーは既に存在する可能性があります');
    }
    
    console.log('\n✅ セットアップ完了！');
    console.log('\n以下の情報でログインできます:');
    console.log('- 管理者: admin / Admin123456!');
    console.log('- 一般ユーザー: sho1 / sho12345');
    console.log('\n次のステップ: 船舶チームとチャンネルの作成');
    
  } catch (error) {
    console.error('追加セットアップでエラー:', error.response?.data || error.message);
  }
}

autoInitSetup();