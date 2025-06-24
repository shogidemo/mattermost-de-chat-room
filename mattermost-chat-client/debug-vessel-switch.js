import { chromium } from 'playwright';

async function debugVesselSwitch() {
  console.log('🔍 船舶切り替えのデバッグを開始します...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // コンソールログをキャプチャ
  page.on('console', msg => {
    console.log(`[ブラウザログ ${msg.type()}]:`, msg.text());
  });
  
  // ページエラーをキャプチャ
  page.on('pageerror', error => {
    console.error('[ページエラー]:', error.message);
  });
  
  // リクエストエラーをキャプチャ
  page.on('requestfailed', request => {
    console.error('[リクエスト失敗]:', request.url(), '-', request.failure()?.errorText);
  });
  
  try {
    console.log('1. アプリケーションにアクセス...');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    
    console.log('2. sho1でログイン...');
    await page.fill('input[name="username"]', 'sho1');
    await page.fill('input[name="password"]', 'sho12345');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    console.log('3. ネットワークモニタリングを開始...');
    const requests = [];
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        requests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers()
        });
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        console.log(`[API応答] ${response.status()} ${response.url()}`);
      }
    });
    
    console.log('4. Pacific Gloryを選択...');
    const pacificGlory = await page.locator('text=Pacific Glory').first();
    await pacificGlory.click();
    
    // エラーが表示されるまで待つ
    await page.waitForTimeout(5000);
    
    console.log('\n5. APIリクエストの詳細:');
    requests.forEach(req => {
      console.log(`  ${req.method} ${req.url}`);
      if (req.headers.authorization) {
        console.log(`    Authorization: ${req.headers.authorization.substring(0, 20)}...`);
      }
    });
    
    // エラーの詳細を取得
    const errorAlert = await page.locator('.MuiAlert-message').first();
    if (await errorAlert.count() > 0) {
      const errorText = await errorAlert.textContent();
      console.log('\n6. エラー詳細:', errorText);
    }
    
    // ローカルストレージの内容を確認
    const localStorage = await page.evaluate(() => {
      const items = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        items[key] = window.localStorage.getItem(key);
      }
      return items;
    });
    
    console.log('\n7. LocalStorage内容:');
    Object.entries(localStorage).forEach(([key, value]) => {
      if (key.includes('mm') || key.includes('vessel')) {
        console.log(`  ${key}: ${value?.substring(0, 50)}...`);
      }
    });
    
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
  } finally {
    await browser.close();
  }
}

debugVesselSwitch();