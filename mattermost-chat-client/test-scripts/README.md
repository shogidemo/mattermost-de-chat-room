# テストスクリプト

このディレクトリには、Playwright を使用した自動テストスクリプトが含まれています。

## スクリプト一覧

### 基本テスト
- `test-chat-ui-verification.cjs` - Chat UI機能の検証
- `test-channel-click.cjs` - チャンネルクリック動作テスト
- `test-message-send.cjs` - メッセージ送信テスト
- `test-unread-count.cjs` - 未読件数カウントテスト

### 統合テスト
- `test-complete-integration.cjs` - 完全な統合テスト
- `test-realtime-sync.cjs` - リアルタイム同期テスト
- `test-mattermost-app.cjs` - Mattermostとの連携テスト

### セットアップ・初期設定
- `auto-setup-mattermost.cjs` - Mattermost自動セットアップ
- `create-account.cjs` - アカウント作成自動化
- `create-channels.cjs` - チャンネル作成自動化
- `setup-mattermost.cjs` - Mattermost初期設定

### デバッグ・検証用
- `debug-ui-features.cjs` - UI機能のデバッグ
- `test-duplicate-*.cjs` - 重複メッセージ問題の検証
- `test-text-input.cjs` - テキスト入力フィールドのテスト

### 手動テスト補助
- `test-manual-real.cjs` - 手動テストの自動化補助
- `test-chat-manual.cjs` - チャット機能の手動テスト

## 実行方法

```bash
# 個別のテストスクリプトを実行
node test-scripts/test-chat-ui-verification.cjs

# 統合テストを実行
node test-scripts/test-complete-integration.cjs
```

## 注意事項

1. **前提条件**
   - Mattermost サーバーが起動していること (http://localhost:8065)
   - React アプリが起動していること (http://localhost:5173)
   - admin / Admin123456! アカウントが作成済みであること

2. **環境変数**
   - 必要に応じて URL やポート番号を環境変数で設定可能

3. **ヘッドレスモード**
   - デフォルトは headless: false（画面表示あり）
   - CI/CD環境では headless: true に変更推奨