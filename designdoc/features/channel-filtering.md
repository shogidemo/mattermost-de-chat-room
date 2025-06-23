# チャンネルフィルタリング機能設計

## 概要

チャンネルフィルタリング機能は、ユーザーが多数のチャンネルから必要なものを素早く見つけられるようにする検索・フィルタ機能です。リアルタイムでの絞り込みとチャンネルタイプ別のフィルタリングをサポートしています。

## 機能要件

### 1. テキスト検索
- チャンネル名での部分一致検索
- 大文字小文字を区別しない
- リアルタイム検索（入力と同時に結果更新）

### 2. タイプ別フィルタ
- パブリックチャンネル
- プライベートチャンネル
- ダイレクトメッセージ（DM）
- グループメッセージ

### 3. 視覚的フィードバック
- フィルタ適用時の表示/非表示
- 検索結果のハイライト（オプション）
- 結果なし時のメッセージ表示

## 技術設計

### UI構成

```tsx
<Box>
  {/* 検索入力フィールド */}
  <TextField
    fullWidth
    variant="outlined"
    placeholder="チャンネルを検索..."
    value={searchTerm}
    onChange={handleSearchChange}
    InputProps={{
      startAdornment: <SearchIcon />
    }}
  />
  
  {/* フィルタチップ */}
  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
    <Chip
      label="パブリック"
      onClick={() => toggleFilter('public')}
      color={activeFilters.public ? 'primary' : 'default'}
    />
    {/* 他のフィルタチップ... */}
  </Box>
</Box>
```

### 状態管理

```typescript
interface ChannelFilterState {
  searchTerm: string;
  activeFilters: {
    public: boolean;
    private: boolean;
    direct: boolean;
    group: boolean;
  };
}

// 初期状態
const initialFilterState: ChannelFilterState = {
  searchTerm: '',
  activeFilters: {
    public: false,
    private: false,
    direct: false,
    group: false,
  }
};
```

### フィルタリングロジック

```typescript
const getFilteredChannels = (
  channels: Channel[],
  searchTerm: string,
  activeFilters: FilterState
): Channel[] => {
  return channels.filter((channel) => {
    // テキスト検索
    const matchesSearch = searchTerm === '' || 
      channel.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      channel.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    // タイプフィルタ
    const hasActiveFilters = Object.values(activeFilters).some(v => v);
    if (!hasActiveFilters) return true;
    
    // チャンネルタイプ判定
    switch (channel.type) {
      case 'O': // Open (Public)
        return activeFilters.public;
      case 'P': // Private
        return activeFilters.private;
      case 'D': // Direct Message
        return activeFilters.direct;
      case 'G': // Group Message
        return activeFilters.group;
      default:
        return false;
    }
  });
};
```

### パフォーマンス最適化

#### 1. デバウンス処理

```typescript
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
};

// 使用例
const debouncedSearchTerm = useDebounce(searchTerm, 300);
```

#### 2. メモ化

```typescript
const filteredChannels = useMemo(
  () => getFilteredChannels(channels, debouncedSearchTerm, activeFilters),
  [channels, debouncedSearchTerm, activeFilters]
);
```

### 実装詳細

#### isFiltered プロパティの活用

```typescript
// チャンネルリストでの実装
const renderChannels = () => {
  return channels.map((channel) => {
    const isFiltered = !filteredChannelIds.includes(channel.id);
    
    return (
      <ChannelItem
        key={channel.id}
        channel={channel}
        isFiltered={isFiltered}
        onClick={() => handleChannelSelect(channel)}
      />
    );
  });
};

// ChannelItemコンポーネント
const ChannelItem: React.FC<Props> = ({ channel, isFiltered }) => {
  return (
    <ListItem
      sx={{
        display: isFiltered ? 'none' : 'flex',
        // または
        opacity: isFiltered ? 0.3 : 1,
        pointerEvents: isFiltered ? 'none' : 'auto',
      }}
    >
      {/* チャンネル情報表示 */}
    </ListItem>
  );
};
```

## UX設計

### 1. 即座のフィードバック
- 入力と同時に結果を更新
- スムーズなアニメーション
- ローディング状態の表示（大量データ時）

### 2. フィルタの明確化
- アクティブなフィルタの視覚的強調
- フィルタ解除の簡単な方法
- 適用中のフィルタ数の表示

### 3. 空状態の処理

```tsx
{filteredChannels.length === 0 && (
  <Box sx={{ textAlign: 'center', py: 4 }}>
    <Typography variant="body2" color="text.secondary">
      検索条件に一致するチャンネルが見つかりません
    </Typography>
    <Button onClick={clearFilters} size="small">
      フィルタをクリア
    </Button>
  </Box>
)}
```

## アクセシビリティ

### キーボード操作
- Tab キーでのフォーカス移動
- Enter キーでのチャンネル選択
- Escape キーでの検索クリア

### スクリーンリーダー対応

```tsx
<TextField
  aria-label="チャンネル検索"
  inputProps={{
    'aria-describedby': 'search-helper-text'
  }}
/>
<Typography id="search-helper-text" variant="caption">
  チャンネル名で検索できます
</Typography>
```

## 拡張可能性

### 1. 高度な検索オプション
- 正規表現サポート
- 複数キーワード検索
- 除外検索（NOT検索）

### 2. 検索履歴
- 最近の検索を保存
- よく使う検索条件の保存

### 3. ソート機能との統合
- 検索結果のソート
- 関連度順の表示

## 実装上の注意点

### 1. 大量チャンネルへの対応
- 仮想スクロールの検討
- ページネーション
- 遅延ローディング

### 2. リアルタイム更新との整合性
- 新規チャンネルの追加時の処理
- チャンネル情報更新時の再フィルタ

### 3. モバイル対応
- タッチ操作の最適化
- 小画面でのUI調整

## テスト戦略

### 単体テスト
```typescript
describe('getFilteredChannels', () => {
  it('should filter channels by search term', () => {
    const channels = [
      { display_name: 'General', ... },
      { display_name: 'Random', ... },
    ];
    
    const result = getFilteredChannels(channels, 'gen', {});
    expect(result).toHaveLength(1);
    expect(result[0].display_name).toBe('General');
  });
});
```

### 統合テスト
- ユーザー入力からUIレンダリングまでの一連の流れ
- フィルタ組み合わせのテスト

## 関連ドキュメント

- [ChannelList実装](../../mattermost-chat-client/src/components/ChannelList.tsx)
- [チャンネル管理設計](../architecture/overview.md)
- [UIコンポーネント設計ガイド](./ui-components.md)

---

作成日: 2025-01-21  
最終更新: 2025-01-21