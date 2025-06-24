import axios from 'axios';

const API_URL = 'http://localhost:8065/api/v4';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'Admin123456!';

// 船舶チーム情報
const VESSEL_TEAMS = [
  { id: 'vessel-1', teamName: 'pacific-glory-team', displayName: 'Pacific Glory チーム' },
  { id: 'vessel-2', teamName: 'ocean-dream-team', displayName: 'Ocean Dream チーム' },
  { id: 'vessel-3', teamName: 'grain-master-team', displayName: 'Grain Master チーム' },
  { id: 'vessel-4', teamName: 'star-carrier-team', displayName: 'Star Carrier チーム' },
  { id: 'vessel-5', teamName: 'blue-horizon-team', displayName: 'Blue Horizon チーム' },
];

// デフォルトチャンネル
const DEFAULT_CHANNELS = [
  { name: 'general', display_name: '一般', purpose: '日常的な連絡・情報共有' },
  { name: 'operations', display_name: '運航管理', purpose: '運航に関する情報・指示' },
  { name: 'maintenance', display_name: '保守・整備', purpose: '船舶の保守・整備情報' },
];

async function setupAfterInit() {
  console.log('🚀 Mattermost追加セットアップを開始します...\n');
  
  try {
    // 1. 管理者でログイン
    console.log('1. 管理者でログイン中...');
    const loginResponse = await axios.post(`${API_URL}/users/login`, {
      login_id: ADMIN_USERNAME,
      password: ADMIN_PASSWORD,
    });
    
    const token = loginResponse.headers.token;
    const adminUserId = loginResponse.data.id;
    console.log('✅ ログイン成功');
    
    // Axiosインスタンスを作成
    const api = axios.create({
      baseURL: API_URL,
      headers: { Authorization: `Bearer ${token}` },
    });
    
    // 2. sho1ユーザーを作成
    console.log('\n2. sho1ユーザーを作成中...');
    let sho1UserId;
    try {
      const sho1Response = await api.post('/users', {
        email: 'sho1@example.com',
        username: 'sho1',
        password: 'sho12345',
      });
      sho1UserId = sho1Response.data.id;
      console.log('✅ sho1ユーザー作成成功');
    } catch (error) {
      if (error.response?.status === 409 || error.response?.status === 400) {
        console.log('ℹ️ sho1ユーザーは既に存在します');
        // 既存ユーザーのIDを取得
        const existingUser = await api.get('/users/username/sho1');
        sho1UserId = existingUser.data.id;
      } else {
        throw error;
      }
    }
    
    // 3. 船舶チームを作成
    console.log('\n3. 船舶チームを作成中...');
    const createdTeams = [];
    
    for (const vessel of VESSEL_TEAMS) {
      console.log(`\n  ${vessel.displayName} を処理中...`);
      
      try {
        // チームを作成
        const teamResponse = await api.post('/teams', {
          name: vessel.teamName,
          display_name: vessel.displayName,
          type: 'O', // Open team
          description: `${vessel.displayName}の船舶運航管理チーム`,
        });
        
        const teamId = teamResponse.data.id;
        createdTeams.push({ ...vessel, teamId });
        console.log(`  ✅ チーム作成成功`);
        
        // sho1と管理者をメンバーに追加
        await api.post(`/teams/${teamId}/members`, {
          team_id: teamId,
          user_id: sho1UserId,
        });
        console.log(`  ✅ sho1をメンバーに追加`);
        
        // 4. デフォルトチャンネルを作成
        console.log(`  チャンネルを作成中...`);
        for (const channel of DEFAULT_CHANNELS) {
          try {
            const channelResponse = await api.post('/channels', {
              team_id: teamId,
              name: channel.name,
              display_name: channel.display_name,
              purpose: channel.purpose,
              type: 'O',
            });
            
            const channelId = channelResponse.data.id;
            console.log(`    ✅ ${channel.display_name}`);
            
            // sho1をチャンネルメンバーに追加
            if (channel.name !== 'town-square') {  // town-squareは自動で追加される
              await api.post(`/channels/${channelId}/members`, {
                user_id: sho1UserId,
              });
            }
          } catch (error) {
            if (error.response?.status === 400 && error.response?.data?.id === 'store.sql_channel.save_channel.exists.app_error') {
              console.log(`    ℹ️ ${channel.display_name} は既に存在します`);
            } else {
              console.error(`    ❌ ${channel.display_name}: ${error.response?.data?.message}`);
            }
          }
        }
        
      } catch (error) {
        if (error.response?.status === 409) {
          console.log(`  ℹ️ チームは既に存在します`);
        } else {
          console.error(`  ❌ エラー: ${error.response?.data?.message}`);
        }
      }
    }
    
    console.log('\n✅ セットアップ完了！');
    console.log('\n===== ログイン情報 =====');
    console.log('管理者アカウント:');
    console.log('  ユーザー名: admin');
    console.log('  パスワード: Admin123456!');
    console.log('\n一般ユーザー:');
    console.log('  ユーザー名: sho1');
    console.log('  パスワード: sho12345');
    console.log('======================');
    
    console.log('\n次は動作確認を行ってください！');
    
  } catch (error) {
    console.error('エラーが発生しました:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n❌ ログインに失敗しました。');
      console.log('まず、ブラウザで http://localhost:8065 にアクセスして');
      console.log('管理者アカウントを作成してください。');
      console.log('詳細は SETUP-GUIDE.md を参照してください。');
    }
  }
}

setupAfterInit();