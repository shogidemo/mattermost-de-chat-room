const { chromium } = require('playwright');

(async () => {
  console.log('🚀 営業チームチャンネルの作成を開始します...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();
  
  try {
    // Mattermostにアクセス
    console.log('1. Mattermostにアクセス');
    await page.goto('http://localhost:8065');
    await page.waitForTimeout(2000);
    
    // 既にログインしている場合はチャンネルページに遷移する
    const isLoggedIn = await page.url().includes('/channels/');
    
    if (!isLoggedIn) {
      console.log('2. Mattermostにログイン');
      await page.fill('#input_loginId', 'admin');
      await page.fill('#input_password-input', 'Admin123456!');
      await page.click('#saveSetting');
      await page.waitForTimeout(3000);
    }
    
    // チャンネル作成
    console.log('3. 新しいチャンネルを作成');
    
    // サイドバーの「+」ボタンをクリック（チャンネル追加）
    try {
      await page.click('button[aria-label="Add channels"]');
      await page.waitForTimeout(1000);
    } catch (error) {
      // 別のセレクタを試す
      await page.click('[data-testid="AddChannelDropdown.dropdownButton"]');
      await page.waitForTimeout(1000);
    }
    
    // 「チャンネルを作成」オプションをクリック
    await page.click('text=チャンネルを作成');
    await page.waitForTimeout(2000);
    
    // チャンネル名を入力
    console.log('4. チャンネル情報を入力');
    await page.fill('input[placeholder="チャンネル名を入力してください"]', '営業チーム');
    
    // チャンネルの説明を入力（任意）
    const purposeInput = await page.locator('textarea[placeholder="このチャンネルの目的を入力してください（任意）"]');
    if (await purposeInput.isVisible()) {
      await purposeInput.fill('営業チームのコミュニケーション用チャンネル');
    }
    
    // 「チャンネルを作成」ボタンをクリック
    await page.click('button:has-text("チャンネルを作成")');
    await page.waitForTimeout(3000);
    
    console.log('✅ 営業チームチャンネルの作成が完了しました！');
    await page.screenshot({ path: 'sales-channel-created.png', fullPage: true });
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    await page.screenshot({ path: 'sales-channel-error.png', fullPage: true });
  } finally {
    await browser.close();
    console.log('🔚 処理を終了しました');
  }
})();