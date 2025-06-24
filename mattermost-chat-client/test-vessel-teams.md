# 船舶チーム切り替えテスト手順

## テスト環境の準備

1. Mattermostサーバーが起動していることを確認
2. アプリケーションを起動: `npm run dev`

## テストケース1: sho1ユーザー（権限なし）

1. sho1ユーザーでログイン
2. 船舶を選択（例: Pacific Glory）
3. **期待される動作**:
   - エラーメッセージが表示される
   - メッセージ内容: 「船舶チーム「Pacific Glory チーム」へのアクセスに失敗しました」
   - 管理者への依頼方法が表示される
   - 船舶選択画面に留まる（遷移しない）

## テストケース2: adminユーザー（権限あり）

1. adminユーザーでログイン
2. 船舶を選択（例: Pacific Glory）
3. **期待される動作**:
   - チーム切り替えが成功
   - メイン画面に遷移
   - チャットバブルをクリックするとチャンネルが表示される

### チャンネルが表示されない場合の対処法

ブラウザのコンソールで以下のコマンドを実行してデバッグ:

```javascript
// 現在の状態を確認
window.mattermostDebug.showCurrentState()

// チャンネルを手動で更新
window.mattermostDebug.refreshChannels()

// 全チームを確認
window.mattermostDebug.getAllTeams()

// チーム切り替え履歴を確認
window.mattermostDebug.showTeamHistory()
```

## デバッグ用コマンド

### 1. 船舶チームの手動テスト
```javascript
// vessel-1 = Pacific Glory
window.mattermostDebug.testVesselTeam('vessel-1')
```

### 2. チャンネル問題の診断
```javascript
// 現在のチーム・チャンネル状態を確認
window.mattermostDebug.showState()

// チャンネルリストを強制更新
window.mattermostDebug.forceChannelRefresh()
```

### 3. WebSocket/ポーリングの確認
```javascript
// WebSocket接続状態を確認
window.mattermostDebug.testWebSocket()

// ポーリング状態を確認
window.mattermostDebug.testPolling()
```

## 修正内容の概要

1. **権限エラーの改善**:
   - チーム作成権限がない場合、ユーザーの既存チームから船舶チームを検索
   - よりわかりやすいエラーメッセージを表示

2. **チャンネル取得の改善**:
   - 複数のフォールバック処理を追加
   - チーム全体のチャンネルを取得してオープンチャンネルに自動参加
   - town-squareチャンネルへの自動参加

3. **エラーハンドリングの改善**:
   - 403エラー（権限なし）を適切に処理
   - ユーザーフレンドリーなエラーメッセージ表示

## トラブルシューティング

### 問題: adminユーザーでもチャンネルが0件

1. Mattermostで直接チームにチャンネルがあるか確認
2. チャンネルがある場合、ユーザーがメンバーになっているか確認
3. コンソールで `window.mattermostDebug.refreshChannels()` を実行
4. それでも表示されない場合は、Mattermostでチャンネルに手動で参加してから再度試す

### 問題: sho1ユーザーで船舶チームにアクセスしたい

管理者に以下のいずれかを依頼:
1. sho1ユーザーに「Create Public Teams」権限を付与
2. 各船舶チーム（例: pacific-glory-team）にsho1ユーザーを招待
3. sho1ユーザーをシステム管理者に昇格（推奨しない）