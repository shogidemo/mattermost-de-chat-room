# トラブルシューティングガイド

## 問題: 船舶選択してもtest-teamが表示され、チャンネルが0個

### 症状
- Ocean Dreamなどの船舶を選択してもチームが切り替わらない
- チャットパネルに「test-team」と表示される
- チャンネルが0個で、チャットができない

### 診断手順

1. **ブラウザで http://localhost:5173 にアクセス**
2. **sho1ユーザーでログイン**
3. **船舶を選択（例：Ocean Dream）**
4. **F12キーを押してデベロッパーツールを開く**
5. **Consoleタブで以下のコマンドを実行**：

```javascript
// 現在の状態を確認
window.mattermostDebug.showCurrentState()

// すべてのチームを確認
await window.mattermostDebug.getAllTeams()

// Ocean Dreamチームへの切り替えをテスト
await window.mattermostDebug.testVesselTeam('vessel-2')
```

### よくある原因と解決策

#### 1. チーム作成権限がない場合

**エラーメッセージ**: 
```
船舶専用チーム「Ocean Dream チーム」が存在せず、作成権限がありません
```

**解決策**:
- Mattermost管理者に連絡して、sho1ユーザーに「チーム作成」権限を付与してもらう
- または、管理者に以下のチームを作成してもらう：
  - pacific-glory-team
  - ocean-dream-team
  - grain-master-team
  - star-carrier-team
  - blue-horizon-team

#### 2. チャンネル作成権限がない場合

**エラーメッセージ**:
```
チャンネル作成権限がありません
```

**解決策**:
- Mattermost管理者に「チャンネル作成」権限を付与してもらう

#### 3. APIエラーの場合

**確認方法**:
- デベロッパーツールの「Network」タブを確認
- 赤色の失敗したリクエストを探す

### 手動での回避策

Mattermostの管理画面から直接チームとチャンネルを作成：

1. Mattermost（http://localhost:8065）にログイン
2. チーム作成:
   - チーム名: ocean-dream-team
   - 表示名: Ocean Dream チーム
3. チャンネル作成:
   - ocean-dream-general（一般）
   - ocean-dream-operations（運航管理）
   - ocean-dream-maintenance（メンテナンス）

### それでも解決しない場合

以下の情報を開発チームに提供してください：

1. ブラウザコンソールのエラーログ（スクリーンショット）
2. Networkタブの失敗したリクエスト（スクリーンショット）
3. `window.mattermostDebug.showCurrentState()` の出力
4. Mattermostサーバーのバージョン