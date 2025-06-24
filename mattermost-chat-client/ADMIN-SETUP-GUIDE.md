# 管理者向け船舶チームセットアップガイド

## 現在の問題
船舶別のチーム切り替え機能を実装しましたが、以下のチームとチャンネルが存在しないため機能が動作しません：

- pacific-glory-team (Pacific Glory チーム)
- ocean-dream-team (Ocean Dream チーム) 
- grain-master-team (Grain Master チーム)
- star-carrier-team (Star Carrier チーム)
- blue-horizon-team (Blue Horizon チーム)

## セットアップ方法

### 方法1: 自動セットアップスクリプトを使用（推奨）

1. **setup-vessel-teams.js の編集**
   ```javascript
   // 14-15行目の認証情報を実際の管理者アカウントに変更
   const ADMIN_USERNAME = 'あなたの管理者ユーザー名';
   const ADMIN_PASSWORD = 'あなたの管理者パスワード';
   ```

2. **スクリプトの実行**
   ```bash
   cd mattermost-chat-client
   ./run-setup.sh
   ```

3. **実行内容**
   - 5つの船舶チームを自動作成
   - 各チームに3つのデフォルトチャンネルを作成
   - sho1ユーザーを全チームに追加

### 方法2: Mattermost管理画面から手動作成

1. **Mattermostにログイン**
   - URL: http://localhost:8065
   - 管理者アカウントでログイン

2. **各チームを作成**
   
   **Pacific Glory チーム:**
   - チーム名: pacific-glory-team
   - 表示名: Pacific Glory チーム
   - 説明: Pacific Glory (VRPG7) の船舶運航管理チーム

   **Ocean Dream チーム:**
   - チーム名: ocean-dream-team
   - 表示名: Ocean Dream チーム
   - 説明: Ocean Dream (JXOD8) の船舶運航管理チーム

   **Grain Master チーム:**
   - チーム名: grain-master-team
   - 表示名: Grain Master チーム
   - 説明: Grain Master (PHGM9) の船舶運航管理チーム

   **Star Carrier チーム:**
   - チーム名: star-carrier-team
   - 表示名: Star Carrier チーム
   - 説明: Star Carrier (SGSC5) の船舶運航管理チーム

   **Blue Horizon チーム:**
   - チーム名: blue-horizon-team
   - 表示名: Blue Horizon チーム
   - 説明: Blue Horizon (PABH2) の船舶運航管理チーム

3. **各チームにデフォルトチャンネルを作成**
   
   各チームに以下の3つのチャンネルを作成：
   - [船舶名]-general (一般)
   - [船舶名]-operations (運航管理)
   - [船舶名]-maintenance (メンテナンス)

4. **sho1ユーザーを各チームに追加**

### 方法3: 権限設定の変更

sho1ユーザーにチーム作成権限を付与する場合：

1. システムコンソール → ユーザー管理
2. sho1ユーザーを検索
3. 「Create Public Teams」権限を付与
4. アプリケーションで船舶を選択すると自動的にチームが作成されます

## 動作確認

セットアップ完了後：

1. http://localhost:5174 にアクセス
2. sho1でログイン
3. 船舶を選択
4. チャットバブルをクリック
5. 船舶専用チームが表示されることを確認

## トラブルシューティング

### チームが表示されない場合
- ブラウザをリロード（F5）
- 開発者ツールのコンソールでエラーを確認
- チーム名が正確に一致しているか確認

### チャンネルが0個の場合
- チャンネルが作成されているか確認
- sho1ユーザーがチームメンバーか確認

## 技術的詳細

アプリケーションは以下のマッピングで船舶とチームを関連付けています：

```javascript
{
  'vessel-1': 'pacific-glory-team',
  'vessel-2': 'ocean-dream-team',
  'vessel-3': 'grain-master-team',
  'vessel-4': 'star-carrier-team',
  'vessel-5': 'blue-horizon-team'
}
```

各船舶を選択すると、対応するチームに自動的に切り替わります。