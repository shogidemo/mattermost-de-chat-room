# 船舶チーム機能 動作確認ガイド

## 準備

1. **開発サーバー起動**
   ```bash
   cd mattermost-chat-client
   npm run dev
   ```
   - URL: http://localhost:5174

2. **Mattermostサーバー確認**
   ```bash
   docker-compose ps
   ```

## テスト手順

### ステップ1: ログインと初期状態確認

1. ブラウザで http://localhost:5174 を開く
2. F12で開発者ツールを開く → Consoleタブ
3. sho1でログイン
4. コンソールで実行:
   ```javascript
   window.mattermostDebug.showCurrentState()
   ```

### ステップ2: 船舶選択テスト

1. 船舶一覧から「Ocean Dream」を選択
2. **期待される動作**:
   - アラートでエラーメッセージが表示される（権限エラーの場合）
   - コンソールに詳細なログが出力される

3. コンソールで診断スクリプトを実行:
   ```javascript
   // debug-vessel-teams.js の内容をコピー＆ペースト
   ```

### ステップ3: 問題の特定と対処

#### ケース1: 権限エラー
```
チーム作成権限がありません。
Mattermost管理者に以下を依頼してください：
1. sho1ユーザーに「Create Public Teams」権限を付与
2. または、以下のチームを作成：
   - チーム名: ocean-dream-team
   - 表示名: Ocean Dream チーム
```

**対処法**:
1. Mattermost (http://localhost:8065) に管理者でログイン
2. システムコンソール → ユーザー管理 → ユーザー → sho1
3. 「Create Public Teams」権限を付与

#### ケース2: チームが存在しない
```
⚠️ [API] チームが存在しません: ocean-dream-team
```

**対処法**:
1. 管理者で以下のチームを作成:
   - pacific-glory-team (Pacific Glory チーム)
   - ocean-dream-team (Ocean Dream チーム)
   - grain-master-team (Grain Master チーム)
   - star-carrier-team (Star Carrier チーム)
   - blue-horizon-team (Blue Horizon チーム)

### ステップ4: 修正後の確認

1. ページをリロード
2. 再度Ocean Dreamを選択
3. **成功時の期待動作**:
   - エラーアラートが表示されない
   - チャットバブルに「Ocean Dream チーム」と表示
   - チャンネル数が3以上

4. チャットバブルをクリック
5. **期待されるチャンネル**:
   - ocean-dream-general (一般)
   - ocean-dream-operations (運航管理)
   - ocean-dream-maintenance (メンテナンス)

## デバッグコマンド集

```javascript
// 現在の状態
window.mattermostDebug.showCurrentState()

// 全チーム確認
await window.mattermostDebug.getAllTeams()

// 船舶チーム切り替えテスト
await window.mattermostDebug.testVesselTeam('vessel-2')

// チャンネル更新
await window.mattermostDebug.refreshChannels()

// 権限確認
const user = window.__mattermostAppState?.user;
console.log('ユーザー:', user?.username, 'ロール:', user?.roles);
```

## トラブルシューティング

### Q: チームは切り替わるがチャンネルが0個
A: チャンネル作成権限を確認。「Create Public Channels」権限が必要。

### Q: "test-team"が表示され続ける
A: フォールバック処理が動作している。船舶チームが存在しないか権限不足。

### Q: WebSocketエラーが出る
A: 正常。ポーリングモードで動作するため問題なし。

## 成功基準チェックリスト

- [ ] 各船舶を選択すると専用チームに切り替わる
- [ ] チャットパネルに船舶名が表示される
- [ ] デフォルトチャンネルが3つ表示される
- [ ] チャンネルでメッセージ送受信ができる
- [ ] エラー時は明確なメッセージが表示される