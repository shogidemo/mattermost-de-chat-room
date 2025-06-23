# WebSocket統合設計

## 概要

MattermostのWebSocket APIを使用したリアルタイム通信の統合設計です。メッセージの即時配信、ユーザーステータスの更新、チャンネルイベントの同期を実現します。

## アーキテクチャ

### 接続フロー

```
1. ユーザーログイン
    ↓
2. 認証トークン取得
    ↓
3. WebSocket接続確立
    ↓
4. 認証メッセージ送信
    ↓
5. イベントリスニング開始
```

### 接続管理

```typescript
class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  
  async connect(url: string, token: string): Promise<void> {
    try {
      this.ws = new WebSocket(url);
      this.setupEventHandlers();
      await this.authenticate(token);
    } catch (error) {
      this.handleConnectionError(error);
    }
  }
  
  private setupEventHandlers(): void {
    if (!this.ws) return;
    
    this.ws.onopen = this.handleOpen.bind(this);
    this.ws.onmessage = this.handleMessage.bind(this);
    this.ws.onclose = this.handleClose.bind(this);
    this.ws.onerror = this.handleError.bind(this);
  }
}
```

## イベントタイプ

### 主要なイベント

| イベント名 | 説明 | ペイロード |
|-----------|------|-----------|
| `posted` | 新規メッセージ投稿 | `{ post: Post }` |
| `post_edited` | メッセージ編集 | `{ post: Post }` |
| `post_deleted` | メッセージ削除 | `{ post: { id, delete_at } }` |
| `channel_viewed` | チャンネル表示 | `{ channel_id: string }` |
| `typing` | タイピング中 | `{ user_id: string, channel_id: string }` |
| `user_updated` | ユーザー情報更新 | `{ user: User }` |
| `status_change` | オンラインステータス変更 | `{ user_id: string, status: string }` |

### イベント処理

```typescript
const handleWebSocketEvent = (event: WebSocketMessage) => {
  const { event: eventType, data } = event;
  
  switch (eventType) {
    case 'posted':
      handleNewPost(data);
      break;
      
    case 'post_edited':
      handlePostEdit(data);
      break;
      
    case 'post_deleted':
      handlePostDelete(data);
      break;
      
    case 'typing':
      handleTypingIndicator(data);
      break;
      
    case 'status_change':
      handleStatusChange(data);
      break;
      
    default:
      console.log('Unhandled WebSocket event:', eventType);
  }
};
```

## 認証フロー

### 認証メッセージ

```typescript
const authenticate = async (token: string): Promise<void> => {
  const authMessage = {
    action: 'authentication_challenge',
    data: {
      token: token
    }
  };
  
  this.ws?.send(JSON.stringify(authMessage));
  
  // 認証レスポンスを待つ
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Authentication timeout'));
    }, 5000);
    
    this.once('authenticated', () => {
      clearTimeout(timeout);
      resolve();
    });
  });
};
```

## 再接続戦略

### 自動再接続

```typescript
private handleClose = (event: CloseEvent): void => {
  console.log('WebSocket closed:', event.code, event.reason);
  
  // 正常終了でない場合は再接続を試みる
  if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
    this.scheduleReconnect();
  }
};

private scheduleReconnect(): void {
  this.reconnectAttempts++;
  
  const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
  console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
  
  this.reconnectTimer = setTimeout(() => {
    this.connect(this.lastUrl, this.lastToken);
  }, delay);
}
```

### エクスポネンシャルバックオフ

- 初回: 3秒後
- 2回目: 6秒後
- 3回目: 12秒後
- 4回目: 24秒後
- 5回目: 48秒後

## 状態管理との統合

### AppContextでの実装

```typescript
useEffect(() => {
  if (state.authToken && !state.webSocketClient) {
    const wsUrl = `${WS_BASE_URL}/api/v4/websocket`;
    
    mattermostClient.connectWebSocket(wsUrl, state.authToken)
      .then((client) => {
        dispatch({ type: 'SET_WEBSOCKET', payload: client });
        dispatch({ type: 'SET_CONNECTED', payload: true });
        
        // イベントハンドラーの登録
        setupWebSocketHandlers(client);
      })
      .catch((error) => {
        console.error('WebSocket connection failed:', error);
        dispatch({ type: 'SET_CONNECTED', payload: false });
      });
  }
  
  return () => {
    // クリーンアップ
    if (state.webSocketClient) {
      state.webSocketClient.disconnect();
    }
  };
}, [state.authToken, state.webSocketClient]);
```

### イベントハンドラー登録

