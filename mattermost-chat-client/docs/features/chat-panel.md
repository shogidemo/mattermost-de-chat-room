# チャットパネルUI設計

## 概要

フローティングチャットパネルは、画面の任意の位置に配置可能な独立したチャットインターフェースです。ドラッグ&ドロップによる位置変更、最小化/最大化、リサイズなどの機能を提供します。

## デザイン原則

1. **非侵入的**: メインコンテンツの邪魔にならない
2. **アクセシブル**: いつでも簡単にアクセス可能
3. **レスポンシブ**: 画面サイズに応じて適応
4. **直感的**: 学習コストの低い操作性

## UI構成

### コンポーネント階層

```
ChatMiniView (メインコンテナ)
├── ChatButton (開閉トグルボタン)
├── ChatPanel (チャットパネル本体)
│   ├── PanelHeader (ヘッダー)
│   │   ├── ChannelInfo
│   │   ├── MinimizeButton
│   │   └── CloseButton
│   ├── MessageArea
│   │   ├── MessageList
│   │   └── ScrollToBottom
│   └── InputArea
│       ├── MessageInput
│       └── ActionButtons
└── DragHandle (ドラッグ用ハンドル)
```

### レイアウト仕様

```typescript
interface ChatPanelDimensions {
  // デフォルトサイズ
  width: 400;
  height: 600;
  minWidth: 320;
  minHeight: 400;
  maxWidth: 600;
  maxHeight: '80vh';
  
  // モバイル対応
  mobile: {
    width: '100vw';
    height: '100vh';
  };
}
```

## ドラッグ&ドロップ実装

### 位置管理

```typescript
interface Position {
  x: number;
  y: number;
}

const [position, setPosition] = useState<Position>({
  x: window.innerWidth - 420,  // 右端から20px
  y: window.innerHeight - 620, // 下端から20px
});

const [isDragging, setIsDragging] = useState(false);
const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });
```

### ドラッグ処理

```typescript
const handleMouseDown = (e: React.MouseEvent) => {
  setIsDragging(true);
  setDragStart({
    x: e.clientX - position.x,
    y: e.clientY - position.y,
  });
};

const handleMouseMove = useCallback((e: MouseEvent) => {
  if (!isDragging) return;
  
  const newX = e.clientX - dragStart.x;
  const newY = e.clientY - dragStart.y;
  
  // 画面外に出ないように制限
  const boundedX = Math.max(0, Math.min(newX, window.innerWidth - panelWidth));
  const boundedY = Math.max(0, Math.min(newY, window.innerHeight - panelHeight));
  
  setPosition({ x: boundedX, y: boundedY });
}, [isDragging, dragStart]);

useEffect(() => {
  if (isDragging) {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }
}, [isDragging, handleMouseMove]);
```

## 状態管理

### パネル状態

```typescript
interface ChatPanelState {
  isOpen: boolean;
  isMinimized: boolean;
  position: Position;
  size: { width: number; height: number };
  selectedChannel: Channel | null;
}

// LocalStorageで永続化
const savePanelState = (state: ChatPanelState) => {
  localStorage.setItem('chatPanelState', JSON.stringify({
    position: state.position,
    size: state.size,
    isMinimized: state.isMinimized,
  }));
};
```

## アニメーション

### トランジション設定

```typescript
const panelTransition = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
  transition: { duration: 0.2, ease: 'easeInOut' }
};

// スプリングアニメーション（ドラッグ終了時）
const springConfig = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
};
```

### 最小化アニメーション

```typescript
const minimizePanel = () => {
  setIsMinimized(true);
  
  // パネルをボタン位置に収束
  anime({
    targets: panelRef.current,
    width: 56,
    height: 56,
    borderRadius: '50%',
    duration: 300,
    easing: 'easeInOutQuad',
  });
};
```

## レスポンシブデザイン

### ブレークポイント

```typescript
const useResponsive = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  return {
    isMobile,
    isTablet,
    panelConfig: {
      width: isMobile ? '100vw' : isTablet ? 350 : 400,
      height: isMobile ? '100vh' : 600,
      draggable: !isMobile,
      resizable: !isMobile && !isTablet,
    }
  };
};
```

### モバイル対応

