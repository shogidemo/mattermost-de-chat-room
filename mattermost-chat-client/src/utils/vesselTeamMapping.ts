// 船舶-チームマッピングユーティリティ

export interface VesselInfo {
  id: string;
  name: string;
  callSign: string;
  teamName: string;
  teamDisplayName: string;
}

// 船舶情報とチーム名のマッピング
export const VESSEL_TEAM_MAPPING: Record<string, VesselInfo> = {
  'vessel-1': {
    id: 'vessel-1',
    name: 'Pacific Glory',
    callSign: 'VRPG7',
    teamName: 'pacific-glory-team',
    teamDisplayName: 'Pacific Glory チーム',
  },
  'vessel-2': {
    id: 'vessel-2',
    name: 'Ocean Dream',
    callSign: 'JXOD8',
    teamName: 'ocean-dream-team',
    teamDisplayName: 'Ocean Dream チーム',
  },
  'vessel-3': {
    id: 'vessel-3',
    name: 'Grain Master',
    callSign: 'PHGM9',
    teamName: 'grain-master-team',
    teamDisplayName: 'Grain Master チーム',
  },
  'vessel-4': {
    id: 'vessel-4',
    name: 'Star Carrier',
    callSign: 'SGSC5',
    teamName: 'star-carrier-team',
    teamDisplayName: 'Star Carrier チーム',
  },
  'vessel-5': {
    id: 'vessel-5',
    name: 'Blue Horizon',
    callSign: 'PABH2',
    teamName: 'blue-horizon-team',
    teamDisplayName: 'Blue Horizon チーム',
  },
};

/**
 * 船舶IDからチーム名を取得
 */
export const getTeamNameByVesselId = (vesselId: string): string | null => {
  const vesselInfo = VESSEL_TEAM_MAPPING[vesselId];
  return vesselInfo ? vesselInfo.teamName : null;
};

/**
 * 船舶IDからチーム表示名を取得
 */
export const getTeamDisplayNameByVesselId = (vesselId: string): string | null => {
  const vesselInfo = VESSEL_TEAM_MAPPING[vesselId];
  return vesselInfo ? vesselInfo.teamDisplayName : null;
};

/**
 * 船舶IDから船舶情報を取得
 */
export const getVesselInfo = (vesselId: string): VesselInfo | null => {
  return VESSEL_TEAM_MAPPING[vesselId] || null;
};

/**
 * 船舶名からチーム名を生成（フォールバック用）
 */
export const generateTeamNameFromVesselName = (vesselName: string): string => {
  return vesselName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    + '-team';
};

/**
 * 全ての船舶情報を取得
 */
export const getAllVesselInfos = (): VesselInfo[] => {
  return Object.values(VESSEL_TEAM_MAPPING);
};

/**
 * 船舶IDリストを取得
 */
export const getAllVesselIds = (): string[] => {
  return Object.keys(VESSEL_TEAM_MAPPING);
};