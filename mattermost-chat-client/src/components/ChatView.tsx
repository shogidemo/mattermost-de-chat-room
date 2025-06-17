import React, { useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Tag as PublicIcon,
  Lock as PrivateIcon,
  Person as DirectIcon,
  Group as GroupIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useApp } from '../contexts/AppContext';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

const ChatView: React.FC = () => {
  const { state } = useApp();
  const { currentChannel, currentTeam, posts, isLoading } = state;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 新しいメッセージが追加されたら自動スクロール
  useEffect(() => {
    scrollToBottom();
  }, [posts, currentChannel]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // チャンネルタイプに応じたアイコンを取得
  const getChannelIcon = (channelType: string) => {
    switch (channelType) {
      case 'O':
        return <PublicIcon fontSize="small" />;
      case 'P':
        return <PrivateIcon fontSize="small" />;
      case 'D':
        return <DirectIcon fontSize="small" />;
      case 'G':
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
        return 'ダイレクトメッセージ';
      case 'G':
        return 'グループメッセージ';
      default:
        return '';
    }
  };

  // チャンネル情報の表示
  const getChannelInfo = () => {
    if (!currentChannel) return null;

    const displayName = currentChannel.display_name || currentChannel.name;
    const memberCount = currentChannel.total_msg_count || 0;

    return {
      displayName,
      purpose: currentChannel.purpose,
      header: currentChannel.header,
      memberCount,
      typeLabel: getChannelTypeLabel(currentChannel.type),
    };
  };

  const channelInfo = getChannelInfo();
  const currentChannelPosts = currentChannel ? posts[currentChannel.id] || [] : [];

  if (!currentChannel) {
    return (
      <Paper sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box textAlign="center">
          <Typography variant="h6" color="text.secondary" gutterBottom>
            チャンネルを選択してください
          </Typography>
          <Typography variant="body2" color="text.secondary">
            左側のチャンネル一覧からチャンネルを選択して、チャットを開始しましょう
          </Typography>
        </Box>
      </Paper>
    );
  }

  if (!currentTeam) {
    return (
      <Paper sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          チームが選択されていません
        </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* チャンネルヘッダー */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar variant="dense">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
            {getChannelIcon(currentChannel.type)}
            <Typography variant="h6" component="div" noWrap>
              {channelInfo?.displayName}
            </Typography>
            {channelInfo?.typeLabel && (
              <Chip
                label={channelInfo.typeLabel}
                size="small"
                variant="outlined"
                sx={{ ml: 1 }}
              />
            )}
          </Box>
          
          <IconButton size="small" color="inherit">
            <InfoIcon />
          </IconButton>
        </Toolbar>
        
        {/* チャンネル説明・目的 */}
        {(channelInfo?.purpose || channelInfo?.header) && (
          <Box sx={{ px: 2, pb: 1 }}>
            {channelInfo.header && (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                📌 {channelInfo.header}
              </Typography>
            )}
            {channelInfo.purpose && (
              <Typography variant="body2" color="text.secondary">
                💡 {channelInfo.purpose}
              </Typography>
            )}
          </Box>
        )}
      </AppBar>

      {/* メッセージ一覧 */}
      <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
          {isLoading && currentChannelPosts.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <Typography variant="body2" color="text.secondary">
                メッセージを読み込み中...
              </Typography>
            </Box>
          ) : currentChannelPosts.length === 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {channelInfo?.displayName} へようこそ！
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                このチャンネルの最初のメッセージを送信して、会話を始めましょう。
              </Typography>
            </Box>
          ) : (
            <MessageList posts={currentChannelPosts} />
          )}
          <div ref={messagesEndRef} />
        </Box>

        {/* メッセージ入力 */}
        <Box sx={{ borderTop: 1, borderColor: 'divider' }}>
          <MessageInput />
        </Box>
      </Box>
    </Box>
  );
};

export default ChatView;