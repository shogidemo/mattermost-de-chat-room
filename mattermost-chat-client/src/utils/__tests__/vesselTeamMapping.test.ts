import {
  getTeamNameByVesselId,
  getTeamDisplayNameByVesselId,
  getVesselInfo,
  generateTeamNameFromVesselName,
  getAllVesselInfos,
  getAllVesselIds,
  VESSEL_TEAM_MAPPING
} from '../vesselTeamMapping';

describe('vesselTeamMapping', () => {
  describe('getTeamNameByVesselId', () => {
    it('正しい船舶IDでチーム名を取得できる', () => {
      expect(getTeamNameByVesselId('vessel-1')).toBe('pacific-glory-team');
      expect(getTeamNameByVesselId('vessel-2')).toBe('ocean-dream-team');
    });

    it('存在しない船舶IDでnullを返す', () => {
      expect(getTeamNameByVesselId('non-existent')).toBe(null);
    });
  });

  describe('getTeamDisplayNameByVesselId', () => {
    it('正しい船舶IDでチーム表示名を取得できる', () => {
      expect(getTeamDisplayNameByVesselId('vessel-1')).toBe('Pacific Glory チーム');
      expect(getTeamDisplayNameByVesselId('vessel-3')).toBe('Grain Master チーム');
    });

    it('存在しない船舶IDでnullを返す', () => {
      expect(getTeamDisplayNameByVesselId('invalid-id')).toBe(null);
    });
  });

  describe('getVesselInfo', () => {
    it('完全な船舶情報を取得できる', () => {
      const vesselInfo = getVesselInfo('vessel-1');
      expect(vesselInfo).toEqual({
        id: 'vessel-1',
        name: 'Pacific Glory',
        callSign: 'VRPG7',
        teamName: 'pacific-glory-team',
        teamDisplayName: 'Pacific Glory チーム',
      });
    });

    it('存在しない船舶IDでnullを返す', () => {
      expect(getVesselInfo('unknown')).toBe(null);
    });
  });

  describe('generateTeamNameFromVesselName', () => {
    it('船舶名から適切なチーム名を生成する', () => {
      expect(generateTeamNameFromVesselName('Pacific Glory')).toBe('pacific-glory-team');
      expect(generateTeamNameFromVesselName('Ocean Dream')).toBe('ocean-dream-team');
      expect(generateTeamNameFromVesselName('Test Vessel 123')).toBe('test-vessel-123-team');
    });

    it('特殊文字を適切に処理する', () => {
      expect(generateTeamNameFromVesselName('Ship-Name@#$')).toBe('ship-name-team');
      expect(generateTeamNameFromVesselName('多重  スペース')).toBe('--team');
    });
  });

  describe('getAllVesselInfos', () => {
    it('全ての船舶情報を取得できる', () => {
      const allVessels = getAllVesselInfos();
      expect(allVessels).toHaveLength(5);
      expect(allVessels[0]).toEqual(VESSEL_TEAM_MAPPING['vessel-1']);
    });
  });

  describe('getAllVesselIds', () => {
    it('全ての船舶IDを取得できる', () => {
      const allIds = getAllVesselIds();
      expect(allIds).toHaveLength(5);
      expect(allIds).toContain('vessel-1');
      expect(allIds).toContain('vessel-5');
    });
  });
});