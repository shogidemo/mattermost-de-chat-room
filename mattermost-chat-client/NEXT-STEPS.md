# 次のステップ - 動作確認手順

## 実装完了内容

以下の修正を実装しました：
- ✅ エラーメッセージをアラートで表示
- ✅ 詳細なデバッグログ出力
- ✅ 権限エラー時の具体的な対処法提示
- ✅ デバッグ・診断ツールの作成

## 動作確認手順

### 1. ブラウザでアプリケーションにアクセス
```
URL: http://localhost:5174
ユーザー: sho1
パスワード: Password123!
```

### 2. 開発者ツールを開く
- F12キーを押す
- Consoleタブを選択

### 3. Ocean Dreamを選択
- 船舶一覧から「Ocean Dream」をクリック
- 以下のいずれかが発生します：

#### ケースA: 権限エラー
アラートが表示され、以下のようなメッセージが出ます：
```
船舶チーム切り替えに失敗しました:

チーム作成権限がありません。

Mattermost管理者に以下を依頼してください：
1. sho1ユーザーに「Create Public Teams」権限を付与
2. または、以下のチームを作成：
   - チーム名: ocean-dream-team
   - 表示名: Ocean Dream チーム
```

#### ケースB: 成功
- エラーアラートが表示されない
- ダッシュボードが表示される
- チャットバブルをクリックすると「Ocean Dream チーム」と表示

### 4. 診断スクリプトの実行
コンソールで以下を実行して詳細を確認：
```javascript
// debug-vessel-teams.js の内容をコピー＆ペースト
```

### 5. 問題の解決

#### 権限問題の解決方法
1. **管理者権限での対応**
   - Mattermost (http://localhost:8065) に管理者でログイン
   - システムコンソール → ユーザー管理
   - sho1ユーザーに権限付与

2. **手動でチーム作成**
   - 以下のチームを作成：
     - ocean-dream-team (Ocean Dream チーム)
     - pacific-glory-team (Pacific Glory チーム)
     等

### 6. 解決後の再確認
1. ページをリロード（F5）
2. 再度Ocean Dreamを選択
3. チャットバブルで「Ocean Dream チーム」が表示されることを確認
4. チャンネルが3つ表示されることを確認

## サポートファイル

- `debug-vessel-teams.js` - 診断スクリプト
- `check-permissions.js` - 権限確認スクリプト
- `simulate-vessel-selection.js` - 船舶選択シミュレーション
- `test-vessel-teams.html` - テスト用HTMLページ
- `TESTING-GUIDE.md` - 詳細なテストガイド

## 期待される結果

最終的に以下が実現されます：
1. 各船舶を選択すると専用チームに自動切り替え
2. チャットパネルに船舶名が表示される
3. デフォルトで3つのチャンネルが利用可能
4. チーム参加者全員がチャットでやり取り可能