# メンション機能設計

## 概要

メンション機能は、特定のユーザーやグループに対して通知を送る仕組みです。`@username` 形式でユーザーをメンションすることで、対象ユーザーの注意を引き、効率的なコミュニケーションを実現します。

## 機能要件

### 1. メンション入力
- `@` 文字入力時に自動補完UIを表示
- ユーザー名の部分一致検索
- キーボードナビゲーション対応
- マウスクリックでの選択

### 2. メンション表示
- メッセージ内のメンションをハイライト表示
- 自分宛のメンションを特別に強調
- ユーザー情報のツールチップ表示

### 3. 特殊メンション
- `@channel`: チャンネル全員への通知
- `@here`: オンラインユーザーへの通知
- `@all`: 全メンバーへの通知（権限制御あり）

## 技術設計

### コンポーネント構成

```tsx
// メンション入力を含むメッセージ入力コンポーネント
<MessageInput>
  <TextField
    multiline
    value={message}
    onChange={handleChange}
    onKeyDown={handleKeyDown}
    inputRef={inputRef}
  />
  
  {showMentionPopup && (
    <MentionAutocomplete
      searchTerm={mentionSearch}
      position={cursorPosition}
      onSelect={handleMentionSelect}
      onClose={() => setShowMentionPopup(false)}
    />
  )}
</MessageInput>
```

### 状態管理

```typescript
interface MentionState {
  showMentionPopup: boolean;
  mentionSearch: string;
  mentionStartPosition: number;
  cursorPosition: { top: number; left: number };
  selectedIndex: number;
  filteredUsers: User[];
}
```

### メンション検出ロジック

```typescript
const detectMentionTrigger = (
  text: string,
  cursorPos: number
): { triggered: boolean; searchTerm: string; startPos: number } => {
  // カーソル位置から前方を検索
  let startPos = cursorPos - 1;
  
  // @記号を探す
  while (startPos >= 0) {
    const char = text[startPos];
    
    // スペースや改行で区切られたら終了
    if (/\s/.test(char)) {
      break;
    }
    
    // @記号を発見
    if (char === '@') {
      const searchTerm = text.substring(startPos + 1, cursorPos);
      
      // @の前が単語境界であることを確認
      const prevChar = startPos > 0 ? text[startPos - 1] : ' ';
      if (/\s/.test(prevChar) || startPos === 0) {
        return {
          triggered: true,
          searchTerm,
          startPos
        };
      }
      break;
    }
    
    startPos--;
  }
  
  return { triggered: false, searchTerm: '', startPos: -1 };
};
```

### 自動補完コンポーネント

```typescript
interface MentionAutocompleteProps {
  searchTerm: string;
  position: { top: number; left: number };
  onSelect: (user: User) => void;
  onClose: () => void;
}

const MentionAutocomplete: React.FC<MentionAutocompleteProps> = ({
  searchTerm,
  position,
  onSelect,
  onClose
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { state } = useAppContext();
  
  // ユーザーフィルタリング
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return [];
    
    const members = state.channelMembers[state.currentChannel?.id || ''] || [];
    return members.filter(member =>
      member.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.nickname?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, state.channelMembers, state.currentChannel]);
  
  // キーボードナビゲーション
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredUsers.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredUsers.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredUsers[selectedIndex]) {
            onSelect(filteredUsers[selectedIndex]);
          }
          break;
        case 'Escape':
          onClose();
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredUsers, selectedIndex, onSelect, onClose]);
  
  return (
    <Paper
      sx={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        maxHeight: 200,
        overflow: 'auto',
        zIndex: 1300,
      }}
    >
      <List dense>
        {filteredUsers.map((user, index) => (
          <ListItem
            key={user.id}
            selected={index === selectedIndex}
            onClick={() => onSelect(user)}
            sx={{ cursor: 'pointer' }}
          >
            <ListItemAvatar>
              <Avatar src={user.avatar_url} alt={user.username}>
                {user.username[0].toUpperCase()}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={user.nickname || user.username}
              secondary={`@${user.username}`}
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};
```

### メンション挿入処理

```typescript
const insertMention = (user: User) => {
  const { text, mentionStartPosition, cursorPosition } = state;
  
  // メンションテキストを作成
  const mentionText = `@${user.username} `;
  
  // テキストの前後を分割
  const beforeMention = text.substring(0, mentionStartPosition);
  const afterMention = text.substring(cursorPosition);
  
  // 新しいテキストを生成
  const newText = beforeMention + mentionText + afterMention;
  
  // カーソル位置を更新
  const newCursorPos = beforeMention.length + mentionText.length;
  
  // 状態を更新
  setText(newText);
  inputRef.current?.setSelectionRange(newCursorPos, newCursorPos);
  setShowMentionPopup(false);
};
```

