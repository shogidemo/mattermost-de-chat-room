const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('1. アプリケーションにアクセス');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    
    console.log('2. ログイン');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'Admin123456!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    console.log('3. チャットボタンをクリック');
    // より具体的にFabボタンを探す
    const fabButton = await page.locator('button.MuiFab-root').first();
    await fabButton.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'debug-input-1-chat-open.png' });
    
    console.log('4. チャンネルリストのHTML構造を確認');
    const channelListHTML = await page.locator('.MuiList-root').first().innerHTML();
    console.log('チャンネルリスト:', channelListHTML.substring(0, 500));
    
    // チャンネルアイテムをクリック
    const firstChannel = await page.locator('.MuiListItem-root').first();
    if (await firstChannel.isVisible()) {
      await firstChannel.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'debug-input-2-channel-clicked.png' });
    }
    
    console.log('5. 入力欄を探す - 様々なセレクタを試す');
    
    // 異なるセレクタを試す
    const selectors = [
      'input[type="text"]',
      'textarea',
      '.MuiTextField-root input',
      '.MuiTextField-root textarea',
      'input[placeholder]',
      'textarea[placeholder]',
      '[role="textbox"]',
      '.MuiInputBase-input'
    ];
    
    for (const selector of selectors) {
      const elements = await page.locator(selector).all();
      console.log(`セレクタ "${selector}": ${elements.length}個の要素が見つかりました`);
      
      for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        if (await element.isVisible()) {
          const placeholder = await element.getAttribute('placeholder');
          const value = await element.inputValue();
          const disabled = await element.isDisabled();
          console.log(`  要素${i}: placeholder="${placeholder}", value="${value}", disabled=${disabled}`);
        }
      }
    }
    
    console.log('6. ページ全体のHTML構造を確認（入力エリア周辺）');
    const pageHTML = await page.content();
    const inputAreaMatch = pageHTML.match(/(<input[^>]*>|<textarea[^>]*>)/gi);
    if (inputAreaMatch) {
      console.log('見つかった入力要素:');
      inputAreaMatch.forEach(match => console.log('  ', match));
    }
    
    console.log('7. 送信ボタンを探す');
    const buttons = await page.locator('button').all();
    console.log(`ボタン数: ${buttons.length}`);
    
    for (let i = 0; i < Math.min(buttons.length, 10); i++) {
      const button = buttons[i];
      if (await button.isVisible()) {
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');
        console.log(`  ボタン${i}: text="${text}", aria-label="${ariaLabel}"`);
      }
    }
    
    await page.screenshot({ path: 'debug-input-3-final-state.png' });

  } catch (error) {
    console.error('エラー:', error);
    await page.screenshot({ path: 'debug-input-error.png' });
  } finally {
    await browser.close();
  }
})();