import React from 'react';
import { Alert, AlertTitle, Collapse, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface ErrorBannerProps {
  error: string | null;
  onClose: () => void;
}

const ErrorBanner: React.FC<ErrorBannerProps> = ({ error, onClose }) => {
  if (!error) return null;

  return (
    <Collapse in={!!error}>
      <Alert
        severity="error"
        action={
          <IconButton
            aria-label="close"
            color="inherit"
            size="small"
            onClick={onClose}
          >
            <CloseIcon fontSize="inherit" />
          </IconButton>
        }
        sx={{
          mb: 2,
          '& .MuiAlert-message': {
            width: '100%',
          },
        }}
      >
        <AlertTitle>エラーが発生しました</AlertTitle>
        {error}
      </Alert>
    </Collapse>
  );
};

export default ErrorBanner;