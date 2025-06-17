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
} from '@mui/material';
import {
  Tag as PublicIcon,
  Lock as PrivateIcon,
  Person as DirectIcon,
  Group as GroupIcon,
} from '@mui/icons-material';
import { useApp } from '../contexts/AppContext';
import { Channel } from '../types/mattermost';

const ChannelList: React.FC = () => {
  const { state, selectChannel } = useApp();
  const { channels, currentChannel, currentTeam } = state;

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

  // チャンネルタイプの日本語表示
  const getChannelTypeLabel = (channelType: string) => {
    switch (channelType) {
      case 'O':
        return 'パブリック';
      case 'P':
        return 'プライベート';
      case 'D':
        return 'DM';
      case 'G':
        return 'グループDM';
      default:
        return '';
    }
  };

  // チャンネル名の表示用フォーマット
  const getDisplayName = (channel: Channel) => {
    if (channel.type === 'D') {
      // ダイレクトメッセージの場合、相手のユーザー名を表示
      // 実際の実装では、チャンネル名から現在のユーザーIDを除いて相手を特定
      return channel.display_name || `@${channel.name}`;
    }
    return channel.display_name || channel.name;
  };

  // チャンネルをカテゴリ別に分類
  const categorizeChannels = () => {
    const categories = {
      public: channels.filter(ch => ch.type === 'O'),
      private: channels.filter(ch => ch.type === 'P'),
      direct: channels.filter(ch => ch.type === 'D'),
      group: channels.filter(ch => ch.type === 'G'),
    };
    return categories;
  };

  const categorizedChannels = categorizeChannels();

  const handleChannelSelect = async (channel: Channel) => {
    try {
      await selectChannel(channel);
    } catch (error) {
      console.error('チャンネル選択エラー:', error);
    }
  };

  const renderChannelCategory = (title: string, channels: Channel[], showDivider = true) => {
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
                      {channel.total_msg_count > 0 && (
                        <Chip
                          label={channel.total_msg_count}
                          size="small"
                          variant="outlined"
                          sx={{ minWidth: 'auto', height: 20, fontSize: '0.75rem' }}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    channel.purpose && (
                      <Typography
                        variant="caption"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          display: 'block',
                        }}
                      >
                        {channel.purpose}
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