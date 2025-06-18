import { test, expect } from '@playwright/test';

test.describe('実際の永続化確認テスト', () => {
  test('ログイン→メッセージ送信→リロード→メッセージ確認', async ({ page }) => {
    // 1. アプリケーションにアクセス
    await page.goto('http://localhost:5173/');
    console.log('✅ アプリケーションにアクセス');

    // 2. ログイン画面が表示されることを確認
    await expect(page.locator('input[autocomplete="username"]')).toBeVisible();
    console.log('✅ ログインフォームを確認');

    // 3. Mattermostにログイン
    await page.fill('input[autocomplete="username"]', 'admin');
    await page.fill('input[autocomplete="password"]', 'password123');
    await page.click('button[type="submit"]');
    console.log('✅ ログイン試行');

    // 4. ログイン成功を待機（チャットバブルが表示される）
    await expect(page.locator('[data-testid="chat-bubble"]')).toBeVisible({ timeout: 10000 });
    console.log('✅ ログイン成功、メイン画面表示');

    // 5. チャットバブルをクリック
    await page.locator('[data-testid="chat-bubble"]').click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    console.log('✅ チャットポップアップを開いた');

    // 6. 営業チーム（実際のMattermostチャンネル）を選択
    await page.locator('text=営業チーム').click();
    await expect(page.locator('text=営業チーム').last()).toBeVisible();
    console.log('✅ 営業チームを選択（実際のMattermostチャンネル）');

    // 7. 一意のテストメッセージを作成
    const testMessage = `永続化テスト - ${Date.now()}`;

    // 8. メッセージ入力と送信
    const messageInput = page.locator('[data-testid="message-input"]');
    await expect(messageInput).toBeVisible();
    await messageInput.fill(testMessage);
    await page.locator('[data-testid="send-button"]').click();
    console.log('✅ テストメッセージを送信:', testMessage);

    // 9. メッセージが送信されたことを確認
    await expect(messageInput).toHaveValue('');
    await expect(page.locator(`text=${testMessage}`)).toBeVisible();
    console.log('✅ メッセージが画面に表示されました');

    // 10. 少し待機してサーバーに保存される時間を確保
    await page.waitForTimeout(2000);

    // 11. ページをリロード
    await page.reload();
    await page.waitForLoadState('networkidle');
    console.log('🔄 ページをリロードしました');

    // 12. 再度ログイン
    await expect(page.locator('input[autocomplete="username"]')).toBeVisible();
    await page.fill('input[autocomplete="username"]', 'admin');
    await page.fill('input[autocomplete="password"]', 'password123');
    await page.click('button[type="submit"]');
    console.log('✅ 再ログイン完了');

    // 13. チャットバブル表示を待機
    await expect(page.locator('[data-testid="chat-bubble"]')).toBeVisible({ timeout: 10000 });

    // 14. 再度チャットポップアップを開く
    await page.locator('[data-testid="chat-bubble"]').click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    console.log('✅ リロード後にチャットポップアップを再度開いた');

    // 15. 営業チームを再選択
    await page.locator('text=営業チーム').click();
    await expect(page.locator('text=営業チーム').last()).toBeVisible();
    console.log('✅ リロード後に営業チームを再選択');

    // 16. 少し待機してメッセージ読み込み完了を待つ
    await page.waitForTimeout(3000);

    // 17. 送信したメッセージが残っているかチェック
    const messageExists = await page.locator(`text=${testMessage}`).count();
    
    if (messageExists > 0) {
      console.log('🎉 SUCCESS: リロード後もメッセージが永続化されています！');
      console.log('✅ Mattermostサーバーへの保存が正常に動作している');
    } else {
      console.log('❌ FAIL: リロード後にメッセージが消えています');
      console.log('⚠️  メッセージがMattermostサーバーに保存されていない可能性があります');
      
      // デバッグ情報を収集
      const allText = await page.textContent('body');
      console.log('📋 ページ全体のテキスト（抜粋）:', allText?.substring(0, 500));
      
      // スクリーンショットを撮影
      await page.screenshot({ path: 'test-results/persistence-test-failure.png' });
      console.log('📸 スクリーンショットを保存しました');
    }

    // 18. 最終確認
    expect(messageExists).toBeGreaterThan(0);
  });
});