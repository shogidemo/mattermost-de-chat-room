# 船舶チーム機能 動作確認レポート

## テスト実施日時
2025年6月24日

## テスト環境
- Mattermost Server: v9.11
- フロントエンド: http://localhost:5173
- テストユーザー: sho1

## セットアップ完了内容

### 1. チーム作成 ✅
以下の5つの船舶チームを作成完了：
- pacific-glory-team (Pacific Glory チーム)
- ocean-dream-team (Ocean Dream チーム)
- grain-master-team (Grain Master チーム)
- star-carrier-team (Star Carrier チーム)
- blue-horizon-team (Blue Horizon チーム)

### 2. チャンネル作成 ✅
各チームに3つのデフォルトチャンネルを作成完了：
- [船舶名]-general (一般)
- [船舶名]-operations (運航管理)
- [船舶名]-maintenance (メンテナンス)

合計15チャンネル作成

### 3. ユーザー追加 ✅
- sho1ユーザーを全チーム・全チャンネルに追加
- adminユーザーも全チーム・全チャンネルに追加

## 実施した技術的対策

### API問題の回避
Mattermost v9.11のAPI不具合（"missing destination name bannerinfo"エラー）を回避するため：
1. チーム作成はAPIで実施
2. チャンネル作成はSQL直接実行で実施
3. メンバー追加もSQL直接実行で実施

## 期待される動作

1. **ログイン**
   - sho1ユーザーでログイン可能

2. **船舶選択**
   - 各船舶を選択すると対応するチームに切り替わる
   - エラーメッセージが表示されない

3. **チャット機能**
   - チャットバブルをクリックすると船舶名が表示される
   - 3つのチャンネルが表示される
   - メッセージの送受信が可能

## 確認が必要な項目

以下のテストシナリオを http://localhost:5173 で確認してください：

### テストケース1: Pacific Glory
1. Pacific Gloryを選択
2. チャットバブルをクリック
3. 「Pacific Glory チーム」と表示されることを確認
4. 3つのチャンネルが表示されることを確認

### テストケース2: Ocean Dream
1. Ocean Dreamを選択
2. チャットバブルをクリック
3. 「Ocean Dream チーム」と表示されることを確認
4. 3つのチャンネルが表示されることを確認

### テストケース3: Grain Master
1. Grain Masterを選択
2. チャットバブルをクリック
3. 「Grain Master チーム」と表示されることを確認
4. 3つのチャンネルが表示されることを確認

### テストケース4: Star Carrier
1. Star Carrierを選択
2. チャットバブルをクリック
3. 「Star Carrier チーム」と表示されることを確認
4. 3つのチャンネルが表示されることを確認

### テストケース5: Blue Horizon
1. Blue Horizonを選択
2. チャットバブルをクリック
3. 「Blue Horizon チーム」と表示されることを確認
4. 3つのチャンネルが表示されることを確認

## トラブルシューティング

### チームが表示されない場合
1. ページをリロード（F5）
2. 再度ログイン
3. ブラウザのキャッシュをクリア

### チャンネルが0個の場合
1. Mattermostサーバーを再起動済みのため、再度ログインを試す
2. 開発者ツールでエラーを確認

### エラーメッセージが表示される場合
1. コンソールログを確認
2. ネットワークタブでAPIレスポンスを確認

## 関連ファイル
- setup-vessel-teams.js - チーム作成スクリプト
- create-channels-sql.js - チャンネル作成スクリプト
- add-channel-members-sql.js - メンバー追加スクリプト
- CREDENTIALS.md - 認証情報ドキュメント