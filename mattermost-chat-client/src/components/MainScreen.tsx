import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  IconButton,
} from '@mui/material';
import {
  Logout as LogoutIcon,
  Assessment as AssessmentIcon,
  Inventory as InventoryIcon,
  LocalShipping as ShippingIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';
import { useApp } from '../contexts/AppContext';

interface MainScreenProps {
  onChatClick?: () => void;
}

const MainScreen: React.FC<MainScreenProps> = () => {
  const { state, logout } = useApp();
  const { user } = state;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  };

  const menuItems = [
    { title: '在庫管理', icon: <InventoryIcon />, color: '#1976d2' },
    { title: '輸入実績', icon: <ShippingIcon />, color: '#388e3c' },
    { title: 'レポート', icon: <AssessmentIcon />, color: '#f57c00' },
    { title: '分析', icon: <AnalyticsIcon />, color: '#7b1fa2' },
  ];

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ヘッダー */}
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            穀物輸入管理システム
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

      {/* メインコンテンツ */}
      <Box sx={{ flex: 1, p: 3, backgroundColor: '#f5f5f5' }}>
        <Typography variant="h4" gutterBottom>
          ダッシュボード
        </Typography>
        
        <Grid container spacing={3}>
          {menuItems.map((item, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
              <Card 
                sx={{ 
                  height: 140,
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 3,
                  },
                  transition: 'all 0.2s',
                }}
              >
                <CardContent sx={{ textAlign: 'center', width: '100%' }}>
                  <Box sx={{ color: item.color, mb: 1 }}>
                    {React.cloneElement(item.icon, { sx: { fontSize: 40 } })}
                  </Box>
                  <Typography variant="h6">
                    {item.title}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* ダミーコンテンツ */}
        <Paper sx={{ mt: 3, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            最近の活動
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • 小麦 500トン - 輸入完了 (2024-06-15)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • 大豆 300トン - 輸入予定 (2024-06-20)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • とうもろこし 800トン - 検査中 (2024-06-18)
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
};

export default MainScreen;