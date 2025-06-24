import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';

async function manualInitSetup() {
  console.log('🚀 Mattermost初期セットアップを開始します...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // スクリーンショットディレクトリ作成
  const screenshotDir = './test-results/init-setup';
  await fs.mkdir(screenshotDir, { recursive: true });
  
  try {
    console.log('1. Mattermostにアクセス...');
    await page.goto('http://localhost:8065');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ 
      path: path.join(screenshotDir, '01-initial.png'),
      fullPage: true 
    });
    
    // 初期セットアップ画面の確認
    const createAdminButton = await page.locator('button:has-text("Create Account"), button:has-text("アカウントを作成")').first();
    const emailInput = await page.locator('input[type="email"], input[id="email"], input[placeholder*="Email"]').first();
    
    if (await createAdminButton.count() > 0 || await emailInput.count() > 0) {
      console.log('2. 管理者アカウント作成画面が表示されました');
      console.log('   以下の情報を入力してください:');
      console.log('   - Email: admin@example.com');
      console.log('   - Username: admin');
      console.log('   - Password: Admin123456!');
      
      // Email入力を試みる
      if (await emailInput.count() > 0) {
        await emailInput.fill('admin@example.com');
        console.log('   ✅ Emailを入力しました');
      }
      
      // Username入力を試みる
      const usernameInput = await page.locator('input[id="username"], input[placeholder*="Username"]').first();
      if (await usernameInput.count() > 0) {
        await usernameInput.fill('admin');
        console.log('   ✅ Usernameを入力しました');
      }
      
      // Password入力を試みる
      const passwordInput = await page.locator('input[type="password"], input[id="password"]').first();
      if (await passwordInput.count() > 0) {
        await passwordInput.fill('Admin123456!');
        console.log('   ✅ Passwordを入力しました');
      }
      
      await page.screenshot({ 
        path: path.join(screenshotDir, '02-admin-filled.png'),
        fullPage: true 
      });
      
      console.log('\n3. "Create Account"ボタンをクリックして続行してください');
      console.log('   その後、必要に応じてチーム名を入力してください（例: Default Team）');
      
    } else {
      // ログイン画面の場合
      const loginButton = await page.locator('button:has-text("Sign in"), button:has-text("ログイン")').first();
      if (await loginButton.count() > 0) {
        console.log('2. ログイン画面が表示されています');
        console.log('   初期セットアップは完了しています！');
        
        await page.screenshot({ 
          path: path.join(screenshotDir, '03-login-screen.png'),
          fullPage: true 
        });
      }
    }
    
    console.log('\n📸 スクリーンショットは以下に保存されました:');
    console.log(path.resolve(screenshotDir));
    
    console.log('\n🔍 ブラウザで手動でセットアップを完了してください');
    console.log('   完了したら、このプロセスをCtrl+Cで終了してください');
    
    // ブラウザを開いたままにする
    await new Promise(() => {});
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
    await page.screenshot({ 
      path: path.join(screenshotDir, 'error.png'),
      fullPage: true 
    });
  }
}

manualInitSetup();