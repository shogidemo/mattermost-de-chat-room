import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Container,
  Paper,
} from '@mui/material';
import { Login as LoginIcon } from '@mui/icons-material';
import { useApp } from '../contexts/AppContext';

const LoginForm: React.FC = () => {
  const { login, state } = useApp();
  const { isLoading, error } = state;
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.username.trim() || !formData.password.trim()) {
      return;
    }

    try {
      await login(formData.username.trim(), formData.password);
    } catch (error) {
      // エラーはコンテキストで処理される
      console.error('ログインエラー:', error);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSubmit(event as any);
    }
  };

  const isFormValid = formData.username.trim() && formData.password.trim();

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Card elevation={4} sx={{ width: '100%', maxWidth: 400 }}>
          <CardContent sx={{ p: 4 }}>
            {/* ロゴ・タイトル */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Paper
                elevation={2}
                sx={{
                  width: 64,
                  height: 64,
                  mx: 'auto',
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 2,
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                }}
              >
                <LoginIcon fontSize="large" />
              </Paper>
              <Typography variant="h5" component="h1" fontWeight="bold" gutterBottom>
                Mattermost チャット
              </Typography>
              <Typography variant="body2" color="text.secondary">
                アカウントにログインしてチャットを開始
              </Typography>
            </Box>

            {/* エラー表示 */}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {/* ログインフォーム */}
            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                name="username"
                label="ユーザー名またはメールアドレス"
                variant="outlined"
                value={formData.username}
                onChange={handleInputChange('username')}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                required
                autoComplete="username"
                autoFocus
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                name="password"
                label="パスワード"
                type="password"
                variant="outlined"
                value={formData.password}
                onChange={handleInputChange('password')}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                required
                autoComplete="current-password"
                sx={{ mb: 3 }}
              />

              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={!isFormValid || isLoading}
                startIcon={isLoading ? <CircularProgress size={20} /> : <LoginIcon />}
                sx={{ mb: 2 }}
              >
                {isLoading ? 'ログイン中...' : 'ログイン'}
              </Button>
            </Box>

            {/* 追加情報 */}
            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Typography variant="caption" color="text.secondary">
                Mattermostサーバー: localhost:8065
              </Typography>
            </Box>

            {/* 開発用の説明 */}
            <Paper
              variant="outlined"
              sx={{ mt: 3, p: 2, backgroundColor: 'action.hover' }}
            >
              <Typography variant="caption" color="text.secondary" display="block">
                <strong>開発用情報:</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                • Mattermostサーバーが起動していることを確認してください
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                • 初回は管理者アカウントの作成が必要です
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                • docker-compose up -d でサーバーを起動
              </Typography>
            </Paper>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default LoginForm;