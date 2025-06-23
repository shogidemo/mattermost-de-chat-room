import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Badge,
  Avatar,
  Chip,
  Container,
  AppBar,
  Toolbar,
  IconButton,
} from '@mui/material';
import {
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useApp } from '../contexts/AppContext';

interface Channel {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  icon: string;
  isOnline: boolean;
}

interface ChannelSelectionScreenProps {
  channels: Channel[];
  onChannelSelect: (channelId: string) => void;
}

const ChannelSelectionScreen: React.FC<ChannelSelectionScreenProps> = ({ 
  channels, 
  onChannelSelect 
}) => {
  const { state, logout } = useApp();
  const { user } = state;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      backgroundColor: '#f5f5f5',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* ヘッダー */}
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            チャンネル選択
          </Typography>
          
          {user && (
            <>
              <Typography variant="body2" sx={{ mr: 2 }}>
                {user.username}
              </Typography>
              <IconButton color="inherit" onClick={handleLogout}>
                <LogoutIcon />
              </IconButton>
            </>
          )}
        </Toolbar>
      </AppBar>

      {/* チャンネルリスト */}
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
          チャンネルを選択してください
        </Typography>

        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 2 
        }}>
          {channels.map((channel) => (
            <Card
              key={channel.id}
              sx={{
                cursor: 'pointer',
                transition: 'all 0.3s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 4,
                },
                position: 'relative',
                overflow: 'visible',
              }}
              onClick={() => onChannelSelect(channel.id)}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {/* チャンネルアイコン */}
                  <Badge
                    badgeContent={channel.unreadCount}
                    color="error"
                    invisible={channel.unreadCount === 0}
                    sx={{
                      '& .MuiBadge-badge': {
                        right: -3,
                        top: 3,
                      }
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: channel.isOnline ? 'primary.main' : 'grey.500',
                        width: 56,
                        height: 56,
                        fontSize: '1.5rem',
                      }}
                    >
                      {channel.icon}
                    </Avatar>
                  </Badge>

                  {/* チャンネル情報 */}
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="h6" component="div">
                        {channel.name}
                      </Typography>
                      {channel.isOnline && (
                        <Chip
                          label="オンライン"
                          size="small"
                          color="success"
                          sx={{ height: 20 }}
                        />
                      )}
                    </Box>
                    
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ 
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        mb: 0.5
                      }}
                    >
                      {channel.lastMessage}
                    </Typography>
                    
                    <Typography variant="caption" color="text.secondary">
                      最終更新: {channel.timestamp}
                    </Typography>
                  </Box>

                  {/* 矢印アイコン */}
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      backgroundColor: 'action.hover',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      ml: 2,
                    }}
                  >
                    <Typography sx={{ color: 'text.secondary' }}>
                      →
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>

        {channels.length === 0 && (
          <Box sx={{ 
            textAlign: 'center', 
            mt: 8,
            p: 4,
            backgroundColor: 'background.paper',
            borderRadius: 2,
          }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              利用可能なチャンネルがありません
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Mattermostでチャンネルを作成してください
            </Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default ChannelSelectionScreen;