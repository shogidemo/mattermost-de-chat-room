# Mattermost初期セットアップガイド

## 手動セットアップ手順

### 1. ブラウザでアクセス
http://localhost:8065 にアクセスしてください。

### 2. 「View in Browser」を選択
最初の画面で「View in Browser」ボタンをクリックしてください。

### 3. 管理者アカウント作成
以下の情報を入力してください：
- **Email**: admin@example.com
- **Username**: admin
- **Password**: Admin123456!

「Create Account」ボタンをクリックしてください。

### 4. チーム作成
チーム名の入力を求められたら：
- **Team Name**: Default Team

「Next」または「Finish」ボタンをクリックしてください。

### 5. セットアップ完了
これで初期セットアップは完了です！

## 次のステップ

初期セットアップが完了したら、以下のコマンドを実行して追加セットアップを行います：

```bash
cd /Users/shosato/projects/mattermost-de-chat-room/mattermost-chat-client
node setup-after-init.js
```

このスクリプトは以下を実行します：
1. sho1ユーザーの作成
2. 船舶チームの作成
3. デフォルトチャンネルの作成
4. ユーザーの適切なチームへの追加