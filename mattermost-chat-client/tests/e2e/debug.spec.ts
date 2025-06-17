import { test, expect } from '@playwright/test';

test.describe('デバッグ確認', () => {
  test('ページ内容を詳細確認', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    
    // ページの基本情報を取得
    const pageInfo = await page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        bodyText: document.body.innerText,
        htmlLength: document.documentElement.outerHTML.length,
        hasRoot: !!document.querySelector('#root'),
        rootContent: document.querySelector('#root')?.innerHTML || 'なし'
      };
    });
    
    console.log('=== ページ情報 ===');
    console.log('タイトル:', pageInfo.title);
    console.log('URL:', pageInfo.url);
    console.log('HTML長さ:', pageInfo.htmlLength);
    console.log('#root存在:', pageInfo.hasRoot);
    console.log('Body内容:', pageInfo.bodyText.substring(0, 200));
    console.log('Root内容:', pageInfo.rootContent.substring(0, 500));
    
    // React エラーがないかチェック
    const reactErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        reactErrors.push(msg.text());
      }
    });
    
    // 少し待機
    await page.waitForTimeout(3000);
    
    if (reactErrors.length > 0) {
      console.log('=== React エラー ===');
      reactErrors.forEach(error => console.log(error));
    } else {
      console.log('✅ Reactエラーなし');
    }
    
    // フルページスクリーンショット
    await page.screenshot({ 
      path: 'test-results/debug-full-page.png', 
      fullPage: true 
    });
    
    // DOM要素の詳細確認
    const domInfo = await page.evaluate(() => {
      const allElements = document.querySelectorAll('*');
      const elementTypes = Array.from(allElements).map(el => el.tagName).reduce((acc: Record<string, number>, tag) => {
        acc[tag] = (acc[tag] || 0) + 1;
        return acc;
      }, {});
      
      return {
        totalElements: allElements.length,
        elementTypes,
        hasReactComponents: Array.from(allElements).some(el => 
          el.className && el.className.includes('Mui') || el.className.includes('css-')
        )
      };
    });
    
    console.log('=== DOM情報 ===');
    console.log('総要素数:', domInfo.totalElements);
    console.log('Material-UI要素:', domInfo.hasReactComponents);
    console.log('要素タイプ:', domInfo.elementTypes);
    
    // アプリケーションが正常に動作しているかの基本チェック
    expect(pageInfo.hasRoot).toBe(true);
    expect(pageInfo.htmlLength).toBeGreaterThan(100);
  });
  
  test('ネットワーク状況確認', async ({ page }) => {
    const requests: string[] = [];
    const responses: { url: string; status: number }[] = [];
    
    page.on('request', request => {
      requests.push(request.url());
    });
    
    page.on('response', response => {
      responses.push({
        url: response.url(),
        status: response.status()
      });
    });
    
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    
    console.log('=== ネットワーク情報 ===');
    console.log('リクエスト数:', requests.length);
    console.log('レスポンス数:', responses.length);
    
    // エラーステータスのレスポンスをチェック
    const errorResponses = responses.filter(r => r.status >= 400);
    if (errorResponses.length > 0) {
      console.log('エラーレスポンス:', errorResponses);
    } else {
      console.log('✅ ネットワークエラーなし');
    }
    
    // 主要ファイルが読み込まれているかチェック
    const mainFiles = requests.filter(url => 
      url.includes('.js') || url.includes('.css') || url.includes('main')
    );
    console.log('メインファイル:', mainFiles);
  });
});