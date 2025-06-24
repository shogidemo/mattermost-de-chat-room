/**
 * 船舶チームセットアップスクリプト
 * 管理者権限で実行し、必要なチームとチャンネルを事前作成します
 * 
 * 使用方法:
 * 1. ADMIN_USERNAME と ADMIN_PASSWORD を設定
 * 2. node setup-vessel-teams.js を実行
 */

import axios from 'axios';

// ========== 設定 ==========
const MATTERMOST_URL = 'http://localhost:8065';
const ADMIN_USERNAME = 'admin'; // 管理者ユーザー名を設定
const ADMIN_PASSWORD = 'Admin123456!'; // 管理者パスワードを設定
const TARGET_USERNAME = 'sho1'; // チームに追加するユーザー

// 船舶チーム定義
const VESSEL_TEAMS = [
  {
    name: 'pacific-glory-team',
    display_name: 'Pacific Glory チーム',
    description: 'Pacific Glory (VRPG7) の船舶運航管理チーム',
    vessel_name: 'Pacific Glory'
  },
  {
    name: 'ocean-dream-team',
    display_name: 'Ocean Dream チーム',
    description: 'Ocean Dream (JXOD8) の船舶運航管理チーム',
    vessel_name: 'Ocean Dream'
  },
  {
    name: 'grain-master-team',
    display_name: 'Grain Master チーム',
    description: 'Grain Master (PHGM9) の船舶運航管理チーム',
    vessel_name: 'Grain Master'
  },
  {
    name: 'star-carrier-team',
    display_name: 'Star Carrier チーム',
    description: 'Star Carrier (SGSC5) の船舶運航管理チーム',
    vessel_name: 'Star Carrier'
  },
  {
    name: 'blue-horizon-team',
    display_name: 'Blue Horizon チーム',
    description: 'Blue Horizon (PABH2) の船舶運航管理チーム',
    vessel_name: 'Blue Horizon'
  }
];

// デフォルトチャンネルのテンプレート
const getDefaultChannels = (vesselName) => {
  const prefix = vesselName.toLowerCase().replace(/\s+/g, '-');
  return [
    {
      name: `${prefix}-general`,
      display_name: '一般',
      purpose: `${vesselName}の一般的な連絡事項`,
      header: `${vesselName}チームの一般チャンネル`,
      type: 'O'
    },
    {
      name: `${prefix}-operations`,
      display_name: '運航管理',
      purpose: `${vesselName}の運航状況・管理情報`,
      header: `${vesselName}の運航管理専用チャンネル`,
      type: 'O'
    },
    {
      name: `${prefix}-maintenance`,
      display_name: 'メンテナンス',
      purpose: `${vesselName}のメンテナンス・保守情報`,
      header: `${vesselName}のメンテナンス情報専用チャンネル`,
      type: 'O'
    }
  ];
};

// APIクライアント
const api = axios.create({
  baseURL: `${MATTERMOST_URL}/api/v4`,
  headers: {
    'Content-Type': 'application/json',
  }
});

let authToken = '';

