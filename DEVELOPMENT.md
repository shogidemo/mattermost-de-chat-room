# 開発環境ガイド

## VSCode内での動作確認

このプロジェクトは外部ブラウザを自動起動しない設定になっています。
VSCode内で開発と動作確認を完結させることができます。

### セットアップ

開発サーバーの起動:
```bash
cd mattermost-chat-client
npm run dev
```

### VSCode Simple Browserを使用した動作確認

1. `Ctrl+Shift+P` (Mac: `Cmd+Shift+P`) でコマンドパレットを開く
2. "Simple Browser: Show" を検索・実行
3. URLに `http://localhost:5174` を入力

### 開発サーバーの確認

開発サーバーが正常に起動すると、ターミナルに以下のメッセージが表示されます：
```
VITE v6.3.5  ready in XXXms

➜  Local:   http://localhost:5174/
➜  Network: use --host to expose
```

### 設定ファイル

ブラウザ自動起動を無効化するための設定:

**.env**
```
BROWSER=none
```

**package.json**
```json
{
  "scripts": {
    "dev": "BROWSER=none vite",
    "dev:windows": "set BROWSER=none && vite"
  }
}
```

### Windows での開発

Windows環境では以下のコマンドを使用:
```bash
npm run dev:windows
```

### テスト実行

E2Eテストの実行も外部ブラウザを開かずに実行可能:
```bash
# ヘッドレスモード（推奨）
npm run test:e2e

# ヘッド付きモード（デバッグ時）
npm run test:e2e:headed

# UIモード（対話式）
npm run test:e2e:ui
```

### 注意事項

- この設定は開発環境のみに影響します
- 本番ビルドには影響しません
- チーム全体で同じ開発環境を共有するため、設定ファイルはコミットされています
- 今後の動作確認はすべてVSCode内で行い、外部ブラウザは使用しません

### トラブルシューティング

**ポートが使用中の場合:**
Viteが自動的に次の利用可能なポート（5175, 5176...）を使用します。

**Simple Browserが見つからない場合:**
VSCodeの拡張機能が有効になっていることを確認してください。通常は標準で利用可能です。

**開発サーバーが起動しない場合:**
```bash
# 依存関係の再インストール
npm install

# キャッシュクリア
npm run dev -- --force
```