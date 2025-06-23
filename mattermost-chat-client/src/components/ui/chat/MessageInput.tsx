import React, { useState, useRef, useEffect, useCallback } from 'react';
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
import { useApp } from '../../../contexts/AppContext';
import MentionSuggestions from '../common/MentionSuggestions';
import MattermostClient from '../../../api/mattermost';
import type { User } from '../../../types/mattermost';

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
  const { currentChannel, currentTeam, isLoading } = state;
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textFieldRef = useRef<HTMLDivElement>(null);
  
  // メンション機能の状態
  const [mentionAnchorEl, setMentionAnchorEl] = useState<HTMLElement | null>(null);
  const [mentionSearchTerm, setMentionSearchTerm] = useState('');
  const [mentionUsers, setMentionUsers] = useState<User[]>([]);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [mentionStartPosition, setMentionStartPosition] = useState(-1);
  
  // Mattermost APIクライアント
  const clientRef = useRef<MattermostClient | null>(null);
  
  useEffect(() => {
    // APIクライアントの初期化
    clientRef.current = new MattermostClient();
  }, []);

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

  // ユーザー検索処理
  const searchUsers = useCallback(async (searchTerm: string) => {
    if (!clientRef.current || !currentTeam) return;
    
    setIsSearchingUsers(true);
    try {
      const users = await clientRef.current.searchUsers(searchTerm, currentTeam.id);
      setMentionUsers(users);
      setSelectedMentionIndex(0);
    } catch (error) {
      console.error('ユーザー検索エラー:', error);
      setMentionUsers([]);
    } finally {
      setIsSearchingUsers(false);
    }
  }, [currentTeam]);

  // メンション検索のデバウンス処理
  useEffect(() => {
    if (mentionSearchTerm.length > 0) {
      const timer = setTimeout(() => {
        searchUsers(mentionSearchTerm);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setMentionUsers([]);
    }
  }, [mentionSearchTerm, searchUsers]);

  // テキスト変更時の処理
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const cursorPosition = e.target.selectionStart || 0;
    
    setMessage(newValue);
    
    // @入力の検出
    const lastAtIndex = newValue.lastIndexOf('@', cursorPosition - 1);
    
    if (lastAtIndex !== -1 && cursorPosition > lastAtIndex) {
      // @の後の文字列を取得
      const searchTerm = newValue.slice(lastAtIndex + 1, cursorPosition);
      
      // 空白文字がない場合のみメンション検索を実行
      if (!searchTerm.includes(' ')) {
        setMentionStartPosition(lastAtIndex);
        setMentionSearchTerm(searchTerm);
        setMentionAnchorEl(textFieldRef.current);
      } else {
        // 空白文字が含まれる場合はメンション候補を閉じる
        closeMentionSuggestions();
      }
    } else {
      // @が見つからない場合はメンション候補を閉じる
      closeMentionSuggestions();
    }
  };

  // メンション候補を閉じる
  const closeMentionSuggestions = () => {
    setMentionAnchorEl(null);
    setMentionSearchTerm('');
    setMentionUsers([]);
    setSelectedMentionIndex(0);
    setMentionStartPosition(-1);
  };

  // ユーザー選択処理
  const handleSelectUser = (user: User) => {
    if (mentionStartPosition === -1) return;
    
    // @と検索文字列を@usernameに置き換える
    const beforeMention = message.slice(0, mentionStartPosition);
    const afterMention = message.slice(mentionStartPosition + mentionSearchTerm.length + 1);
    const newMessage = `${beforeMention}@${user.username} ${afterMention}`;
    
    setMessage(newMessage);
    closeMentionSuggestions();
    
    // フォーカスを戻す
    const input = textFieldRef.current?.querySelector('textarea');
    if (input) {
      input.focus();
    }
  };

  // キーボードイベントの処理を更新
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // メンション候補が表示されている場合の処理
    if (mentionAnchorEl && mentionUsers.length > 0) {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedMentionIndex((prev) => 
            prev < mentionUsers.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedMentionIndex((prev) => 
            prev > 0 ? prev - 1 : mentionUsers.length - 1
          );
          break;
        case 'Enter':
          event.preventDefault();
          handleSelectUser(mentionUsers[selectedMentionIndex]);
          break;
        case 'Escape':
          event.preventDefault();
          closeMentionSuggestions();
          break;
        default:
          // その他のキーの場合は通常の処理
          break;
      }
    } else {
      // メンション候補が表示されていない場合の通常の処理
      if (event.key === 'Enter' && !event.shiftKey) {
        console.log('🚀 Enterキーでメッセージ送信トリガー');
        event.preventDefault();
        handleSendMessage();
      }
    }
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
          ref={textFieldRef}
          fullWidth
          multiline
          maxRows={4}
          value={message}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
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
        Enterで送信、Shift+Enterで改行、@でユーザーメンション
      </Typography>

      {/* メンション候補 */}
      <MentionSuggestions
        anchorEl={mentionAnchorEl}
        users={mentionUsers}
        selectedIndex={selectedMentionIndex}
        isLoading={isSearchingUsers}
        onSelectUser={handleSelectUser}
      />
    </Paper>
  );
};

export default MessageInput;