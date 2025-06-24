import axios from 'axios';

const API_URL = 'http://localhost:8065/api/v4';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'Admin123456!';

// 船舶チーム情報
const VESSEL_TEAMS = [
  { teamName: 'pacific-glory-team', displayName: 'Pacific Glory チーム' },
  { teamName: 'ocean-dream-team', displayName: 'Ocean Dream チーム' },
  { teamName: 'grain-master-team', displayName: 'Grain Master チーム' },
  { teamName: 'star-carrier-team', displayName: 'Star Carrier チーム' },
  { teamName: 'blue-horizon-team', displayName: 'Blue Horizon チーム' },
];

// デフォルトチャンネル
const DEFAULT_CHANNELS = [
  { name: 'general', display_name: '一般', purpose: '日常的な連絡・情報共有' },
  { name: 'operations', display_name: '運航管理', purpose: '運航に関する情報・指示' },
  { name: 'maintenance', display_name: '保守・整備', purpose: '船舶の保守・整備情報' },
];

async function createDefaultChannels() {
  try {
    // 1. 管理者でログイン
    console.log('1. 管理者でログイン中...');
    const loginResponse = await axios.post(`${API_URL}/users/login`, {
      login_id: ADMIN_USERNAME,
      password: ADMIN_PASSWORD,
    });
    
    const token = loginResponse.headers.token;
    const adminUserId = loginResponse.data.id;
    
    // Axiosインスタンスを作成
    const api = axios.create({
      baseURL: API_URL,
      headers: { Authorization: `Bearer ${token}` },
    });

    // 2. sho1ユーザーを取得
    console.log('2. sho1ユーザーを検索中...');
    const sho1Response = await api.get('/users/username/sho1');
    const sho1UserId = sho1Response.data.id;
    console.log(`   sho1ユーザーID: ${sho1UserId}`);

    // 3. 各船舶チームを処理
    for (const team of VESSEL_TEAMS) {
      console.log(`\n3. ${team.displayName} を処理中...`);
      
      try {
        // チームを取得
        const teamResponse = await api.get(`/teams/name/${team.teamName}`);
        const teamId = teamResponse.data.id;
        console.log(`   チームID: ${teamId}`);
        
        // sho1をチームメンバーに追加
        console.log('   sho1をチームメンバーに追加中...');
        try {
          await api.post(`/teams/${teamId}/members`, {
            team_id: teamId,
            user_id: sho1UserId,
          });
          console.log('   ✅ sho1をメンバーに追加しました');
        } catch (error) {
          if (error.response?.status === 409) {
            console.log('   ℹ️ sho1は既にメンバーです');
          } else {
            console.error('   ❌ メンバー追加エラー:', error.response?.data?.message || error.message);
          }
        }
        
        // デフォルトチャンネルを作成
        for (const channel of DEFAULT_CHANNELS) {
          console.log(`   チャンネル「${channel.display_name}」を作成中...`);
          
          try {
            const channelData = {
              team_id: teamId,
              name: channel.name,
              display_name: channel.display_name,
              purpose: channel.purpose,
              type: 'O', // Open channel
            };
            
            const channelResponse = await api.post('/channels', channelData);
            console.log(`   ✅ チャンネル「${channel.display_name}」を作成しました`);
            
            // sho1をチャンネルメンバーに追加
            const channelId = channelResponse.data.id;
            await api.post(`/channels/${channelId}/members`, {
              user_id: sho1UserId,
            });
            
          } catch (error) {
            if (error.response?.status === 400 && error.response?.data?.id === 'store.sql_channel.save_channel.exists.app_error') {
              console.log(`   ℹ️ チャンネル「${channel.display_name}」は既に存在します`);
            } else {
              console.error(`   ❌ チャンネル作成エラー:`, error.response?.data?.message || error.message);
            }
          }
        }
        
      } catch (error) {
        console.error(`❌ ${team.displayName} の処理中にエラー:`, error.response?.data?.message || error.message);
      }
    }
    
    console.log('\n✅ 処理が完了しました！');
    console.log('sho1ユーザーで再度ログインしてチャンネルを確認してください。');
    
  } catch (error) {
    console.error('エラーが発生しました:', error.response?.data || error.message);
  }
}

createDefaultChannels();