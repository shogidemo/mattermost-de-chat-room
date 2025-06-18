import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Avatar,
  Typography,
  Paper,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Send as SendIcon,
} from '@mui/icons-material';
import { useApp } from '../contexts/AppContext';
import type { Post } from '../types/mattermost';

interface Channel {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  icon: string;
  isOnline?: boolean;
}

interface ChatMiniViewProps {
  channel: Channel;
}

// シンプルなメッセージアイテム（ポップアップ用）
interface MiniMessageItemProps {
  post: Post;
}

const MiniMessageItem: React.FC<MiniMessageItemProps> = ({ post }) => {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Box sx={{ display: 'flex', mb: 1, px: 1 }}>
      <Avatar 
        sx={{ width: 32, height: 32, mr: 1, fontSize: '0.875rem' }}
      >
        {post.user_id ? post.user_id.charAt(0).toUpperCase() : 'U'}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
          <Typography variant="body2" fontWeight="bold">
            {post.user_id || 'ユーザー'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatTime(post.create_at)}
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
          {post.message}
        </Typography>
      </Box>
    </Box>
  );
};

const ChatMiniView: React.FC<ChatMiniViewProps> = ({ channel }) => {
  const { state, dispatch, sendMessage: appSendMessage, selectChannel, loadChannelPosts } = useApp();
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [localMessages, setLocalMessages] = useState<Post[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // チャンネル種別の判定（実際のMattermostチャンネルかモックチャンネルか）
  const isRealMattermostChannel = (channelId: string): boolean => {
    // AppContextのチャンネルリストに存在するかチェック
    const realChannels = state.channels || [];
    const isInRealChannels = realChannels.some(ch => ch.id === channelId);
    
    // Mattermostチャンネル判定ロジック:
    // 1. AppContextのchannelsに存在する（最優先）
    // 2. IDが20文字以上の英数字（Mattermostの一般的な形式）
    // 3. 明らかにモックチャンネルではない
    const isMattermostFormat = channelId.length >= 20 && /^[a-z0-9]+$/.test(channelId);
    const isNotMockChannel = !channelId.startsWith('mock-') && 
                            !channelId.startsWith('fallback-') && 
                            channelId !== 'no-channels' &&
                            !channelId.match(/^[0-9]+$/); // 数字のみのIDはモック
    
    const result = isInRealChannels || (isMattermostFormat && isNotMockChannel);
    
    debugLog('チャンネル種別判定', {
      channelId: channelId.substring(0, 15) + '...',
      isInRealChannels,
      isMattermostFormat,
      isNotMockChannel,
      realChannelsCount: realChannels.length,
      result: result ? 'Mattermost' : 'Mock'
    });
    
    return result;
  };

  // デバッグログ用
  const debugLog = (message: string, data?: any) => {
    if (import.meta.env.DEV) {
      console.log(`[Mattermost統合] ${message}`, data || '');
    }
  };

  // メッセージデータソースの統合管理
  const channelPosts = isRealMattermostChannel(channel.id) 
    ? state.posts[channel.id] || []  // 実チャンネル: AppContextの状態から取得
    : localMessages;                  // モックチャンネル: ローカル状態から取得
  
  debugLog('チャンネル情報', {
    channelId: channel.id,
    channelName: channel.name,
    isReal: isRealMattermostChannel(channel.id),
    messageCount: channelPosts.length
  });

  // チャンネル初期化とデータ取得
  useEffect(() => {
    const initializeChannel = async () => {
      if (isRealMattermostChannel(channel.id)) {
        // 実際のMattermostチャンネルの場合
        debugLog('実チャンネル初期化開始', { channelId: channel.id });
        
        try {
          // AppContextの現在のチャンネルと異なる場合は選択
          if (!state.currentChannel || state.currentChannel.id !== channel.id) {
            debugLog('チャンネル選択実行');
            // モックチャンネルをMattermost Channel型に変換
            const mattermostChannel = {
              id: channel.id,
              name: channel.name,
              display_name: channel.name,
              type: 'O' as const,
              team_id: state.currentTeam?.id || 'bdpi3ajk6ib39ga6hi8mn9ppow',
              header: '',
              purpose: '',
              create_at: Date.now(),
              update_at: Date.now(),
              delete_at: 0,
              creator_id: state.user?.id || 'mock-user',
              last_post_at: Date.now(),
              total_msg_count: 0,
              extra_update_at: 0,
              scheme_id: null,
            };
            
            await selectChannel(mattermostChannel);
          }
          
          // メッセージが未取得の場合は読み込み
          if ((state.posts[channel.id] || []).length === 0) {
            debugLog('メッセージ読み込み実行');
            await loadChannelPosts(channel.id);
          }
          
          debugLog('実チャンネル初期化完了', { 
            messageCount: (state.posts[channel.id] || []).length 
          });
          
        } catch (error) {
          debugLog('実チャンネル初期化エラー', error);
          console.error('❌ 実チャンネル初期化エラー:', error);
        }
        
      } else {
        // 非Mattermostチャンネル（レガシー対応のみ）
        debugLog('非Mattermostチャンネル検出 - 完全同期モードでは表示されません');
        
        // 既存のローカルメッセージのみ表示（新規メッセージ生成は行わない）
        const existingAppMessages = state.posts[channel.id] || [];
        
        if (existingAppMessages.length > 0) {
          setLocalMessages(existingAppMessages);
          debugLog('既存メッセージ復元', { count: existingAppMessages.length });
        } else {
          debugLog('メッセージなし - Mattermostチャンネルの使用を推奨');
        }
      }
    };

    initializeChannel();
  }, [channel.id, channel.name, channel.lastMessage, state.currentChannel, state.posts, state.currentTeam, state.user, selectChannel, loadChannelPosts, localMessages.length]);

  // 新しいメッセージが追加されたら下にスクロール
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [channelPosts]);

  // WebSocketリアルタイム更新の統合
  useEffect(() => {
    if (!isRealMattermostChannel(channel.id)) {
      return; // モックチャンネルはWebSocket不要
    }

    debugLog('WebSocketイベント統合開始', { channelId: channel.id });

    // WebSocketが接続されているかチェック
    if (!state.isConnected) {
      debugLog('WebSocket未接続のため、リアルタイム更新無効');
      return;
    }

    // 現在のチャンネルのWebSocketイベントは既にAppContextで処理されている
    // ここではUI側の追加処理が必要な場合のみ実装
    
    debugLog('WebSocketリアルタイム更新有効', {
      channelId: channel.id,
      isConnected: state.isConnected
    });

    // クリーンアップは不要（AppContextが管理）
  }, [channel.id, state.isConnected]);

  // メッセージ送信処理（実チャンネル・モックチャンネル統合対応）
  const handleSendMessage = async () => {
    if (!message.trim() || isSending) {
      return;
    }

    setIsSending(true);
    const messageText = message.trim();
    
    try {
      if (isRealMattermostChannel(channel.id)) {
        // 実際のMattermostチャンネルの場合
        debugLog('実チャンネルメッセージ送信開始', { 
          text: messageText,
          channelId: channel.id 
        });
        
        try {
          // AppContextのsendMessage関数を使用
          await appSendMessage(messageText);
          debugLog('実チャンネルメッセージ送信成功');
          
        } catch (apiError) {
          debugLog('API送信失敗、フォールバック処理', apiError);
          console.error('❌ Mattermost API送信エラー:', apiError);
          
          // フォールバック: ローカル状態に追加
          const fallbackMessage: Post = {
            id: `fallback-${Date.now()}`,
            create_at: Date.now(),
            update_at: Date.now(),
            edit_at: 0,
            delete_at: 0,
            is_pinned: false,
            user_id: state.user?.username || 'あなた',
            channel_id: channel.id,
            root_id: '',
            parent_id: '',
            original_id: '',
            message: messageText,
            type: '',
            props: {},
            hashtags: '',
            pending_post_id: '',
            reply_count: 0,
            metadata: {},
          };
          
          dispatch({
            type: 'ADD_POST',
            payload: { channelId: channel.id, post: fallbackMessage }
          });
        }
        
      } else {
        // 非Mattermostチャンネルへの送信を制限
        debugLog('非Mattermostチャンネルへの送信が試行されました - 完全同期モードでは許可されません', { 
          text: messageText,
          channelId: channel.id 
        });
        
        console.warn('⚠️ このチャンネルはMattermostと同期されていません');
        console.log('💡 実際のMattermostチャンネルを使用してください');
        
        // メッセージ送信をブロック
        throw new Error('Mattermostチャンネルのみでメッセージ送信が可能です');
      }
      
      setMessage('');
      
    } catch (error) {
      debugLog('メッセージ送信エラー', error);
      console.error('❌ メッセージ送信エラー:', error);
    } finally {
      setIsSending(false);
    }
  };

  // Enterキーでメッセージ送信
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Box 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        maxHeight: '400px', // ポップアップサイズに対応
      }}
    >
      <Box 
        sx={{ 
          flex: 1, 
          overflow: 'auto', 
          py: 1,
          minHeight: 0,
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
            borderRadius: '3px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#c1c1c1',
            borderRadius: '3px',
            '&:hover': {
              background: '#a8a8a8',
            },
          },
        }}
      >
        {channelPosts.length > 0 ? (
          <>
            {channelPosts.map((post) => (
              <MiniMessageItem key={post.id} post={post} />
            ))}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {channel.icon} {channel.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {isRealMattermostChannel(channel.id) 
                ? 'Mattermostチャンネル - 会話を開始しましょう'
                : '⚠️ 非同期チャンネル（Mattermostを使用してください）'}
            </Typography>
            {isRealMattermostChannel(channel.id) && (
              <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                接続状態: {state.isConnected ? '🟢 オンライン' : '🔴 オフライン'}
              </Typography>
            )}
          </Box>
        )}
      </Box>

      <Divider />
      <Box sx={{ p: 1 }}>
        <Paper
          elevation={0}
          sx={{
            display: 'flex',
            alignItems: 'flex-end',
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
          }}
        >
          <TextField
            fullWidth
            multiline
            maxRows={3}
            placeholder={
              isRealMattermostChannel(channel.id)
                ? state.isConnected 
                  ? `${channel.name} にメッセージを送信 (リアルタイム有効)`
                  : `${channel.name} にメッセージを送信 (オフライン)`
                : `非同期チャンネル - Mattermostチャンネルを使用してください`
            }
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            variant="standard"
            inputProps={{
              'data-testid': 'message-input'
            }}
            InputProps={{
              disableUnderline: true,
              sx: { px: 1, py: 0.5 }
            }}
            disabled={isSending || !isRealMattermostChannel(channel.id)}
          />
          <IconButton
            color="primary"
            onClick={handleSendMessage}
            disabled={!message.trim() || isSending || !isRealMattermostChannel(channel.id)}
            sx={{ m: 0.5 }}
            aria-label="send"
            data-testid="send-button"
          >
            {isSending ? <CircularProgress size={20} /> : <SendIcon />}
          </IconButton>
        </Paper>
      </Box>
    </Box>
  );
};

export default ChatMiniView;
