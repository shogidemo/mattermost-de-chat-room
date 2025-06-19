# リアルタイムチャット同期機能 - バグレポート

## 発見日時
2025年6月19日 13:46

## 問題の概要
2つのユーザー（testuser1、testuser2）間でのリアルタイムメッセージ同期が動作していません。

## 再現手順
1. Mattermost APIを使用してテストユーザーとチャンネルを作成
   - testuser1 / Test1234!
   - testuser2 / Test1234!
   - 営業チーム（sales-team）チャンネル
2. 2つのブラウザウィンドウで各ユーザーでログイン
3. 両方のユーザーで「営業チーム」チャンネルを選択
4. testuser1からメッセージを送信
5. testuser2の画面を確認

## 期待される動作
- testuser1が送信したメッセージがtestuser2の画面にリアルタイムで表示される
- WebSocket経由でのメッセージ同期が機能する

## 実際の動作
- testuser1が送信したメッセージは、testuser1の画面にのみ表示される
- testuser2の画面には、testuser1のメッセージが表示されない
- 逆の場合も同様（testuser2→testuser1も同期されない）

## 技術的詳細

### 確認されたこと
1. **Mattermostサーバー**: 正常に稼働中
2. **ユーザー認証**: 両ユーザーとも正常にログイン可能
3. **チャンネル選択**: UI上で正常に動作
4. **メッセージ送信**: 各ユーザーの画面では自分のメッセージが表示される
5. **API通信**: メッセージ送信時にエラーは発生していない

### 推測される原因

#### 1. WebSocket接続の問題
- WebSocket接続が確立されていない可能性
- 接続は確立されているが、適切なチャンネルをサブスクライブしていない
- イベントは受信しているが、処理が正しく行われていない

#### 2. チャンネルIDの不一致
コード内でのチャンネル判定ロジック：
```javascript
const isRealMattermostChannel = (channelId) => channelId.length > 10;
```

この判定により、実際のMattermostチャンネルとモックチャンネルを区別しているが、
営業チームチャンネルがモックチャンネルとして扱われている可能性がある。

#### 3. WebSocketイベントの処理問題
AppContext.tsxでのWebSocket処理が正しく動作していない可能性：
- イベントタイプの不一致
- ペイロード構造の違い
- state更新の競合状態

## 影響範囲
- すべてのユーザー間でのリアルタイムメッセージ同期
- チャットアプリケーションの主要機能

## 重要度
**高** - リアルタイムチャット機能はこのアプリケーションの中核機能

## 次のアクション

### 1. デバッグ情報の追加
- WebSocket接続状態のログ出力
- 受信イベントの詳細ログ
- チャンネルID判定のデバッグ出力

### 2. コードレビュー
- `src/contexts/AppContext.tsx`のWebSocket実装
- `src/components/ChatMiniView.tsx`のメッセージ処理
- チャンネルID判定ロジックの見直し

### 3. 修正案
1. チャンネルID判定ロジックの改善
2. WebSocketイベントリスナーの修正
3. エラーハンドリングの強化

## テストエビデンス
- スクリーンショット: `screenshots/manual-realtime-test/`
- 自動テストスクリプト: `test-scripts/realtime-chat-sync-final.js`
- セットアップスクリプト: `scripts/setup-mattermost-test-env.cjs`

---

**報告者**: Claude Code  
**報告日**: 2025年6月19日