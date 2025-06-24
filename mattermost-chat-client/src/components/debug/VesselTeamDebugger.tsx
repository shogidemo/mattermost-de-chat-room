import React from 'react';
import { Button, Box, Typography, Paper } from '@mui/material';
import { useApp } from '../../contexts/AppContext';
import { getVesselInfo, getAllVesselInfos } from '../../utils/vesselTeamMapping';

export const VesselTeamDebugger: React.FC = () => {
  const { state, selectVesselTeam } = useApp();
  const [debugInfo, setDebugInfo] = React.useState<any[]>([]);

  const addDebugInfo = (info: any) => {
    setDebugInfo(prev => [...prev, { ...info, timestamp: new Date().toISOString() }]);
  };

  const testVesselTeamSwitch = async (vesselId: string) => {
    addDebugInfo({ 
      type: 'start', 
      message: `船舶 ${vesselId} のテスト開始`,
      vesselInfo: getVesselInfo(vesselId)
    });

    try {
      const team = await selectVesselTeam(vesselId);
      addDebugInfo({ 
        type: 'success', 
        message: 'チーム切り替え成功',
        team: {
          id: team.id,
          name: team.name,
          display_name: team.display_name
        }
      });
    } catch (error) {
      addDebugInfo({ 
        type: 'error', 
        message: 'チーム切り替え失敗',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };

  const clearDebugInfo = () => {
    setDebugInfo([]);
  };

  return (
    <Paper sx={{ position: 'fixed', bottom: 20, left: 20, p: 2, maxWidth: 400, maxHeight: 500, overflow: 'auto', zIndex: 9999 }}>
      <Typography variant="h6">船舶チームデバッガー</Typography>
      
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2">現在の状態:</Typography>
        <Typography variant="body2">
          チーム: {state.currentTeam?.display_name || 'なし'} ({state.currentTeam?.name || '-'})
        </Typography>
        <Typography variant="body2">
          チャンネル数: {state.channels.length}
        </Typography>
      </Box>

      <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {getAllVesselInfos().map(vessel => (
          <Button
            key={vessel.id}
            size="small"
            variant="outlined"
            onClick={() => testVesselTeamSwitch(vessel.id)}
          >
            {vessel.id}
          </Button>
        ))}
      </Box>

      <Button onClick={clearDebugInfo} size="small" sx={{ mt: 1 }}>
        ログクリア
      </Button>

      <Box sx={{ mt: 2, maxHeight: 300, overflow: 'auto' }}>
        {debugInfo.map((info, index) => (
          <Box key={index} sx={{ mb: 1, p: 1, bgcolor: info.type === 'error' ? 'error.light' : info.type === 'success' ? 'success.light' : 'grey.200' }}>
            <Typography variant="caption" display="block">
              [{info.timestamp}] {info.type.toUpperCase()}
            </Typography>
            <Typography variant="caption" display="block">
              {info.message}
            </Typography>
            {info.vesselInfo && (
              <Typography variant="caption" display="block">
                船舶: {info.vesselInfo.name} → {info.vesselInfo.teamName}
              </Typography>
            )}
            {info.team && (
              <Typography variant="caption" display="block">
                チーム: {info.team.display_name} ({info.team.name})
              </Typography>
            )}
            {info.error && (
              <Typography variant="caption" display="block" color="error">
                エラー: {info.error}
              </Typography>
            )}
          </Box>
        ))}
      </Box>
    </Paper>
  );
};