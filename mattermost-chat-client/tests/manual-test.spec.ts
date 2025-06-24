import { test, expect, Page } from '@playwright/test';

// テスト用の資格情報
const TEST_USER = 'sho1';
const TEST_PASSWORD = 'Password123!';
const TEST_URL = 'http://localhost:5173';

// スクリーンショット保存先
const SCREENSHOT_DIR = 'test-screenshots';

test.describe('船舶チームチャット機能テスト', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    
    // ログイン
    await page.goto(TEST_URL);
    await page.waitForSelector('input[name="username"]', { timeout: 10000 });
    await page.fill('input[name="username"]', TEST_USER);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    
    // ログイン完了を待つ
    await page.waitForSelector('text=船舶を選択', { timeout: 10000 });
  });

  test('1. 本船選択とダッシュボード表示', async () => {
    // Ocean Dreamを選択
    await page.click('text=Ocean Dream');
    await page.waitForTimeout(2000);
    
    // スクリーンショット
    await page.screenshot({ 
      path: `${SCREENSHOT_DIR}/01-ocean-dream-dashboard.png`,
      fullPage: true 
    });
    
    // デバッグ情報を取得
    const debugInfo = await page.evaluate(() => {
      return (window as any).mattermostDebug?.showCurrentState();
    });
    console.log('デバッグ情報:', debugInfo);
  });

  test('2. チャットパネル表示', async () => {
    // チャットバブルをクリック
    const chatBubble = await page.locator('[aria-label*="チャット"]').first();
    await chatBubble.click();
    await page.waitForTimeout(1000);
    
    // スクリーンショット
    await page.screenshot({ 
      path: `${SCREENSHOT_DIR}/02-chat-panel-open.png`,
      fullPage: true 
    });
    
    // チーム名を確認
    const teamName = await page.locator('.MuiDialogTitle-root').textContent();
    console.log('表示されているチーム名:', teamName);
  });

  test('3. デフォルトチャンネル確認', async () => {
    // チャンネル数を確認
    const channelCount = await page.locator('text=/\\d+ チャンネル/').textContent();
    console.log('チャンネル数:', channelCount);
    
    // スクリーンショット
    await page.screenshot({ 
      path: `${SCREENSHOT_DIR}/03-channel-list.png`,
      fullPage: true 
    });
  });

  test('4. Pacific Glory船舶でのテスト', async () => {
    // チャットパネルを閉じる
    await page.click('[aria-label="閉じる"]');
    await page.waitForTimeout(500);
    
    // 船舶一覧に戻る
    await page.goBack();
    await page.waitForSelector('text=船舶を選択', { timeout: 5000 });
    
    // Pacific Gloryを選択
    await page.click('text=Pacific Glory');
    await page.waitForTimeout(2000);
    
    // チャットバブルをクリック
    const chatBubble = await page.locator('[aria-label*="チャット"]').first();
    await chatBubble.click();
    await page.waitForTimeout(1000);
    
    // スクリーンショット
    await page.screenshot({ 
      path: `${SCREENSHOT_DIR}/04-pacific-glory-chat.png`,
      fullPage: true 
    });
  });

  test('5. コンソールログ確認', async () => {
    // コンソールログを収集
    const logs: string[] = [];
    page.on('console', msg => {
      logs.push(`${msg.type()}: ${msg.text()}`);
    });
    
    // ページリロード
    await page.reload();
    await page.waitForTimeout(3000);
    
    // ログを保存
    const fs = require('fs');
    fs.writeFileSync(`${SCREENSHOT_DIR}/console-logs.txt`, logs.join('\n'));
  });

  test.afterAll(async () => {
    await page.close();
  });
});