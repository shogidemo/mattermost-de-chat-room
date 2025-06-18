import React from 'react';
import {
  Fab,
  Badge,
  Zoom,
} from '@mui/material';
import {
  Chat as ChatIcon,
} from '@mui/icons-material';

interface ChatBubbleProps {
  unreadCount?: number;
  onClick?: () => void;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ 
  unreadCount = 0, 
  onClick 
}) => {
  return (
    <Zoom in={true}>
      <Badge
        badgeContent={unreadCount > 0 ? unreadCount : null}
        color="error"
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 1300, // Material-UIのModalより上に表示
        }}
      >
        <Fab
          color="primary"
          onClick={onClick}
          data-testid="chat-bubble"
          sx={{
            width: 60,
            height: 60,
            '&:hover': {
              transform: 'scale(1.1)',
              boxShadow: '0 8px 25px rgba(25, 118, 210, 0.4)',
            },
            transition: 'all 0.2s ease-in-out',
            ...(unreadCount > 0 && {
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%': {
                  boxShadow: '0 0 0 0 rgba(25, 118, 210, 0.7)',
                },
                '70%': {
                  boxShadow: '0 0 0 10px rgba(25, 118, 210, 0)',
                },
                '100%': {
                  boxShadow: '0 0 0 0 rgba(25, 118, 210, 0)',
                },
              },
            }),
          }}
        >
          <ChatIcon />
        </Fab>
      </Badge>
    </Zoom>
  );
};

export default ChatBubble;