import React, { useState } from 'react';
import {
  Box,
  Avatar,
  Typography,
  Paper,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  Reply as ReplyIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Forum as ThreadIcon,
} from '@mui/icons-material';
import type { Post } from '../types/mattermost';
import { useApp } from '../contexts/AppContext';

interface MessageListProps {
  posts: Post[];
}

interface MessageItemProps {
  post: Post;
  showAvatar?: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({ post, showAvatar = true }) => {
  const { state } = useApp();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { user: currentUser } = state;

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // 投稿時刻のフォーマット
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) {
      return '今';
    } else if (diffMins < 60) {
      return `${diffMins}分前`;
    } else if (diffHours < 24) {
      return `${diffHours}時間前`;
    } else if (diffDays < 7) {
      return `${diffDays}日前`;
    } else {
      return date.toLocaleDateString('ja-JP', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  // ユーザー名の取得（実際の実装では、ユーザー情報をキャッシュして使用）
  const getUserDisplayName = (userId: string) => {
    // TODO: ユーザー情報の取得とキャッシュ機能を実装
    return `ユーザー${userId.slice(-4)}`;
  };

  // ユーザーアバターの色を生成
  const getAvatarColor = (userId: string) => {
    const colors = [
      '#F44336', '#E91E63', '#9C27B0', '#673AB7',
      '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4',
      '#009688', '#4CAF50', '#8BC34A', '#CDDC39',
      '#FFC107', '#FF9800', '#FF5722', '#795548'
    ];
    const index = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  // スレッドメッセージかどうか
  const isThreadReply = !!post.root_id;
  
  // 自分の投稿かどうか
  const isOwnPost = currentUser?.id === post.user_id;

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1,
        p: 1,
        '&:hover': {
          backgroundColor: 'action.hover',
        },
        ...(isThreadReply && {
          ml: 4,
          borderLeft: 2,
          borderColor: 'primary.main',
          pl: 2,
        }),
      }}
    >
      {/* アバター */}
      {showAvatar && (
        <Avatar
          sx={{
            width: 32,
            height: 32,
            backgroundColor: getAvatarColor(post.user_id),
            fontSize: '0.875rem',
          }}
        >
          {getUserDisplayName(post.user_id).charAt(0)}
        </Avatar>
      )}

      {/* メッセージ内容 */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {/* ユーザー名と時刻 */}
        {showAvatar && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography variant="subtitle2" fontWeight="bold">
              {getUserDisplayName(post.user_id)}
            </Typography>
            {isOwnPost && (
              <Chip label="自分" size="small" variant="outlined" sx={{ height: 20 }} />
            )}
            <Typography variant="caption" color="text.secondary">
              {formatTime(post.create_at)}
            </Typography>
            {post.edit_at > post.create_at && (
              <Chip label="編集済み" size="small" variant="outlined" sx={{ height: 20 }} />
            )}
          </Box>
        )}

        {/* メッセージテキスト */}
        <Typography
          variant="body2"
          sx={{
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
          }}
        >
          {post.message}
        </Typography>

        {/* スレッド情報 */}
        {post.reply_count && post.reply_count > 0 && !isThreadReply && (
          <Box sx={{ mt: 1 }}>
            <Chip
              icon={<ThreadIcon />}
              label={`${post.reply_count} 件の返信`}
              size="small"
              variant="outlined"
              clickable
              sx={{ height: 24 }}
            />
          </Box>
        )}

        {/* 投稿アクション（ホバー時表示） */}
        <Box
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            opacity: 0,
            transition: 'opacity 0.2s',
            '.MuiBox-root:hover &': {
              opacity: 1,
            },
          }}
        >
          <Paper elevation={1} sx={{ display: 'flex', p: 0.5 }}>
            <Tooltip title="返信">
              <IconButton size="small">
                <ReplyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {!isThreadReply && post.reply_count === 0 && (
              <Tooltip title="スレッドを開始">
                <IconButton size="small">
                  <ThreadIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {isOwnPost && (
              <>
                <Tooltip title="編集">
                  <IconButton size="small">
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="削除">
                  <IconButton size="small">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            )}
            <IconButton size="small" onClick={handleMenuOpen}>
              <MoreIcon fontSize="small" />
            </IconButton>
          </Paper>
        </Box>
      </Box>

      {/* コンテキストメニュー */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleMenuClose}>
          <ReplyIcon fontSize="small" sx={{ mr: 1 }} />
          返信
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ThreadIcon fontSize="small" sx={{ mr: 1 }} />
          スレッドで返信
        </MenuItem>
        {isOwnPost && (
          <>
            <MenuItem onClick={handleMenuClose}>
              <EditIcon fontSize="small" sx={{ mr: 1 }} />
              編集
            </MenuItem>
            <MenuItem onClick={handleMenuClose}>
              <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
              削除
            </MenuItem>
          </>
        )}
      </Menu>
    </Box>
  );
};

const MessageList: React.FC<MessageListProps> = ({ posts }) => {
  // 連続する同じユーザーの投稿をグループ化して表示
  const groupedMessages = () => {
    const groups: { posts: Post[]; userId: string; firstTimestamp: number }[] = [];
    
    posts.forEach((post, index) => {
      const prevPost = posts[index - 1];
      const timeDiff = prevPost ? post.create_at - prevPost.create_at : Infinity;
      const sameUser = prevPost?.user_id === post.user_id;
      const withinTimeframe = timeDiff < 5 * 60 * 1000; // 5分以内

      if (sameUser && withinTimeframe && !post.root_id && !prevPost?.root_id) {
        // 同じグループに追加
        groups[groups.length - 1].posts.push(post);
      } else {
        // 新しいグループを作成
        groups.push({
          posts: [post],
          userId: post.user_id,
          firstTimestamp: post.create_at,
        });
      }
    });

    return groups;
  };

  const messageGroups = groupedMessages();

  return (
    <Box>
      {messageGroups.map((group, groupIndex) => (
        <Box key={`group-${groupIndex}`} sx={{ position: 'relative' }}>
          {group.posts.map((post, postIndex) => (
            <MessageItem
              key={post.id}
              post={post}
              showAvatar={postIndex === 0}
            />
          ))}
        </Box>
      ))}
    </Box>
  );
};

export default MessageList;