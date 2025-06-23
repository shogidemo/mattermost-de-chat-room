# デュアルモードチャンネルシステム設計

## 概要

本システムは、実際のMattermostチャンネルとモック（デモ）チャンネルの両方をシームレスに扱える「デュアルモード」設計を採用しています。これにより、開発・デモ・本番環境で柔軟な運用が可能になります。

## 設計の背景

### 解決する課題

1. **開発効率**: Mattermostサーバーなしでも開発可能
2. **デモンストレーション**: 実サーバー接続なしでデモ実施
3. **段階的移行**: モックから実装への段階的移行
4. **テスト容易性**: モックデータでのテスト実行

## チャンネル判定ロジック

### 基本ルール

```typescript
// ChatMiniView.tsx より
const isRealMattermostChannel = (channelId: string): boolean => {
  return channelId.length > 10;
};
```

### 判定基準

- **実チャンネル**: Mattermost生成の26文字ID（例: "8xk5j3ngibyqmcwswx8s5r3w1a"）
- **モックチャンネル**: 短い識別子（例: "team1", "dev-team", "general"）

この単純なルールにより、IDを見るだけで処理を分岐できます。

## データ構造の統一

### Channel インターフェース

```typescript
interface Channel {
  id: string;                    // チャンネルID
  team_id: string;              // チームID
  type: ChannelType;            // 'O' | 'P' | 'D' | 'G'
  display_name: string;         // 表示名
  name: string;                 // URL用名前
  header: string;               // ヘッダーテキスト
  purpose: string;              // 目的
  last_post_at: number;         // 最終投稿時刻
  total_msg_count: number;      // メッセージ総数
  creator_id: string;           // 作成者ID
  delete_at: number;            // 削除時刻
  scheme_id: string | null;     // スキームID
  isCurrent?: boolean;          // 選択状態（UIのみ）
  isFiltered?: boolean;         // フィルタ状態（UIのみ）
}
```

実チャンネルもモックチャンネルも同じインターフェースを実装します。

## 処理の分岐

### メッセージ取得

```typescript
// 実チャンネルの場合
if (isRealMattermostChannel(channelId)) {
  // AppContext経由でMattermost APIから取得
  const messages = state.posts[channelId] || [];
  return messages;
}

// モックチャンネルの場合
else {
  // ローカルステートから取得
  return localMessages;
}
```

### メッセージ送信

```typescript
const handleSendMessage = async (content: string) => {
  if (isRealMattermostChannel(channel.id)) {
    // Mattermost APIへ送信
    await sendMessage(content);
  } else {
    // ローカルステートに追加
    const newMessage = createMockMessage(content);
    setLocalMessages([...localMessages, newMessage]);
  }
};
```

## チャンネルリストの統合

### マージ戦略

```typescript
// ChannelList.tsx での実装
const getMergedChannels = () => {
  const realChannels = state.channels;
  const mockChannels = getMockChannels();
  
  // 重複を除去してマージ
  const mergedMap = new Map();
  
  // 実チャンネルを優先
  realChannels.forEach(ch => mergedMap.set(ch.id, ch));
  
  // モックチャンネルを追加（重複しない場合のみ）
  mockChannels.forEach(ch => {
    if (!mergedMap.has(ch.id)) {
      mergedMap.set(ch.id, ch);
    }
  });
  
  return Array.from(mergedMap.values());
};
```

## モックデータ生成

### モックチャンネル定義

```typescript
const mockChannels: Channel[] = [
  {
    id: "team1",
    team_id: "mock-team",
    type: 'O' as ChannelType,
    display_name: "営業チーム",
    name: "sales-team",
    header: "営業活動の情報共有",
    purpose: "営業チームのコミュニケーション",
    last_post_at: Date.now(),
    total_msg_count: 42,
    creator_id: "system",
    delete_at: 0,
    scheme_id: null,
  },
  // 他のモックチャンネル...
];
```

### モックメッセージ生成

```typescript
const createMockMessage = (content: string): Post => ({
  id: `mock-${Date.now()}-${Math.random()}`,
  create_at: Date.now(),
  update_at: Date.now(),
  delete_at: 0,
  user_id: currentUser?.id || 'mock-user',
  channel_id: channel.id,
  message: content,
  type: '' as PostType,
  hashtags: '',
  pending_post_id: '',
  reply_count: 0,
  last_reply_at: 0,
  participants: null,
  metadata: {} as PostMetadata,
});
```

## WebSocket対応

### イベント処理の分岐

```typescript
// WebSocketイベントハンドラー
const handleWebSocketMessage = (event: WebSocketMessage) => {
  if (event.event === 'posted') {
    const post = JSON.parse(event.data.post);
    
    // 実チャンネルのみ処理
    if (isRealMattermostChannel(post.channel_id)) {
      dispatch({
        type: 'ADD_POST',
        payload: { channelId: post.channel_id, post }
      });
    }
    // モックチャンネルはWebSocketイベントを無視
  }
};
```

## 利点と制限

### 利点

1. **開発の柔軟性**: サーバー依存なしで開発可能
2. **テストの容易性**: モックデータで完結したテスト
3. **デモの安定性**: ネットワーク依存なし
4. **段階的実装**: 機能ごとに実装可能

### 制限事項

1. **状態の永続性**: モックデータは永続化されない
2. **リアルタイム同期**: モックチャンネルは他クライアントと同期しない
3. **完全性**: 一部のMattermost機能は模擬できない

## ベストプラクティス

### 1. 明確な識別

```typescript
// Good: 一目で分かる命名
const mockChannelId = "demo-sales";
const realChannelId = "8xk5j3ngibyqmcwswx8s5r3w1a";

// Bad: 曖昧な命名
const channelId = "channel123"; // 11文字で判定が難しい
```

### 2. 型安全性の確保

```typescript
// チャンネルタイプを明示
type ChannelMode = 'real' | 'mock';

const getChannelMode = (channelId: string): ChannelMode => {
  return isRealMattermostChannel(channelId) ? 'real' : 'mock';
};
```

### 3. UIでの区別

```typescript
// モックチャンネルに視覚的な識別子を追加
const ChannelItem = ({ channel }) => (
  <ListItem>
    <ListItemText primary={channel.display_name} />
    {!isRealMattermostChannel(channel.id) && (
      <Chip label="Demo" size="small" />
    )}
  </ListItem>
);
```

## 今後の拡張

### 1. 設定可能な判定ロジック

```typescript
// 環境変数での制御
const isRealChannel = (id: string): boolean => {
  if (process.env.FORCE_MOCK_MODE) return false;
  return id.length > 10;
};
```

### 2. モックデータの永続化

```typescript
// LocalStorageへの保存
const saveMockMessages = (channelId: string, messages: Post[]) => {
  localStorage.setItem(`mock-messages-${channelId}`, JSON.stringify(messages));
};
```

### 3. より高度なモック機能

- モック用WebSocketシミュレーター
- 自動応答ボット
- シナリオベースのデモモード

## 関連ドキュメント

- [システムアーキテクチャ概要](./overview.md)
- [ChatMiniView実装](../../mattermost-chat-client/src/components/ChatMiniView.tsx)
- [ChannelList実装](../../mattermost-chat-client/src/components/ChannelList.tsx)

---

作成日: 2025-01-21  
最終更新: 2025-01-21