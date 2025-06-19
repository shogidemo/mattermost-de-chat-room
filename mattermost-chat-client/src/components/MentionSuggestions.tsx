import React from 'react';
import {
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Popper,
  CircularProgress,
  Box,
} from '@mui/material';
import type { User } from '../types/mattermost';

interface MentionSuggestionsProps {
  anchorEl: HTMLElement | null;
  users: User[];
  selectedIndex: number;
  isLoading: boolean;
  onSelectUser: (user: User) => void;
}

const MentionSuggestions: React.FC<MentionSuggestionsProps> = ({
  anchorEl,
  users,
  selectedIndex,
  isLoading,
  onSelectUser,
}) => {
  const open = Boolean(anchorEl) && (users.length > 0 || isLoading);

  // ユーザーの表示名を取得
  const getUserDisplayName = (user: User): string => {
    return user.nickname || user.username || 'Unknown User';
  };

  // ユーザーのイニシャルを取得
  const getUserInitials = (user: User): string => {
    const displayName = getUserDisplayName(user);
    return displayName
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Popper
      open={open}
      anchorEl={anchorEl}
      placement="top-start"
      style={{ zIndex: 1301 }}
    >
      <Paper
        elevation={8}
        sx={{
          maxHeight: 300,
          overflow: 'auto',
          minWidth: 250,
          maxWidth: 400,
        }}
      >
        {isLoading ? (
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <List dense sx={{ py: 0 }}>
            {users.map((user, index) => (
              <ListItem key={user.id} disablePadding>
                <ListItemButton
                  selected={index === selectedIndex}
                  onClick={() => onSelectUser(user)}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: 'primary.main',
                      color: 'primary.contrastText',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      },
                      '& .MuiListItemText-primary': {
                        color: 'inherit',
                      },
                      '& .MuiListItemText-secondary': {
                        color: 'inherit',
                        opacity: 0.8,
                      },
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        fontSize: '0.875rem',
                        bgcolor: index === selectedIndex ? 'primary.contrastText' : 'primary.main',
                        color: index === selectedIndex ? 'primary.main' : 'primary.contrastText',
                      }}
                    >
                      {getUserInitials(user)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="body2" component="span">
                        <strong>@{user.username}</strong>
                        {user.nickname && user.nickname !== user.username && (
                          <span style={{ marginLeft: 8 }}>({user.nickname})</span>
                        )}
                      </Typography>
                    }
                    secondary={
                      user.first_name || user.last_name ? (
                        <Typography variant="caption" component="span">
                          {[user.first_name, user.last_name].filter(Boolean).join(' ')}
                        </Typography>
                      ) : null
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))}
            {users.length === 0 && !isLoading && (
              <ListItem>
                <ListItemText
                  primary={
                    <Typography variant="body2" color="text.secondary" align="center">
                      ユーザーが見つかりません
                    </Typography>
                  }
                />
              </ListItem>
            )}
          </List>
        )}
      </Paper>
    </Popper>
  );
};

export default MentionSuggestions;