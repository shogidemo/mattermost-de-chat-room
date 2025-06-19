import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Badge,
  Typography,
  IconButton,
  Box,
  Divider,
  Fade,
} from '@mui/material';
import {
  Close as CloseIcon,
  Circle as CircleIcon,
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import ChatMiniView from './ChatMiniView';
import ChatMiniViewDebug from './ChatMiniViewDebug';
import ChannelList from './ChannelList';
import { useApp } from '../contexts/AppContext';

interface Channel {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  icon: string;
  isOnline?: boolean;
}

type ViewState = 'channelList' | 'chat';

interface ChannelListPopupProps {
  open: boolean;
  onClose: () => void;
  channels: Channel[];
}

const ChannelListPopup: React.FC<ChannelListPopupProps> = ({
  open,
  onClose,
  channels,
}) => {
  const { refreshChannels, state } = useApp();
  const [viewState, setViewState] = React.useState<ViewState>('channelList');
  const [selectedChannel, setSelectedChannel] = React.useState<Channel | null>(null);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // ポップアップが閉じるときにビューをリセット
  React.useEffect(() => {
    if (!open) {
      setViewState('channelList');
      setSelectedChannel(null);
    }
  }, [open]);

  // チャンネルリストの自動更新（30秒間隔）
  React.useEffect(() => {
    if (!open || viewState !== 'channelList') return;

    const interval = setInterval(() => {
      if (!isRefreshing && !state.isLoading) {
        console.log('🔄 自動チャンネルリスト更新実行');
        refreshChannels().catch(error => {
          console.warn('⚠️ 自動更新エラー:', error);
        });
      }
    }, 30000); // 30秒間隔

    return () => clearInterval(interval);
  }, [open, viewState, isRefreshing, state.isLoading, refreshChannels]);

  const handleChannelClick = (channel: Channel) => {
    setSelectedChannel(channel);
    setViewState('chat');
  };

  const handleBackToChannelList = () => {
    setViewState('channelList');
    setSelectedChannel(null);
  };

  const handleRefreshChannels = async () => {
    setIsRefreshing(true);
    try {
      await refreshChannels();
      console.log('🔄 チャンネルリスト更新完了');
    } catch (error) {
      console.error('❌ チャンネルリスト更新エラー:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 350,
          height: 500,
          maxWidth: '90vw',
          maxHeight: '80vh',
          position: 'fixed',
          bottom: 100,
          right: 20,
          top: 'auto',
          left: 'auto',
          m: 0,
          borderRadius: 2,
        }
      }}
      BackdropProps={{
        sx: { backgroundColor: 'transparent' }
      }}
    >
      <DialogTitle 
        component="div"
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          pb: 1,
        }}
      >
        {viewState === 'channelList' ? (
          <>
            <Typography variant="h6" component="h2">チャット</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton 
                onClick={handleRefreshChannels} 
                size="small"
                disabled={isRefreshing || state.isLoading}
                title="チャンネルリストを更新"
              >
                <RefreshIcon sx={{ 
                  animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' }
                  }
                }} />
              </IconButton>
              <IconButton onClick={onClose} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </>
        ) : (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton onClick={handleBackToChannelList} size="small" sx={{ mr: 1 }}>
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="h6" component="h2">{selectedChannel?.name}</Typography>
            </Box>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </>
        )}
      </DialogTitle>
      
      <Divider />
      
      <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
        <Fade in={viewState === 'channelList'} timeout={300}>
          <Box sx={{ display: viewState === 'channelList' ? 'block' : 'none', height: '100%' }}>
            <ChannelList 
              onChannelSelect={handleChannelClick}
            />
          </Box>
        </Fade>
        <Fade in={viewState === 'chat'} timeout={300}>
          <Box sx={{ display: viewState === 'chat' ? 'block' : 'none', height: '100%' }}>
            {selectedChannel && (
              <ChatMiniView channel={selectedChannel} />
            )}
          </Box>
        </Fade>
      </DialogContent>
    </Dialog>
  );
};

export default ChannelListPopup;