```typescript
// モバイルでは全画面表示
const MobileChatPanel = () => (
  <Drawer
    anchor="bottom"
    open={isOpen}
    onClose={handleClose}
    PaperProps={{
      sx: {
        height: '100vh',
        borderRadius: '16px 16px 0 0',
      }
    }}
  >
    {/* チャットコンテンツ */}
  </Drawer>
);
```

## アクセシビリティ

### キーボード操作

```typescript
const handleKeyDown = (e: React.KeyboardEvent) => {
  switch (e.key) {
    case 'Escape':
      if (isOpen) handleClose();
      break;
    case 'F4':
      if (e.altKey) handleClose();
      break;
    case 'm':
      if (e.ctrlKey) toggleMinimize();
      break;
  }
};
```

### フォーカス管理

```typescript
useEffect(() => {
  if (isOpen && !isMinimized) {
    // パネルが開いたら入力フィールドにフォーカス
    messageInputRef.current?.focus();
  }
}, [isOpen, isMinimized]);

// フォーカストラップ
const handleTabKey = (e: KeyboardEvent) => {
  if (!isOpen || e.key !== 'Tab') return;
  
  const focusableElements = panelRef.current?.querySelectorAll(
    'button, input, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  // タブキーでのフォーカス循環を実装
};
```

### ARIA属性

```html
<div
  role="dialog"
  aria-label="チャットパネル"
  aria-modal="true"
  aria-describedby="chat-panel-desc"
>
  <div id="chat-panel-desc" className="sr-only">
    ドラッグ可能なチャットパネル。Escapeキーで閉じます。
  </div>
</div>
```

## パフォーマンス最適化

### 仮想化スクロール

```typescript
import { VariableSizeList } from 'react-window';

const VirtualizedMessageList = ({ messages }) => {
  const getItemSize = (index: number) => {
    // メッセージの高さを動的に計算
    const message = messages[index];
    const baseHeight = 60;
    const lineHeight = 20;
    const lines = Math.ceil(message.content.length / 50);
    return baseHeight + (lines - 1) * lineHeight;
  };
  
  return (
    <VariableSizeList
      height={500}
      itemCount={messages.length}
      itemSize={getItemSize}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          <MessageItem message={messages[index]} />
        </div>
      )}
    </VariableSizeList>
  );
};
```

### メモ化

```typescript
// パネルヘッダーのメモ化
const PanelHeader = React.memo(({ channel, onClose, onMinimize }) => (
  <Box sx={{ 
    display: 'flex', 
    alignItems: 'center',
    p: 1,
    borderBottom: 1,
    borderColor: 'divider'
  }}>
    <Typography variant="h6" sx={{ flexGrow: 1 }}>
      {channel?.display_name || 'チャット'}
    </Typography>
    <IconButton size="small" onClick={onMinimize}>
      <MinimizeIcon />
    </IconButton>
    <IconButton size="small" onClick={onClose}>
      <CloseIcon />
    </IconButton>
  </Box>
));
```

## エラー処理

### 境界エラー

```typescript
class ChatPanelErrorBoundary extends React.Component {
  state = { hasError: false };
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ChatPanel error:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography color="error">
            チャットパネルでエラーが発生しました
          </Typography>
          <Button onClick={() => this.setState({ hasError: false })}>
            再試行
          </Button>
        </Box>
      );
    }
    
    return this.props.children;
  }
}
```

## スタイリング

### テーマ統合

```typescript
const useStyles = makeStyles((theme) => ({
  panel: {
    position: 'fixed',
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[8],
    borderRadius: theme.shape.borderRadius,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    
    // ダークモード対応
    [theme.palette.mode === 'dark']: {
      borderColor: theme.palette.divider,
      borderWidth: 1,
      borderStyle: 'solid',
    }
  },
  
  dragHandle: {
    cursor: 'move',
    height: 40,
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(0, 2),
    
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    }
  }
}));
```

## 今後の拡張

1. **リサイズ機能**: 四辺からのリサイズ対応
2. **複数パネル**: 複数のチャットを同時に開く
3. **タブ機能**: 一つのパネルで複数チャンネル切り替え
4. **ポップアウト**: 別ウィンドウでの表示
5. **通知バッジ**: 未読メッセージ数の表示

## 関連ドキュメント

- [ChatMiniView実装](../../mattermost-chat-client/src/components/ChatMiniView.tsx)
- [メッセージリスト設計](./message-list.md)
- [UIコンポーネントガイド](./ui-components.md)

---

作成日: 2025-01-21  
最終更新: 2025-01-21