```typescript
const setupWebSocketHandlers = (client: WebSocketClient) => {
  client.on('posted', (data: PostedEvent) => {
    const post = JSON.parse(data.post);
    dispatch({
      type: 'ADD_POST',
      payload: { channelId: post.channel_id, post }
    });
  });
  
  client.on('post_edited', (data: PostEditedEvent) => {
    const post = JSON.parse(data.post);
    dispatch({
      type: 'UPDATE_POST',
      payload: { channelId: post.channel_id, post }
    });
  });
  
  client.on('post_deleted', (data: PostDeletedEvent) => {
    dispatch({
      type: 'DELETE_POST',
      payload: { 
        channelId: data.channel_id, 
        postId: data.post.id 
      }
    });
  });
};
```

## パフォーマンス最適化

### 1. メッセージバッチング

```typescript
class MessageBatcher {
  private queue: WebSocketMessage[] = [];
  private timer: NodeJS.Timeout | null = null;
  private batchSize = 10;
  private batchDelay = 100;
  
  add(message: WebSocketMessage): void {
    this.queue.push(message);
    
    if (this.queue.length >= this.batchSize) {
      this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.batchDelay);
    }
  }
  
  private flush(): void {
    if (this.queue.length === 0) return;
    
    const batch = [...this.queue];
    this.queue = [];
    
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    
    this.processBatch(batch);
  }
}
```

### 2. イベントフィルタリング

```typescript
// 現在のチャンネルに関連するイベントのみ処理
const shouldProcessEvent = (event: WebSocketMessage): boolean => {
  const { currentChannel } = state;
  
  if (!currentChannel) return false;
  
  // チャンネル固有のイベント
  if (event.data.channel_id) {
    return event.data.channel_id === currentChannel.id;
  }
  
  // グローバルイベント（ユーザーステータスなど）
  return ['status_change', 'user_updated'].includes(event.event);
};
```

## エラーハンドリング

### 接続エラー

```typescript
private handleError = (error: Event): void => {
  console.error('WebSocket error:', error);
  
  // ユーザーに通知
  dispatch({
    type: 'SET_ERROR',
    payload: 'リアルタイム接続でエラーが発生しました'
  });
  
  // 接続状態を更新
  dispatch({ type: 'SET_CONNECTED', payload: false });
};
```

### メッセージ処理エラー

```typescript
try {
  const eventData = JSON.parse(message.data);
  handleWebSocketEvent(eventData);
} catch (error) {
  console.error('Failed to process WebSocket message:', error);
  
  // エラーをログに記録するが、接続は維持
  logError({
    type: 'WEBSOCKET_MESSAGE_ERROR',
    error: error.message,
    rawMessage: message.data
  });
}
```

## セキュリティ考慮事項

### 1. トークン管理
- WebSocket URLにトークンを含めない
- 認証メッセージでトークンを送信
- トークン更新時は再接続

### 2. メッセージ検証
```typescript
const validateMessage = (message: any): boolean => {
  // 必須フィールドの確認
  if (!message.event || !message.data) {
    return false;
  }
  
  // イベントタイプの検証
  if (!VALID_EVENT_TYPES.includes(message.event)) {
    return false;
  }
  
  return true;
};
```

## デバッグとモニタリング

### デバッグモード

```typescript
if (process.env.NODE_ENV === 'development') {
  window.__WEBSOCKET_DEBUG__ = true;
  
  // すべてのWebSocketイベントをログ
  client.on('*', (eventType: string, data: any) => {
    console.group(`WebSocket Event: ${eventType}`);
    console.log('Data:', data);
    console.log('Timestamp:', new Date().toISOString());
    console.groupEnd();
  });
}
```

### 接続状態インジケーター

```typescript
const ConnectionStatus: React.FC = () => {
  const { state } = useAppContext();
  
  return (
    <Chip
      icon={state.isConnected ? <WifiIcon /> : <WifiOffIcon />}
      label={state.isConnected ? '接続中' : '切断中'}
      color={state.isConnected ? 'success' : 'error'}
      size="small"
    />
  );
};
```

## 今後の改善点

1. **メッセージの圧縮**: 大量のメッセージ送信時の帯域削減
2. **優先度キュー**: 重要なイベントを優先的に処理
3. **オフライン対応**: 切断中のイベントをキューイングして再送
4. **WebRTC統合**: 音声・ビデオ通話機能

## 関連ドキュメント

- [システムアーキテクチャ概要](./overview.md)
- [状態管理設計](./state-management.md)
- [Mattermost WebSocket API](https://api.mattermost.com/#tag/WebSocket)

---

作成日: 2025-01-21  
最終更新: 2025-01-21