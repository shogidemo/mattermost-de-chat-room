import React from 'react';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Chip,
  Divider,
  Paper,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Tag as PublicIcon,
  Lock as PrivateIcon,
  Person as DirectIcon,
  Group as GroupIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';

// モックチャンネル型
interface MockChannel {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  icon: string;
  isOnline: boolean;
}

// プロップス
interface ChannelListDebugProps {
  channels: MockChannel[];
  onChannelSelect?: (channel: MockChannel) => void;
}

const ChannelListDebug: React.FC<ChannelListDebugProps> = ({ 
  channels, 
  onChannelSelect 
}) => {
  const [filterText, setFilterText] = React.useState('佐藤'); // デフォルトで「佐藤」フィルターを適用
  const [filteredChannels, setFilteredChannels] = React.useState<MockChannel[]>([]);

  // フィルター適用
  React.useEffect(() => {
    if (channels.length > 0) {
      const filtered = filterChannels(channels, filterText);
      setFilteredChannels(filtered);
      console.log('🔍 チャンネルフィルター適用:', { 
        filterText, 
        totalChannels: channels.length, 
        filteredChannels: filtered.length,
        filteredChannelNames: filtered.map(ch => ch.name)
      });
    }
  }, [channels, filterText]);

  // フィルター機能
  const filterChannels = (channels: MockChannel[], filter: string): MockChannel[] => {
    if (!filter.trim()) {
      return channels;
    }

    const filterLower = filter.toLowerCase().trim();
    
    return channels.filter(channel => {
      const channelName = channel.name.toLowerCase();
      return channelName.includes(filterLower);
    });
  };

  // フィルターテキストの変更ハンドラー
  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilterText(event.target.value);
  };

  // フィルタークリア
  const clearFilter = () => {
    setFilterText('');
  };

  // チャンネル選択ハンドラー
  const handleChannelSelect = (channel: MockChannel) => {
    console.log('📍 チャンネル選択:', channel.name);
    if (onChannelSelect) {
      onChannelSelect(channel);
    }
  };

  // 最新のアクティビティ順でソート
  const sortChannelsByActivity = (channels: MockChannel[]): MockChannel[] => {
    return [...channels].sort((a, b) => {
      // 未読がある方を優先
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
      if (b.unreadCount > 0 && a.unreadCount === 0) return 1;
      
      // タイムスタンプで比較（新しい順）
      // 簡易実装: timestampが具体的な時刻なら優先
      if (a.timestamp.includes(':') && !b.timestamp.includes(':')) return -1;
      if (b.timestamp.includes(':') && !a.timestamp.includes(':')) return 1;
      
      return 0;
    });
  };

  const displayChannels = sortChannelsByActivity(filteredChannels.length > 0 ? filteredChannels : channels);

  return (
    <Paper sx={{ height: '100%', overflow: 'auto' }}>
      {/* タイトル */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" noWrap>
          🧪 チャンネルリスト（デバッグ版）
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {channels.length} チャンネル（{displayChannels.length} 表示中）
        </Typography>
      </Box>

      {/* チャンネルフィルター */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <TextField
          fullWidth
          size="small"
          placeholder="チャンネルを検索..."
          value={filterText}
          onChange={handleFilterChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: filterText && (
              <InputAdornment position="end">
                <ClearIcon 
                  fontSize="small" 
                  sx={{ cursor: 'pointer' }} 
                  onClick={clearFilter}
                />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: 'divider',
              },
            },
          }}
        />
        {filterText && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            「{filterText}」で絞り込み中 ({displayChannels.length}件)
          </Typography>
        )}
      </Box>

      {/* チャンネル一覧 */}
      <Box sx={{ flex: 1 }}>
        <List dense>
          {displayChannels.map((channel) => (
            <ListItem key={channel.id} disablePadding>
              <ListItemButton
                onClick={() => handleChannelSelect(channel)}
                sx={{
                  pl: 2,
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Box sx={{ fontSize: '1.2em' }}>{channel.icon}</Box>
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: 1,
                          fontWeight: channel.unreadCount > 0 ? 'bold' : 'normal'
                        }}
                      >
                        {channel.name}
                      </Typography>
                      {channel.unreadCount > 0 && (
                        <Chip
                          label={channel.unreadCount}
                          size="small"
                          color="error"
                          sx={{ 
                            minWidth: 'auto', 
                            height: 20, 
                            fontSize: '0.75rem',
                            fontWeight: 'bold'
                          }}
                        />
                      )}
                      {channel.isOnline && (
                        <Box sx={{ 
                          width: 8, 
                          height: 8, 
                          backgroundColor: 'success.main', 
                          borderRadius: '50%' 
                        }} />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: 1,
                          mr: 1,
                        }}
                      >
                        {channel.lastMessage}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ whiteSpace: 'nowrap' }}
                      >
                        {channel.timestamp}
                      </Typography>
                    </Box>
                  }
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        
        {displayChannels.length === 0 && filterText && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              「{filterText}」に一致するチャンネルがありません
            </Typography>
          </Box>
        )}
      </Box>

      {/* 機能デモ情報 */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Typography variant="caption" color="text.secondary" display="block">
          ✅ 実装済み機能デモ:
        </Typography>
        <Typography variant="caption" color="success.main" display="block">
          1. ユーザー名表示（モック） 2. 最新メッセージプレビュー 3. 未読数バッジ 4. アクティビティ順ソート 5. チャンネルフィルター
        </Typography>
      </Box>
    </Paper>
  );
};

export default ChannelListDebug;