import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Container,
  AppBar,
  Toolbar,
  IconButton,
  Grid,
} from '@mui/material';
import {
  Logout as LogoutIcon,
  Schedule as ScheduleIcon,
  LocalShipping as ShippingIcon,
} from '@mui/icons-material';
import { useApp } from '../contexts/AppContext';

interface Vessel {
  id: string;
  name: string;
  callSign: string;
  cargo: string;
  cargoAmount: string;
  origin: string;
  destination: string;
  status: string;
  eta: string;
  progress: number;
  icon: string;
  lastUpdate: string;
}

interface VesselSelectionScreenProps {
  vessels: Vessel[];
  onVesselSelect: (vesselId: string) => void;
}

const VesselSelectionScreen: React.FC<VesselSelectionScreenProps> = ({ 
  vessels, 
  onVesselSelect 
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

  // ステータスに応じた色を返す
  const getStatusColor = (status: string): 'primary' | 'warning' | 'success' | 'error' | 'info' => {
    switch (status) {
      case '航行中': return 'primary';
      case '入港準備中': return 'warning';
      case '荷揚げ中': return 'success';
      case '検査中': return 'info';
      case '出港準備中': return 'warning';
      default: return 'primary';
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
          <ShippingIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            本船選択 - 穀物輸入管理システム
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

      {/* 本船リスト */}
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
          管理中の本船を選択してください
        </Typography>

        <Grid container spacing={3}>
          {vessels.map((vessel) => (
            <Grid item xs={12} md={6} key={vessel.id}>
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                  },
                  height: '100%',
                }}
                onClick={() => onVesselSelect(vessel.id)}
              >
                <CardContent sx={{ p: 3 }}>
                  {/* ヘッダー部分 */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h2" sx={{ mr: 2 }}>
                      {vessel.icon}
                    </Typography>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h5" component="div">
                        {vessel.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        コールサイン: {vessel.callSign}
                      </Typography>
                    </Box>
                    <Chip 
                      label={vessel.status} 
                      color={getStatusColor(vessel.status)}
                      size="small"
                    />
                  </Box>

                  {/* 積載情報 */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body1" gutterBottom>
                      <strong>積載物:</strong> {vessel.cargo} - {vessel.cargoAmount}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {vessel.origin} → {vessel.destination}
                    </Typography>
                  </Box>

                  {/* 進捗バー */}
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        輸送進捗
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {vessel.progress}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={vessel.progress} 
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>

                  {/* ETA情報 */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <ScheduleIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        到着予定: {vessel.eta}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      更新: {vessel.lastUpdate}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {vessels.length === 0 && (
          <Box sx={{ 
            textAlign: 'center', 
            mt: 8,
            p: 4,
            backgroundColor: 'background.paper',
            borderRadius: 2,
          }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              管理中の本船がありません
            </Typography>
            <Typography variant="body2" color="text.secondary">
              新しい本船情報が登録されるまでお待ちください
            </Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default VesselSelectionScreen;