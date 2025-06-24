# 船舶チームセットアップ手順

## 概要
このセットアップスクリプトは、Mattermostに船舶専用のチームとチャンネルを事前作成します。

## セットアップ手順

### 1. 管理者認証情報の設定

`setup-vessel-teams.js` ファイルを編集し、管理者の認証情報を設定します:

```javascript
const ADMIN_USERNAME = 'admin';     // あなたの管理者ユーザー名
const ADMIN_PASSWORD = 'Admin123!'; // あなたの管理者パスワード
```

### 2. セットアップスクリプトの実行

ターミナルで以下のコマンドを実行:

```bash
cd mattermost-chat-client
./run-setup.sh
```

### 3. 実行結果の確認

スクリプトが成功すると、以下が作成されます:

**チーム:**
- pacific-glory-team (Pacific Glory チーム)
- ocean-dream-team (Ocean Dream チーム)
- grain-master-team (Grain Master チーム)
- star-carrier-team (Star Carrier チーム)
- blue-horizon-team (Blue Horizon チーム)

**各チームのチャンネル:**
- [船舶名]-general (一般)
- [船舶名]-operations (運航管理)
- [船舶名]-maintenance (メンテナンス)

### 4. アプリケーションでの動作確認

1. http://localhost:5174 にアクセス
2. sho1でログイン
3. 船舶を選択
4. チャットバブルをクリックして船舶チームが表示されることを確認

## トラブルシューティング

### 認証エラーの場合

```
❌ セットアップ失敗: Request failed with status code 401
💡 管理者の認証情報を確認してください
```

→ `setup-vessel-teams.js` の管理者認証情報を確認

### チーム作成権限エラーの場合

Mattermost管理画面で:
1. システムコンソール → ユーザー管理
2. 「Enable Open Team Creation」を有効化
3. または管理者ユーザーで実行

### その他のエラー

- Mattermostサーバーが起動しているか確認
- ポート8065でアクセス可能か確認
- ログを確認してエラーの詳細を調査