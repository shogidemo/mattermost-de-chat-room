import { test, expect } from '@playwright/test';

test.describe('メッセージ永続化テスト', () => {
  test('営業チーム（実際のMattermostチャンネル）でのメッセージ永続化', async ({ page }) => {
    // アプリケーションにアクセス
    await page.goto('http://localhost:5174/');
    console.log('✅ 開発モードでメイン画面を表示');

    // チャットバブルをクリックしてポップアップを開く
    await page.locator('[data-testid="chat-bubble"]').click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    console.log('✅ チャットポップアップを開いた');

    // 営業チーム（実際のMattermostチャンネル）を選択
    await page.locator('text=営業チーム').click();
    await expect(page.locator('text=営業チーム').last()).toBeVisible();
    console.log('✅ 営業チームを選択（実際のMattermostチャンネル）');

    // 一意のテストメッセージを作成
    const testMessage = `テスト永続化メッセージ - ${Date.now()}`;

    // メッセージ入力欄を探して入力
    const messageInput = page.locator('[data-testid="message-input"]');
    await expect(messageInput).toBeVisible();
    await messageInput.fill(testMessage);
    console.log('✅ テストメッセージを入力');

    // 送信ボタンをクリック
    const sendButton = page.locator('[data-testid="send-button"]');
    await sendButton.click();

    // メッセージが送信されたことを確認（入力欄がクリアされる）
    await expect(messageInput).toHaveValue('');
    console.log('🎉 メッセージ送信成功！');

    // 送信されたメッセージが表示されることを確認
    await expect(page.locator(`text=${testMessage}`)).toBeVisible();
    console.log('🎉 送信されたメッセージが画面に表示されています！');

    // ポップアップを閉じる
    await page.locator('[role="dialog"] button').first().click();
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    console.log('✅ ポップアップを閉じた');

    // ページをリロード
    await page.reload();
    await page.waitForLoadState('networkidle');
    console.log('🔄 ページをリロードしました');

    // 再度チャットポップアップを開く
    await page.locator('[data-testid="chat-bubble"]').click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    console.log('✅ リロード後にチャットポップアップを再度開いた');

    // 営業チームを再選択
    await page.locator('text=営業チーム').click();
    await expect(page.locator('text=営業チーム').last()).toBeVisible();
    console.log('✅ リロード後に営業チームを再選択');

    // 送信したメッセージが残っているかチェック
    const messageExists = await page.locator(`text=${testMessage}`).count();
    
    if (messageExists > 0) {
      console.log('🎉 SUCCESS: リロード後もメッセージが永続化されています！');
      console.log('✅ Mattermostサーバーへの保存が正常に動作している');
    } else {
      console.log('❌ FAIL: リロード後にメッセージが消えています');
      console.log('⚠️  メッセージがMattermostサーバーに保存されていない可能性があります');
      
      // デバッグ情報を取得
      const allMessages = await page.locator('[data-testid="message-item"]').count();
      console.log(`📊 現在表示されているメッセージ数: ${allMessages}`);
      
      // 失敗として扱う
      expect(messageExists).toBeGreaterThan(0);
    }

    // 最終確認
    expect(messageExists).toBeGreaterThan(0);
  });

  test('開発チーム（モックチャンネル）でのローカルメッセージ動作', async ({ page }) => {
    // アプリケーションにアクセス
    await page.goto('http://localhost:5174/');

    // チャットバブルをクリック
    await page.locator('[data-testid="chat-bubble"]').click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // 開発チーム（モックチャンネル）を選択
    await page.locator('text=開発チーム').click();
    await expect(page.locator('text=開発チーム').last()).toBeVisible();
    console.log('✅ 開発チームを選択（モックチャンネル）');

    // テストメッセージを送信
    const testMessage = `モックテスト - ${Date.now()}`;
    const messageInput = page.locator('[data-testid="message-input"]');
    await messageInput.fill(testMessage);
    await page.locator('[data-testid="send-button"]').click();

    // メッセージが表示されることを確認
    await expect(page.locator(`text=${testMessage}`)).toBeVisible();
    console.log('✅ モックチャンネルでメッセージ送信成功');

    // ポップアップを閉じてリロード
    await page.locator('[role="dialog"] button').first().click();
    await page.reload();

    // 再度確認
    await page.locator('[data-testid="chat-bubble"]').click();
    await page.locator('text=開発チーム').click();

    // モックチャンネルではメッセージが消える（ローカル状態のため）
    const messageExists = await page.locator(`text=${testMessage}`).count();
    console.log(`📊 リロード後のモックメッセージ数: ${messageExists}`);
    console.log('ℹ️  モックチャンネルでは期待通りメッセージがリロード後に消えます');
  });
});