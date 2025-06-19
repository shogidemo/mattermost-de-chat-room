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
import { useApp } from '../contexts/AppContext';
import type { Channel, ChannelWithPreview } from '../types/mattermost';

interface ChannelListProps {
  onChannelSelect?: (channel: ChannelWithPreview) => void;
}

const ChannelList: React.FC<ChannelListProps> = ({ onChannelSelect }) => {
  const { state, selectChannel, getChannelsWithPreview, filterChannels } = useApp();
  const { channels, currentChannel, currentTeam } = state;
  const [channelsWithPreview, setChannelsWithPreview] = React.useState<ChannelWithPreview[]>([]);
  const [isLoadingPreviews, setIsLoadingPreviews] = React.useState(false);
  const [filterText, setFilterText] = React.useState(''); // デフォルトは空（フィルターなし）
  const [filteredChannels, setFilteredChannels] = React.useState<ChannelWithPreview[]>([]);

  // チャンネルプレビューの読み込み
  React.useEffect(() => {
    const loadChannelPreviews = async () => {
      if (channels.length > 0 && !isLoadingPreviews) {
        setIsLoadingPreviews(true);
        try {
          const previewChannels = await getChannelsWithPreview();
          setChannelsWithPreview(previewChannels);
        } catch (error) {
          console.error('チャンネルプレビュー読み込みエラー:', error);
          // エラー時は通常のチャンネルデータを使用
          setChannelsWithPreview(channels.map(ch => ({ ...ch })));
        } finally {
          setIsLoadingPreviews(false);
        }
      }
    };

    loadChannelPreviews();
  }, [channels, getChannelsWithPreview, isLoadingPreviews]);

  // フィルター適用
  React.useEffect(() => {
    if (channelsWithPreview.length > 0) {
      const filtered = filterChannels(channelsWithPreview, filterText);
      setFilteredChannels(filtered);
      console.log('🔍 チャンネルフィルター適用:', { 
        filterText, 
        totalChannels: channelsWithPreview.length, 
        filteredChannels: filtered.length,
        filteredChannelNames: filtered.map(ch => ch.display_name || ch.name)
      });
    }
  }, [channelsWithPreview, filterText, filterChannels]);

  // フィルターテキストの変更ハンドラー
  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilterText(event.target.value);
  };

  // フィルタークリア
  const clearFilter = () => {
    setFilterText('');
  };

  // チャンネルタイプに応じたアイコンを取得
  const getChannelIcon = (channelType: string) => {
    switch (channelType) {
      case 'O': // オープンチャンネル
        return <PublicIcon fontSize="small" />;
      case 'P': // プライベートチャンネル
        return <PrivateIcon fontSize="small" />;
      case 'D': // ダイレクトメッセージ
        return <DirectIcon fontSize="small" />;
      case 'G': // グループダイレクトメッセージ
        return <GroupIcon fontSize="small" />;
      default:
        return <PublicIcon fontSize="small" />;
    }
  };


  // チャンネル名の表示用フォーマット
  const getDisplayName = (channel: ChannelWithPreview) => {
    if (channel.type === 'D') {
      // ダイレクトメッセージの場合、相手のユーザー名を表示
      // 実際の実装では、チャンネル名から現在のユーザーIDを除いて相手を特定
      return channel.display_name || `@${channel.name}`;
    }
    return channel.display_name || channel.name;
  };

  // メッセージプレビューの時刻フォーマット
  const formatPreviewTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) {
      return '今';
    } else if (diffMins < 60) {
      return `${diffMins}分前`;
    } else if (diffHours < 24) {
      return `${diffHours}時間前`;
    } else if (diffDays < 7) {
      return `${diffDays}日前`;
    } else {
      return date.toLocaleDateString('ja-JP', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  // チャンネルをカテゴリ別に分類（フィルター済みチャンネルを使用）
  const categorizeChannels = () => {
    const channelsToUse = filteredChannels.length > 0 ? filteredChannels : 
                          channelsWithPreview.length > 0 ? channelsWithPreview : channels;
    const categories = {
      public: channelsToUse.filter(ch => ch.type === 'O'),
      private: channelsToUse.filter(ch => ch.type === 'P'),
      direct: channelsToUse.filter(ch => ch.type === 'D'),
      group: channelsToUse.filter(ch => ch.type === 'G'),
    };
    return categories;
  };

  const categorizedChannels = categorizeChannels();

  const handleChannelSelect = async (channel: ChannelWithPreview) => {
    try {
      await selectChannel(channel);
      // 親コンポーネントのハンドラーがあれば呼び出す
      if (onChannelSelect) {
        onChannelSelect(channel);
      }
    } catch (error) {
      console.error('チャンネル選択エラー:', error);
    }
  };

  const renderChannelCategory = (title: string, channels: ChannelWithPreview[], showDivider = true) => {
    if (channels.length === 0) return null;

    return (
      <>
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2" color="text.secondary" fontWeight="bold">
            {title}
          </Typography>
        </Box>
        <List dense>
          {channels.map((channel) => (
            <ListItem key={channel.id} disablePadding>
              <ListItemButton
                selected={currentChannel?.id === channel.id}
                onClick={() => handleChannelSelect(channel)}
                sx={{
                  pl: 2,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {getChannelIcon(channel.type)}
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
                        }}
                      >
                        {getDisplayName(channel)}
                      </Typography>
                      {channel.unreadCount && channel.unreadCount > 0 && (
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
                    </Box>
                  }
                  secondary={
                    channel.lastMessage ? (
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
                          {channel.lastMessage.userName}: {channel.lastMessage.content}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ whiteSpace: 'nowrap' }}
                        >
                          {formatPreviewTime(channel.lastMessage.timestamp)}
                        </Typography>
                      </Box>
                    ) : channel.purpose ? (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          display: 'block',
                        }}
                      >
                        {channel.purpose}
                      </Typography>
                    ) : (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontStyle: 'italic' }}
                      >
                        メッセージがありません
                      </Typography>
                    )
                  }
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        {showDivider && <Divider />}
      </>
    );
  };

  if (!currentTeam) {
    return (
      <Paper sx={{ height: '100%', p: 2 }}>
        <Typography variant="body2" color="text.secondary" align="center">
          チームが選択されていません
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ height: '100%', overflow: 'auto' }}>
      {/* チーム名表示 */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" noWrap>
          {currentTeam.display_name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {channels.length} チャンネル
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
            「{filterText}」で絞り込み中 ({Object.values(categorizedChannels).flat().length}件)
          </Typography>
        )}
      </Box>

      {/* チャンネル一覧 */}
      <Box sx={{ flex: 1 }}>
        {renderChannelCategory('パブリックチャンネル', categorizedChannels.public)}
        {renderChannelCategory('プライベートチャンネル', categorizedChannels.private)}
        {renderChannelCategory('ダイレクトメッセージ', categorizedChannels.direct)}
        {renderChannelCategory('グループメッセージ', categorizedChannels.group, false)}
      </Box>

      {/* フッター（オプション） */}
      <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary" align="center" display="block">
          Mattermost チャット
        </Typography>
      </Box>
    </Paper>
  );
};

export default ChannelList;