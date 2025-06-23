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

// モックメッセージ型
interface MockMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: number;
}

interface ChatMiniViewDebugProps {
  channelName: string;
}

const ChatMiniViewDebug: React.FC<ChatMiniViewDebugProps> = ({ channelName }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<MockMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 初期メッセージを設定
  useEffect(() => {
    const initialMessages: MockMessage[] = [
      {
        id: '1',
        userId: 'admin',
        userName: '管理者',
        message: `${channelName}へようこそ！このチャンネルで情報を共有しましょう。`,
        timestamp: Date.now() - 3600000,
      },
      {
        id: '2',
        userId: 'tanaka',
        userName: '田中太郎',
        message: 'よろしくお願いします！',
        timestamp: Date.now() - 1800000,
      },
    ];

    // 佐藤チャンネルの場合は特別なメッセージを追加
    if (channelName.includes('佐藤')) {
      initialMessages.push({
        id: '3',
        userId: 'sato',
        userName: '佐藤花子',
        message: '佐藤です。プロジェクトの進捗を共有します。現在、開発フェーズ3が完了し、テスト段階に入りました。',
        timestamp: Date.now() - 600000,
      });
    }

    setMessages(initialMessages);
  }, [channelName]);

  // メッセージ送信
  const handleSendMessage = () => {
    if (!message.trim()) return;

    const newMessage: MockMessage = {
      id: Date.now().toString(),
      userId: 'current-user',
      userName: 'あなた',
      message: message,
      timestamp: Date.now(),
    };

    setMessages([...messages, newMessage]);
    setMessage('');
  };

  // Enter キーで送信
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 時刻フォーマット
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // 新しいメッセージが追加されたら下にスクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <Box sx={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
      {/* ヘッダー */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6">{channelName}</Typography>
        <Typography variant="caption" color="text.secondary">
          {messages.length} メッセージ
        </Typography>
      </Box>

      {/* メッセージリスト */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {messages.map((msg) => (
          <Box key={msg.id} sx={{ display: 'flex', mb: 2 }}>
            <Avatar sx={{ width: 32, height: 32, mr: 1, fontSize: '0.875rem' }}>
              {msg.userName.charAt(0)}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                <Typography variant="body2" fontWeight="bold">
                  {msg.userName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatTime(msg.timestamp)}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                {msg.message}
              </Typography>
            </Box>
          </Box>
        ))}
        <div ref={messagesEndRef} />
      </Box>

      {/* 入力フィールド */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
        <TextField
          fullWidth
          size="small"
          placeholder="メッセージを入力..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          sx={{ mr: 1 }}
        />
        <IconButton 
          color="primary" 
          onClick={handleSendMessage}
          disabled={!message.trim()}
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  );
};

export default ChatMiniViewDebug;