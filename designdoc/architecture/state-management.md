# 状態管理設計

## 概要

本アプリケーションでは、React Context API と useReducer を組み合わせた状態管理を採用しています。この設計により、Reduxのような外部ライブラリへの依存なしに、予測可能な状態管理を実現しています。

## 設計方針

### 1. シンプルさの重視
- 学習コストの低減
- 依存関係の最小化
- React標準機能の活用

### 2. 型安全性
- TypeScriptによる完全な型定義
- 実行時エラーの防止
- 開発体験の向上

### 3. 単一方向データフロー
- 予測可能な状態更新
- デバッグの容易さ
- 状態の一貫性保証

## 状態の構造

### AppState インターフェース

```typescript
interface AppState {
  // ユーザー認証
  user: User | null;
  authToken: string | null;
  
  // チーム・チャンネル
  currentTeam: Team | null;
  teams: Team[];
  currentChannel: Channel | null;
  channels: Channel[];
  channelMembers: Record<string, ChannelMember[]>;
  
  // メッセージ
  posts: Record<string, Post[]>;  // channelId -> Post[]
  
  // UI状態
  isLoading: boolean;
  error: string | null;
  
  // WebSocket
  webSocketClient: any | null;
  isConnected: boolean;
}
```

### 状態の分類

#### 1. 認証状態
- `user`: ログイン中のユーザー情報
- `authToken`: Mattermost APIトークン

#### 2. ナビゲーション状態
- `currentTeam`: 選択中のチーム
- `currentChannel`: 選択中のチャンネル

#### 3. データキャッシュ
- `teams`: 所属チーム一覧
- `channels`: チャンネル一覧
- `posts`: メッセージ（チャンネルIDでインデックス）

#### 4. UI状態
- `isLoading`: ローディング表示
- `error`: エラーメッセージ

#### 5. 接続状態
- `webSocketClient`: WebSocketクライアント
- `isConnected`: 接続状態

## アクション設計

### アクションタイプ

```typescript
type AppAction =
  // 認証
  | { type: 'SET_USER'; payload: { user: User; token: string } }
  | { type: 'LOGOUT' }
  
  // チーム・チャンネル
  | { type: 'SET_TEAMS'; payload: Team[] }
  | { type: 'SET_CURRENT_TEAM'; payload: Team }
  | { type: 'SET_CHANNELS'; payload: Channel[] }
  | { type: 'SET_CURRENT_CHANNEL'; payload: Channel }
  
  // メッセージ
  | { type: 'SET_POSTS'; payload: { channelId: string; posts: Post[] } }
  | { type: 'ADD_POST'; payload: { channelId: string; post: Post } }
  | { type: 'UPDATE_POST'; payload: { channelId: string; post: Post } }
  | { type: 'DELETE_POST'; payload: { channelId: string; postId: string } }
  
  // UI状態
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  
  // WebSocket
  | { type: 'SET_WEBSOCKET'; payload: any }
  | { type: 'SET_CONNECTED'; payload: boolean }
```

### アクション命名規則

- `SET_`: 値の完全置換
- `ADD_`: 要素の追加
- `UPDATE_`: 既存要素の更新
- `DELETE_`: 要素の削除
- `CLEAR_`: 初期化

## Reducer設計

### 基本構造

```typescript
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        user: action.payload.user,
        authToken: action.payload.token,
      };
    
    case 'ADD_POST':
      const { channelId, post } = action.payload;
      const currentPosts = state.posts[channelId] || [];
      
      // 重複チェック
      if (currentPosts.some(p => p.id === post.id)) {
        return state;
      }
      
      return {
        ...state,
        posts: {
          ...state.posts,
          [channelId]: [...currentPosts, post].sort(
            (a, b) => a.create_at - b.create_at
          ),
        },
      };
    
    // 他のケース...
    
    default:
      return state;
  }
};
```

### 設計原則

1. **イミュータブル更新**: スプレッド構文による新オブジェクト生成
2. **重複防止**: 同一IDのデータ追加を防ぐ
3. **ソート保証**: メッセージは常に時系列順
4. **エラー安全**: 不正な状態遷移を防ぐ

## Context設計

### Provider構造

```typescript
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const mattermostClient = useMemo(() => new MattermostClient(), []);

  // 初期化処理
  useEffect(() => {
    initializeApp();
  }, []);

  // WebSocket接続
  useEffect(() => {
    if (state.authToken && !state.webSocketClient) {
      connectWebSocket();
    }
  }, [state.authToken]);

  // コンテキスト値
  const value = useMemo(
    () => ({
      state,
      dispatch,
      // ヘルパー関数
      login,
      logout,
      selectChannel,
      sendMessage,
    }),
    [state]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
```

## 永続化戦略

### LocalStorage連携

```typescript
// 保存
useEffect(() => {
  if (state.authToken) {
    localStorage.setItem('mmAuthToken', state.authToken);
  }
  if (state.user) {
    localStorage.setItem('mmUser', JSON.stringify(state.user));
  }
}, [state.authToken, state.user]);

// 復元
const initializeApp = async () => {
  const token = localStorage.getItem('mmAuthToken');
  const userStr = localStorage.getItem('mmUser');
  
  if (token && userStr) {
    dispatch({
      type: 'SET_USER',
      payload: { user: JSON.parse(userStr), token }
    });
  }
};
```

## パフォーマンス最適化

### 1. メモ化
- `useMemo`によるコンテキスト値のメモ化
- 不要な再レンダリング防止

### 2. 選択的更新
- 必要な部分のみ状態更新
- 深いネストを避ける設計

### 3. 遅延読み込み
- 必要時にのみデータ取得
- ページネーション対応（将来）

## エラーハンドリング

### グローバルエラー状態

```typescript
// エラー設定
dispatch({ type: 'SET_ERROR', payload: 'ネットワークエラーが発生しました' });

// エラークリア
dispatch({ type: 'SET_ERROR', payload: null });
```

### エラー表示コンポーネント

```typescript
const ErrorBanner = () => {
  const { state } = useAppContext();
  
  if (!state.error) return null;
  
  return (
    <Alert severity="error" onClose={() => dispatch({ type: 'SET_ERROR', payload: null })}>
      {state.error}
    </Alert>
  );
};
```

## ベストプラクティス

### 1. アクションの粒度
- 1つのアクションは1つの責務
- 複雑な処理はヘルパー関数で

### 2. 状態の正規化
- ネストを浅く保つ
- IDによるインデックス化

### 3. 副作用の分離
- Reducer内では副作用なし
- useEffectで副作用管理

## 今後の拡張可能性

### 1. Redux Toolkitへの移行パス
- 現在の設計はReduxパターンに準拠
- 必要に応じて移行可能

### 2. 状態の分割
- 機能ごとにContextを分割
- パフォーマンス向上

### 3. ミドルウェア追加
- ロギング
- 分析
- デバッグツール

## 関連ドキュメント

- [システムアーキテクチャ概要](./overview.md)
- [WebSocket統合設計](./websocket-integration.md)
- [AppContext実装](../../mattermost-chat-client/src/contexts/AppContext.tsx)

---

作成日: 2025-01-21  
最終更新: 2025-01-21