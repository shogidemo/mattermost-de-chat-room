import { test, expect } from '@playwright/test';

test.describe('シンプル永続化テスト', () => {
  test('営業チームでメッセージ送信→リロード→確認', async ({ page }) => {
    // テスト用の一意メッセージ
    const testMessage = `永続化確認 ${Date.now()}`;
    
    console.log('🚀 テスト開始:', testMessage);

    // 1. アプリケーションにアクセス
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    console.log('✅ アプリケーションアクセス完了');

    // 2. チャットバブルをクリック
    await page.locator('[data-testid="chat-bubble"]').click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    console.log('✅ チャットポップアップを開いた');

    // 3. 営業チーム選択
    await page.locator('text=営業チーム').click();
    await page.waitForTimeout(2000); // メッセージ読み込み待機
    console.log('✅ 営業チーム（実際のMattermostチャンネル）を選択');

    // 4. メッセージ送信
    const messageInput = page.locator('[data-testid="message-input"]');
    await expect(messageInput).toBeVisible();
    await messageInput.fill(testMessage);
    await page.locator('[data-testid="send-button"]').click();
    console.log('✅ テストメッセージを送信');

    // 5. 送信成功確認
    await expect(messageInput).toHaveValue('');
    await expect(page.locator(`text=${testMessage}`)).toBeVisible();
    console.log('✅ メッセージが画面に表示されました');

    // 6. サーバー保存時間を確保
    await page.waitForTimeout(3000);
    console.log('⏳ サーバー保存待機完了');

    // 7. ページリロード
    await page.reload();
    await page.waitForLoadState('networkidle');
    console.log('🔄 ページリロード完了');

    // 8. 再度チャット開く
    await page.locator('[data-testid="chat-bubble"]').click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await page.locator('text=営業チーム').click();
    await page.waitForTimeout(3000); // メッセージ読み込み待機
    console.log('✅ リロード後に営業チームを再選択');

    // 9. 永続化確認
    const messageExists = await page.locator(`text=${testMessage}`).count();
    
    if (messageExists > 0) {
      console.log('🎉 SUCCESS: メッセージが永続化されています！');
    } else {
      console.log('❌ FAIL: メッセージが消えています');
      
      // デバッグ情報
      const allMessages = await page.locator('[role="dialog"] [data-testid="message-item"]').count();
      console.log(`📊 現在のメッセージ数: ${allMessages}`);
      
      // ページの内容を確認
      const dialogContent = await page.locator('[role="dialog"]').textContent();
      console.log('📋 ダイアログ内容:', dialogContent?.substring(0, 200));
    }

    // 10. 結果検証
    expect(messageExists).toBeGreaterThan(0);
  });
});