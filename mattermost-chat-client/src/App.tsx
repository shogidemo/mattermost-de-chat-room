import React from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Grid,
  CssBaseline,
  ThemeProvider,
  createTheme,
  Paper,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Logout as LogoutIcon,
  Wifi as ConnectedIcon,
  WifiOff as DisconnectedIcon,
} from '@mui/icons-material';
import { AppProvider, useApp } from './contexts/AppContext';
import LoginForm from './components/LoginForm';
import ChannelList from './components/ChannelList';
import ChatView from './components/ChatView';

// Material-UIテーマ設定
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

// メインチャット画面コンポーネント
const ChatApp: React.FC = () => {
  const { state, logout } = useApp();
  const { user, currentTeam, isConnected } = state;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ヘッダー */}
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Mattermost チャット
          </Typography>
          
          {/* 接続状態表示 */}
          <Chip
            icon={isConnected ? <ConnectedIcon /> : <DisconnectedIcon />}
            label={isConnected ? '接続中' : '切断'}
            color={isConnected ? 'success' : 'error'}
            variant="outlined"
            size="small"
            sx={{ mr: 2, color: 'white', borderColor: 'white' }}
          />
          
          {/* ユーザー情報とログアウト */}
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

      {/* メインコンテンツ */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <Grid container sx={{ height: '100%' }}>
          {/* チャンネル一覧（左サイドバー） */}
          <Grid item xs={12} md={3} lg={2}>
            <Paper
              square
              elevation={2}
              sx={{
                height: '100%',
                borderRight: 1,
                borderColor: 'divider',
                display: { xs: 'none', md: 'block' },
              }}
            >
              <ChannelList />
            </Paper>
          </Grid>

          {/* チャット画面（メインエリア） */}
          <Grid item xs={12} md={9} lg={10}>
            <ChatView />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

// ルートアプリケーションコンポーネント
const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ThemeProvider>
  );
};

// アプリケーションコンテンツ（認証状態により切り替え）
const AppContent: React.FC = () => {
  const { state } = useApp();
  const { user } = state;

  if (!user) {
    return <LoginForm />;
  }

  return <ChatApp />;
};

export default App;
