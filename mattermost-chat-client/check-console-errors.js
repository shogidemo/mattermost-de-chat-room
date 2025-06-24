import { chromium } from 'playwright';

async function checkConsoleErrors() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // コンソールメッセージを収集
  const consoleMessages = [];
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    const time = new Date().toISOString();
    consoleMessages.push({ time, type, text });
    
    // リアルタイムで表示
    if (type === 'error') {
      console.error(`[ERROR] ${text}`);
    } else if (type === 'warn') {
      console.warn(`[WARN] ${text}`);
    } else if (text.includes('エラー') || text.includes('Error') || text.includes('failed')) {
      console.log(`[${type.toUpperCase()}] ${text}`);
    }
  });

  // ネットワークエラーを監視
  page.on('requestfailed', request => {
    console.error(`[NETWORK ERROR] ${request.method()} ${request.url()} - ${request.failure().errorText}`);
  });

  // レスポンスを監視（エラーステータスのみ）
  page.on('response', response => {
    if (response.status() >= 400) {
      console.error(`[HTTP ${response.status()}] ${response.url()}`);
    }
  });

  try {
    console.log('1. アプリケーションにアクセス...');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    console.log('2. ログイン...');
    await page.fill('input[name="username"]', 'sho1');
    await page.fill('input[name="password"]', 'sho12345');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    console.log('3. 船舶選択...');
    try {
      await page.waitForSelector('text=Pacific Glory', { timeout: 5000 });
      console.log('   Pacific Gloryをクリックします...');
      
      // クリック前のコンソールをクリア
      consoleMessages.length = 0;
      
      await page.click('text=Pacific Glory');
      await page.waitForTimeout(5000);
      
      console.log('\n=== 船舶選択後のコンソールログ ===');
      consoleMessages.forEach(msg => {
        console.log(`[${msg.time}] [${msg.type}] ${msg.text}`);
      });
      
    } catch (e) {
      console.error('船舶選択でエラー:', e.message);
    }

    // デバッグコマンドを実行
    console.log('\n4. デバッグコマンドを実行...');
    try {
      // 現在の状態を確認
      const currentState = await page.evaluate(() => {
        if (window.mattermostDebug) {
          window.mattermostDebug.showCurrentState();
          return 'デバッグコマンド実行成功';
        }
        return 'デバッグコマンドが利用できません';
      });
      console.log(currentState);

      // チーム一覧を取得
      console.log('\n5. チーム一覧を取得...');
      const teams = await page.evaluate(async () => {
        if (window.mattermostDebug) {
          return await window.mattermostDebug.getAllTeams();
        }
        return null;
      });
      
      if (teams) {
        console.log('利用可能なチーム:', teams);
      }

    } catch (e) {
      console.error('デバッグコマンドエラー:', e.message);
    }

    console.log('\n🔍 ブラウザで手動確認してください。終了するにはCtrl+Cを押してください。');
    await new Promise(() => {});

  } catch (error) {
    console.error('エラーが発生しました:', error);
  }
}

checkConsoleErrors();