// メイン処理
async function setupVesselTeams() {
  console.log('🚢 船舶チームセットアップ開始...\n');

  try {
    // 1. 管理者ログイン
    console.log('1️⃣ 管理者ログイン...');
    const loginResponse = await api.post('/users/login', {
      login_id: ADMIN_USERNAME,
      password: ADMIN_PASSWORD
    });
    
    authToken = loginResponse.headers.token;
    api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    console.log('✅ ログイン成功\n');

    // 2. 対象ユーザーの情報取得
    console.log('2️⃣ 対象ユーザー情報取得...');
    const targetUser = await api.get(`/users/username/${TARGET_USERNAME}`);
    console.log(`✅ ユーザー発見: ${targetUser.data.username} (${targetUser.data.id})\n`);

    // 3. 各船舶チームを作成
    console.log('3️⃣ 船舶チーム作成...');
    for (const teamConfig of VESSEL_TEAMS) {
      console.log(`\n--- ${teamConfig.display_name} ---`);
      
      try {
        // チームが既に存在するか確認
        let team;
        try {
          const existingTeam = await api.get(`/teams/name/${teamConfig.name}`);
          team = existingTeam.data;
          console.log(`ℹ️  チーム既存: ${team.display_name}`);
        } catch (e) {
          // チーム作成
          const createTeamResponse = await api.post('/teams', {
            name: teamConfig.name,
            display_name: teamConfig.display_name,
            description: teamConfig.description,
            type: 'O'
          });
          team = createTeamResponse.data;
          console.log(`✅ チーム作成: ${team.display_name}`);
        }

        // 管理者自身をチームに追加（チャンネル作成権限のため）
        try {
          await api.post(`/teams/${team.id}/members`, {
            team_id: team.id,
            user_id: loginResponse.data.id
          });
          console.log(`✅ 管理者をチームに追加`);
        } catch (e) {
          if (e.response?.status === 409) {
            console.log(`ℹ️  管理者は既にメンバー`);
          } else {
            console.error(`⚠️  管理者の追加失敗:`, e.response?.data?.message);
          }
        }

        // ユーザーをチームに追加
        try {
          await api.post(`/teams/${team.id}/members`, {
            team_id: team.id,
            user_id: targetUser.data.id
          });
          console.log(`✅ ${TARGET_USERNAME}をチームに追加`);
        } catch (e) {
          if (e.response?.status === 409) {
            console.log(`ℹ️  ${TARGET_USERNAME}は既にメンバー`);
          } else {
            throw e;
          }
        }

        // 既存チャンネルを取得して構造を確認
        try {
          console.log(`   既存チャンネル取得を試行...`);
          const existingChannels = await api.get(`/users/me/teams/${team.id}/channels`);
          console.log(`   既存チャンネル数: ${existingChannels.data.length}`);
          if (existingChannels.data.length > 0) {
            console.log(`   サンプルチャンネル構造:`, JSON.stringify(existingChannels.data[0], null, 2).substring(0, 200) + '...');
          }
        } catch (e) {
          console.error(`   既存チャンネル取得エラー:`, e.response?.data || e.message);
        }

        // デフォルトチャンネル作成
        const channels = getDefaultChannels(teamConfig.vessel_name);
        for (const channelConfig of channels) {
          try {
            // 最小限の必須フィールドのみでチャンネル作成を試行
            const channelData = {
              team_id: team.id,
              name: channelConfig.name,
              display_name: channelConfig.display_name,
              type: channelConfig.type
            };
            
            console.log(`   作成データ:`, JSON.stringify(channelData, null, 2));
            
            const createChannelResponse = await api.post('/channels', channelData);
            console.log(`✅ チャンネル作成: ${createChannelResponse.data.display_name}`);
          } catch (e) {
            if (e.response?.data?.message?.includes('already exists')) {
              console.log(`ℹ️  チャンネル既存: ${channelConfig.display_name}`);
            } else {
              console.error(`❌ チャンネル作成失敗: ${channelConfig.display_name}`);
              console.error(`   エラー詳細:`, e.response?.data || e.message);
              console.error(`   ステータスコード:`, e.response?.status);
            }
          }
        }
      } catch (error) {
        console.error(`❌ エラー: ${teamConfig.display_name}`, error.response?.data || error.message);
      }
    }

    console.log('\n✅ セットアップ完了！');
    console.log('\n📋 作成されたチーム:');
    VESSEL_TEAMS.forEach(team => {
      console.log(`  - ${team.display_name} (${team.name})`);
    });

  } catch (error) {
    console.error('\n❌ セットアップ失敗:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.error('💡 管理者の認証情報を確認してください');
    }
  } finally {
    // ログアウト
    if (authToken) {
      try {
        await api.post('/users/logout');
        console.log('\n👋 ログアウト完了');
      } catch (e) {
        // ログアウトエラーは無視
      }
    }
  }
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  setupVesselTeams();
}