import React, { useState, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Paper,
  Tooltip,
  Typography,
  CircularProgress,
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachIcon,
  EmojiEmotions as EmojiIcon,
} from '@mui/icons-material';
import { useApp } from '../contexts/AppContext';

interface MessageInputProps {
  replyToPost?: string; // スレッド返信の場合のルート投稿ID
  placeholder?: string;
  onCancel?: () => void; // スレッド返信をキャンセルする場合
}

const MessageInput: React.FC<MessageInputProps> = ({
  replyToPost,
  placeholder,
  onCancel,
}) => {
  const { state, sendMessage } = useApp();
  const { currentChannel, isLoading } = state;
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // デフォルトのプレースホルダー
  const getPlaceholder = () => {
    if (placeholder) return placeholder;
    if (replyToPost) return 'スレッドに返信...';
    if (currentChannel) {
      return `#${currentChannel.display_name || currentChannel.name} にメッセージを送信`;
    }
    return 'メッセージを入力...';
  };

  // メッセージ送信処理
  const handleSendMessage = async () => {
    console.log('🚀 メッセージ送信処理開始:', { message: message.trim(), currentChannel: currentChannel?.id, isSending });
    
    if (!message.trim() || !currentChannel || isSending) {
      console.log('❌ 送信条件不満足:', { 
        hasMessage: !!message.trim(), 
        hasChannel: !!currentChannel, 
        notSending: !isSending 
      });
      return;
    }

    setIsSending(true);
    try {
      console.log('📤 sendMessage呼び出し:', message.trim());
      await sendMessage(message.trim(), replyToPost);
      console.log('✅ メッセージ送信成功');
      setMessage('');
      
      // スレッド返信の場合、入力欄をクリア後にキャンセル処理を呼び出す
      if (replyToPost && onCancel) {
        onCancel();
      }
    } catch (error) {
      console.error('❌ メッセージ送信エラー:', error);
      // TODO: エラー通知の表示
    } finally {
      setIsSending(false);
    }
  };

  // Enterキーでの送信（Shift+Enterで改行）
  const handleKeyPress = (event: KeyboardEvent<HTMLDivElement>) => {
    console.log('⌨️ キー押下:', { key: event.key, shift: event.shiftKey });
    if (event.key === 'Enter' && !event.shiftKey) {
      console.log('🚀 Enterキーでメッセージ送信トリガー');
      event.preventDefault();
      handleSendMessage();
    }
  };

  // ファイル添付処理
  const handleFileAttach = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      // TODO: ファイルアップロード機能の実装
      console.log('ファイル選択:', files[0]);
    }
  };

  // 絵文字ピッカー（将来の機能）
  const handleEmojiClick = () => {
    // TODO: 絵文字ピッカーの実装
    console.log('絵文字ピッカーを開く');
  };

  if (!currentChannel) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          チャンネルを選択してメッセージを送信してください
        </Typography>
      </Box>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1,
        borderTop: replyToPost ? 1 : 0,
        borderColor: 'divider',
        backgroundColor: replyToPost ? 'action.hover' : 'background.paper',
      }}
    >
      {/* スレッド返信の場合のヘッダー */}
      {replyToPost && (
        <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="caption" color="text.secondary">
            スレッドに返信中...
          </Typography>
          {onCancel && (
            <IconButton size="small" onClick={onCancel}>
              ✕
            </IconButton>
          )}
        </Box>
      )}

      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
        {/* ファイル添付ボタン */}
        <Tooltip title="ファイルを添付">
          <IconButton
            size="small"
            onClick={handleFileAttach}
            disabled={isSending}
            sx={{ mb: 1 }}
          >
            <AttachIcon />
          </IconButton>
        </Tooltip>

        {/* メッセージ入力欄 */}
        <TextField
          fullWidth
          multiline
          maxRows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={getPlaceholder()}
          disabled={isSending || isLoading}
          variant="outlined"
          size="small"
          data-testid="message-input"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            },
          }}
        />

        {/* 絵文字ボタン */}
        <Tooltip title="絵文字">
          <IconButton
            size="small"
            onClick={handleEmojiClick}
            disabled={isSending}
            sx={{ mb: 1 }}
          >
            <EmojiIcon />
          </IconButton>
        </Tooltip>

        {/* 送信ボタン */}
        <Tooltip title="送信 (Enter)">
          <IconButton
            color="primary"
            onClick={() => {
              console.log('🖱️ 送信ボタンクリック');
              handleSendMessage();
            }}
            disabled={!message.trim() || isSending}
            data-testid="send-button"
            sx={{ mb: 1 }}
          >
            {isSending ? (
              <CircularProgress size={20} />
            ) : (
              <SendIcon />
            )}
          </IconButton>
        </Tooltip>
      </Box>

      {/* ファイル入力（非表示） */}
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={handleFileChange}
        multiple
        accept="image/*,text/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
      />

      {/* 入力ヒント */}
      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
        Enterで送信、Shift+Enterで改行
      </Typography>
    </Paper>
  );
};

export default MessageInput;