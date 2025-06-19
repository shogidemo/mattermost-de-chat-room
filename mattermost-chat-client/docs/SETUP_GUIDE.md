# Mattermost初期設定ガイド

## 1. Mattermostアクセス

ブラウザで以下にアクセス：
```
http://localhost:8065
```

## 2. 初期画面の操作

### A. デスクトップアプリ選択画面が出た場合
- 「View in Browser」をクリック

### B. ログイン画面が出た場合
- 右上の「Don't have an account?」をクリック
- または直接アクセス: http://localhost:8065/signup_user_complete

## 3. アカウント作成

以下の情報を入力：
- **Email**: admin@localhost.com
- **Username**: admin
- **Password**: Admin123456! （8文字以上、大文字小文字数字を含む）

「Create Account」をクリック

## 4. メール確認画面が出た場合

- 開発環境なのでメール確認は不要
- ブラウザで直接ログイン画面へ: http://localhost:8065/login

## 5. 初回ログイン

作成したアカウントでログイン：
- **Username**: admin
- **Password**: Admin123456!

## 6. チーム作成

ログイン後の画面で：
1. 「Create a team」をクリック
2. チーム名: `TestTeam`
3. URL: `testteam`（自動入力される）

## 7. チャンネル作成

左サイドバーの「+」ボタンから以下のチャンネルを作成：

1. **営業チーム**
   - Channel Name: sales-team
   - Display Name: 営業チーム

2. **開発チーム** 
   - Channel Name: dev-team
   - Display Name: 開発チーム

3. **佐藤チーム**
   - Channel Name: sato-team
   - Display Name: 佐藤チーム

4. **佐藤プロジェクト**
   - Channel Name: sato-project
   - Display Name: 佐藤プロジェクト

## 8. アプリケーション側の設定

### A. 開発モードを無効化

`src/App.tsx` の111行目：
```javascript
const DEVELOPMENT_MODE = false; // true → false
```

### B. アプリケーションを再起動

```bash
# Ctrl+C で停止後
npm run dev
```

### C. ログイン

アプリケーションで以下の認証情報でログイン：
- **Username**: admin
- **Password**: Admin123456!

## 9. 動作確認

1. チャンネルリストに作成したチャンネルが表示される
2. チャンネルをクリックしてメッセージ送信
3. 別のブラウザタブでMattermostを開いて、メッセージが同期されることを確認

## トラブルシューティング

### ログインできない場合
```bash
# Mattermostログ確認
docker-compose logs mattermost | tail -20
```

### チャンネルが表示されない場合
- アプリ内の更新ボタン（🔄）をクリック
- ブラウザをリロード（F5）

### WebSocketエラーが出る場合
- 正常です（HTTPポーリングで動作します）