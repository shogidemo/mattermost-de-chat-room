# Playwright MCP サーバー統合ガイド

## 概要

このプロジェクトには **Playwright MCP (Model Context Protocol) サーバー** が統合されており、AIアシスタント（Claude等）がブラウザを直接操作してテストや動作確認を行うことができます。

## Playwright MCP とは

Playwright MCP は、AIアシスタントがPlaywrightを通じてブラウザを操作できるようにするツールです。これにより：

- **自動テスト実行**: AIがテストシナリオを実行
- **バグ再現**: 報告された問題を自動で再現
- **動作確認**: 新機能の動作確認を自動化
- **スクリーンショット**: 画面キャプチャで状態確認

## インストール済みパッケージ

```bash
# グローバルインストール済み
@playwright/mcp@0.0.29
```

## 使用方法

### 1. MCP サーバーの起動

```bash
# 推奨: カスタムスクリプトで起動
npm run mcp:start

# または直接起動（ヘッド付き）
npm run mcp:server

# ヘッドレスモードで起動
npm run mcp:headless
```

### 2. 起動オプション

| オプション | 説明 | デフォルト |
|------------|------|------------|
| `--headless` | ヘッドレスモード | `false` |
| `--browser` | ブラウザ選択 | `chromium` |
| `--port` | サーバーポート | `3001` |
| `--save-trace` | トレース保存 | `true` |
| `--output-dir` | 出力ディレクトリ | `./test-results` |
| `--viewport-size` | ビューポートサイズ | `1280,720` |

### 3. Claude Code での使用

Claude Code 内で Playwright MCP サーバーにアクセス可能です：

```typescript
// 例: ログインテストの実行
await page.goto('http://localhost:5173');
await page.fill('[data-testid="username"]', 'testuser');
await page.fill('[data-testid="password"]', 'password');
await page.click('[data-testid="login-button"]');
await page.screenshot({ path: 'login-result.png' });
```

## 設定ファイル

### `playwright-mcp-config.json`

```json
{
  "headless": false,
  "browser": "chromium",
  "viewport-size": "1280,720",
  "save-trace": true,
  "output-dir": "./test-results",
  "caps": "tabs,pdf,history,wait,files",
  "image-responses": "auto"
}
```

### カスタマイズ例

```bash
# Firefox で起動
npx @playwright/mcp --browser firefox --port 3002

# モバイルデバイスエミュレーション
npx @playwright/mcp --device "iPhone 15" --port 3003

# プロキシ経由
npx @playwright/mcp --proxy-server "http://proxy:8080" --port 3004
```

## 利用可能な機能

### ブラウザ操作
- ページナビゲーション
- 要素クリック・入力
- フォーム送信
- スクロール・ホバー

### データ取得
- スクリーンショット撮影
- PDFエクスポート
- HTML/テキスト抽出
- ネットワーク監視

### テスト支援
- アサーション実行
- 待機条件設定
- マルチタブ対応
- ファイルアップロード

## 実用例

### 1. チャットアプリの動作確認

```bash
# MCP サーバー起動
npm run mcp:server

# Claude に以下のようなリクエストが可能
# "Mattermostアプリにログインして、新しいメッセージを送信してください"
```

### 2. E2E テスト実行

```bash
# 既存のPlaywrightテストと併用
npm run test:e2e

# MCP経由でのインタラクティブテスト
npm run mcp:start
```

### 3. バグ再現

```bash
# 問題のあるページでMCPサーバーを起動
npm run mcp:server

# Claude に問題の詳細を説明してバグ再現を依頼
```

## ファイル構成

```
mattermost-chat-client/
├── playwright-mcp-config.json      # MCP設定ファイル
├── scripts/
│   └── start-playwright-mcp.sh     # 起動スクリプト
├── docs/
│   └── PLAYWRIGHT_MCP.md          # このドキュメント
└── test-results/                   # MCP実行結果（自動生成）
    ├── traces/                     # Playwrightトレース
    ├── screenshots/                # スクリーンショット
    └── videos/                     # 実行動画
```

## トラブルシューティング

### 1. ポート競合エラー

```bash
# 別のポートで起動
npx @playwright/mcp --port 3002
```

### 2. ブラウザが起動しない

```bash
# ブラウザを再インストール
npx playwright install chromium
```

### 3. 権限エラー

```bash
# スクリプトに実行権限を付与
chmod +x scripts/start-playwright-mcp.sh
```

## セキュリティ考慮事項

### 開発環境での使用
- ローカルホストでのみ動作
- 信頼できないサイトへのアクセス制限

### 本番環境での注意
- 本番環境でのMCPサーバー実行は非推奨
- 必要に応じてCIパイプラインで使用

## 参考リンク

- [Playwright MCP 公式ドキュメント](https://github.com/microsoft/playwright)
- [Model Context Protocol 仕様](https://modelcontextprotocol.io/)
- [Claude Code MCP 統合](https://docs.anthropic.com/en/docs/claude-code)

## 更新履歴

- **2025-06-17**: 初回統合、基本設定完了
- **今後**: 追加機能と最適化予定