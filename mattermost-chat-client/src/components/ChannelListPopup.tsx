import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  IconButton,
  Box,
  Divider,
  Fade,
  Tooltip,
} from '@mui/material';
import {
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
  OpenWith as DragIcon,
} from '@mui/icons-material';
import ChatMiniView from './ChatMiniView';
import ChannelList from './ChannelList';
import { useApp } from '../contexts/AppContext';
import { useDraggable } from '../utils/useDraggable';
import type { ChannelWithPreview } from '../types/mattermost';

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
}) => {
  const { refreshChannels, state } = useApp();
  const [viewState, setViewState] = React.useState<ViewState>('channelList');
  const [selectedChannel, setSelectedChannel] = React.useState<Channel | null>(null);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // ドラッグ機能を初期化
  const { dragHandleProps, dialogProps, resetPosition } = useDraggable({
    storageKey: 'chat-panel-position',
    defaultPosition: { x: window.innerWidth - 370, y: window.innerHeight - 580 }
  });

  // イベント伝播を停止するヘルパー関数
  const stopEventPropagation = React.useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
  }, []);

  // ポップアップが開かれるたびに、保存された位置がない場合はデフォルト位置に設定
  const [hasInitialized, setHasInitialized] = React.useState(false);
  
  React.useEffect(() => {
    if (open && !hasInitialized) {
      // localStorageに位置が保存されているかチェック
      const storedPosition = localStorage.getItem('chat-panel-position');
      if (!storedPosition) {
        // 保存された位置がない場合、初回表示位置にリセット
        resetPosition();
      }
      setHasInitialized(true);
    } else if (!open) {
      setHasInitialized(false);
    }
  }, [open, hasInitialized, resetPosition]);

  // ChannelWithPreviewをChannelに変換するヘルパー関数
  const convertChannelWithPreviewToChannel = (channelWithPreview: ChannelWithPreview): Channel => {
    // チャンネルタイプに応じてアイコンを決定
    const getChannelIcon = (type: string) => {
      switch (type) {
        case 'O': return '🏢'; // オープンチャンネル
        case 'P': return '🔒'; // プライベートチャンネル
        case 'D': return '👤'; // ダイレクトメッセージ
        case 'G': return '👥'; // グループメッセージ
        default: return '💬';
      }
    };

    return {
      id: channelWithPreview.id,
      name: channelWithPreview.display_name || channelWithPreview.name,
      lastMessage: channelWithPreview.lastMessage?.content || '新しいチャンネル',
      timestamp: channelWithPreview.lastMessage 
        ? new Date(channelWithPreview.lastMessage.timestamp).toLocaleString('ja-JP', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        : '新規',
      unreadCount: channelWithPreview.unreadCount || 0,
      icon: getChannelIcon(channelWithPreview.type),
      isOnline: true,
    };
  };

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

  const handleChannelListSelect = (channelWithPreview: ChannelWithPreview) => {
    const convertedChannel = convertChannelWithPreviewToChannel(channelWithPreview);
    setSelectedChannel(convertedChannel);
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
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          ...dialogProps.style,
        }
      }}
      BackdropProps={{
        sx: { backgroundColor: 'transparent' }
      }}
    >
      <DialogTitle 
        component="div"
        {...dragHandleProps}
        sx={{ 
          ...dragHandleProps.style,
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          pb: 1,
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 8,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 32,
            height: 4,
            backgroundColor: 'divider',
            borderRadius: 2,
            opacity: 0.6,
          }
        }}
      >
        {viewState === 'channelList' ? (
          <>
            <Typography 
              variant="h6" 
              component="h2"
              onDoubleClick={resetPosition}
              sx={{ cursor: 'pointer' }}
              title="ダブルクリックで位置をリセット"
            >
              チャット
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="チャンネルリストを更新">
                <IconButton 
                  onClick={handleRefreshChannels} 
                  size="small"
                  disabled={isRefreshing || state.isLoading}
                  onMouseDown={stopEventPropagation}
                  onTouchStart={stopEventPropagation}
                >
                  <RefreshIcon sx={{ 
                    animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' }
                    }
                  }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="閉じる">
                <IconButton 
                  onClick={onClose} 
                  size="small"
                  onMouseDown={stopEventPropagation}
                  onTouchStart={stopEventPropagation}
                >
                  <CloseIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </>
        ) : (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <Tooltip title="チャンネル一覧に戻る">
                <IconButton 
                  onClick={handleBackToChannelList} 
                  size="small" 
                  sx={{ mr: 1 }}
                  onMouseDown={stopEventPropagation}
                  onTouchStart={stopEventPropagation}
                >
                  <ArrowBackIcon />
                </IconButton>
              </Tooltip>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
                <Typography 
                  variant="body1" 
                  sx={{ fontSize: '1.2em' }}
                >
                  {selectedChannel?.icon}
                </Typography>
                <Typography 
                  variant="h6" 
                  component="h2" 
                  onDoubleClick={resetPosition}
                  sx={{ 
                    fontWeight: 'bold',
                    color: 'primary.main',
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer'
                  }}
                  title="ダブルクリックで位置をリセット"
                >
                  {selectedChannel?.name || 'チャンネル'}
                </Typography>
              </Box>
            </Box>
            <Tooltip title="閉じる">
              <IconButton 
                onClick={onClose} 
                size="small"
                onMouseDown={stopEventPropagation}
                onTouchStart={stopEventPropagation}
              >
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </>
        )}
      </DialogTitle>
      
      <Divider />
      
      <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
        <Fade in={viewState === 'channelList'} timeout={300}>
          <Box sx={{ display: viewState === 'channelList' ? 'block' : 'none', height: '100%' }}>
            <ChannelList 
              onChannelSelect={handleChannelListSelect}
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