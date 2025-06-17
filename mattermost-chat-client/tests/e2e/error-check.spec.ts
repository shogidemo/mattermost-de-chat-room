import { test, expect } from '@playwright/test';

test.describe('エラー詳細確認', () => {
  test('ReactアプリのJavaScriptエラーを確認', async ({ page }) => {
    const consoleMessages: { type: string; text: string }[] = [];
    const pageErrors: string[] = [];
    
    // コンソールメッセージをキャプチャ
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text()
      });
    });
    
    // ページエラーをキャプチャ
    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });
    
    console.log('ページアクセス開始...');
    await page.goto('http://localhost:5173');
    
    console.log('ページ読み込み待機...');
    await page.waitForLoadState('networkidle');
    
    // さらに待機してJSエラーを収集
    await page.waitForTimeout(5000);
    
    console.log('=== コンソールメッセージ ===');
    consoleMessages.forEach((msg, index) => {
      console.log(`${index + 1}. [${msg.type}] ${msg.text}`);
    });
    
    console.log('=== ページエラー ===');
    if (pageErrors.length > 0) {
      pageErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    } else {
      console.log('ページエラーなし');
    }
    
    // React開発ツールの状態確認
    const reactInfo = await page.evaluate(() => {
      const root = document.getElementById('root');
      return {
        rootExists: !!root,
        rootChildren: root ? root.children.length : 0,
        reactFiberExists: !!(window as any)._reactInternalFiber,
        reactDevTools: !!(window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__
      };
    });
    
    console.log('=== React状態 ===');
    console.log('Root要素存在:', reactInfo.rootExists);
    console.log('Root子要素数:', reactInfo.rootChildren);
    console.log('React Fiber:', reactInfo.reactFiberExists);
    console.log('React DevTools:', reactInfo.reactDevTools);
    
    // Material-UIのインポート確認
    const muiCheck = await page.evaluate(() => {
      return {
        muiThemeProvider: !!(window as any).MUI_THEME,
        emotionCache: !!(window as any).emotionCache,
        hasStyleSheets: document.styleSheets.length > 0
      };
    });
    
    console.log('=== Material-UI状態 ===');
    console.log('MUI確認:', muiCheck);
    
    // 最終スクリーンショット
    await page.screenshot({ 
      path: 'test-results/error-check-final.png', 
      fullPage: true 
    });
  });
  
  test('手動でReactアプリを起動してみる', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    
    // ブラウザコンソールでReactアプリを手動起動
    const manualRender = await page.evaluate(() => {
      try {
        // Reactが利用可能かチェック
        const hasReact = typeof (window as any).React !== 'undefined';
        const hasReactDOM = typeof (window as any).ReactDOM !== 'undefined';
        
        return {
          hasReact,
          hasReactDOM,
          rootContent: document.getElementById('root')?.innerHTML || '',
          error: null
        };
      } catch (error) {
        return {
          hasReact: false,
          hasReactDOM: false,
          rootContent: '',
          error: (error as Error).message
        };
      }
    });
    
    console.log('=== 手動確認結果 ===');
    console.log('React利用可能:', manualRender.hasReact);
    console.log('ReactDOM利用可能:', manualRender.hasReactDOM);
    console.log('Root内容:', manualRender.rootContent);
    console.log('エラー:', manualRender.error);
    
    // DOM要素の詳細確認
    const domDetails = await page.evaluate(() => {
      const root = document.getElementById('root');
      const scripts = Array.from(document.querySelectorAll('script')).map(s => ({
        src: s.src,
        type: s.type,
        hasContent: s.innerHTML.length > 0
      }));
      
      return {
        htmlContent: document.documentElement.outerHTML.substring(0, 1000),
        scripts,
        rootHTML: root?.outerHTML || 'なし'
      };
    });
    
    console.log('=== DOM詳細 ===');
    console.log('HTML抜粋:', domDetails.htmlContent);
    console.log('スクリプト:', domDetails.scripts);
    console.log('Root HTML:', domDetails.rootHTML);
  });
});