### メンション表示処理

```typescript
const renderMessageWithMentions = (message: string, currentUserId: string) => {
  // メンションパターン
  const mentionRegex = /@(\w+)/g;
  
  const parts = message.split(mentionRegex);
  
  return parts.map((part, index) => {
    // 偶数インデックスは通常のテキスト
    if (index % 2 === 0) {
      return <span key={index}>{part}</span>;
    }
    
    // 奇数インデックスはメンション
    const username = part;
    const isCurrentUser = username === currentUserId;
    
    return (
      <Chip
        key={index}
        label={`@${username}`}
        size="small"
        color={isCurrentUser ? 'primary' : 'default'}
        sx={{
          mx: 0.5,
          cursor: 'pointer',
          backgroundColor: isCurrentUser ? 'primary.light' : undefined,
        }}
        onClick={() => handleMentionClick(username)}
      />
    );
  });
};
```

## UIデザイン

### 自動補完ポップアップ
- ユーザーアバター表示
- ニックネームとユーザー名の両方を表示
- オンライン状態インジケーター
- 最大5件まで表示（スクロール可能）

### メンションハイライト
- 通常のメンション: 青色の背景
- 自分宛のメンション: 黄色の背景 + 太字
- ホバー時: ユーザー情報のツールチップ

## パフォーマンス最適化

### 1. ユーザーリストのキャッシュ

```typescript
const userCache = useMemo(() => {
  const cache = new Map<string, User>();
  Object.values(state.channelMembers).flat().forEach(user => {
    cache.set(user.id, user);
  });
  return cache;
}, [state.channelMembers]);
```

### 2. デバウンス検索

```typescript
const debouncedSearch = useMemo(
  () => debounce((term: string) => {
    searchUsers(term);
  }, 150),
  []
);
```

### 3. 仮想化リスト（大量ユーザー対応）

```typescript
import { FixedSizeList } from 'react-window';

const VirtualizedUserList = ({ users, onSelect }) => (
  <FixedSizeList
    height={200}
    itemCount={users.length}
    itemSize={56}
    width="100%"
  >
    {({ index, style }) => (
      <div style={style}>
        <UserItem user={users[index]} onSelect={onSelect} />
      </div>
    )}
  </FixedSizeList>
);
```

## セキュリティ考慮事項

### 1. XSS対策

```typescript
// メンションをサニタイズ
const sanitizeMention = (username: string): string => {
  return username.replace(/[^\w-]/g, '');
};
```

### 2. 権限チェック

```typescript
const canMentionAll = (user: User, channel: Channel): boolean => {
  // チャンネル管理者のみ@allを使用可能
  return channel.creator_id === user.id || user.roles.includes('admin');
};
```

## アクセシビリティ

### 1. スクリーンリーダー対応

```typescript
<span role="button" aria-label={`メンション: ${username}`}>
  @{username}
</span>
```

### 2. キーボードナビゲーション
- Tab: 次の要素へ移動
- Shift+Tab: 前の要素へ移動
- Enter: 選択
- Escape: キャンセル

## 今後の拡張

### 1. グループメンション
- カスタムグループの作成
- 部署・役職別のメンション

### 2. メンション通知
- デスクトップ通知
- メール通知
- プッシュ通知

### 3. メンション分析
- メンション頻度の統計
- 未読メンションの管理

## テスト戦略

### 単体テスト

```typescript
describe('detectMentionTrigger', () => {
  it('should detect @ at the beginning of input', () => {
    const result = detectMentionTrigger('@user', 5);
    expect(result.triggered).toBe(true);
    expect(result.searchTerm).toBe('user');
  });
  
  it('should not detect @ in the middle of a word', () => {
    const result = detectMentionTrigger('email@domain', 12);
    expect(result.triggered).toBe(false);
  });
});
```

### 統合テスト

```typescript
it('should show autocomplete popup when typing @', async () => {
  const { getByRole, getByText } = render(<MessageInput />);
  const input = getByRole('textbox');
  
  await userEvent.type(input, 'Hello @');
  
  expect(getByText('ユーザーを選択')).toBeInTheDocument();
});
```

## 関連ドキュメント

- [MessageInput実装](../../mattermost-chat-client/src/components/MessageInput.tsx)
- [MessageList実装](../../mattermost-chat-client/src/components/MessageList.tsx)
- [状態管理設計](../architecture/state-management.md)

---

作成日: 2025-01-21  
最終更新: 2025-01-21