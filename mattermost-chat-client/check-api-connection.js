import axios from 'axios';

const API_URL = 'http://localhost:8065/api/v4';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'Admin123456!';

async function checkApiConnection() {
  console.log('🔍 API接続確認を開始します...\n');
  
  try {
    // 1. 管理者でログイン
    console.log('1. 管理者でログイン...');
    const loginResponse = await axios.post(`${API_URL}/users/login`, {
      login_id: ADMIN_USERNAME,
      password: ADMIN_PASSWORD,
    });
    
    const token = loginResponse.headers.token;
    console.log('✅ ログイン成功');
    
    const api = axios.create({
      baseURL: API_URL,
      headers: { Authorization: `Bearer ${token}` },
    });
    
    // 2. チーム一覧を取得
    console.log('\n2. チーム一覧を取得...');
    const teamsResponse = await api.get('/teams');
    const teams = teamsResponse.data;
    console.log(`✅ ${teams.length}個のチームが見つかりました`);
    
    teams.forEach(team => {
      console.log(`  - ${team.display_name} (${team.name})`);
    });
    
    // 3. 船舶チームの確認
    console.log('\n3. 船舶チームの存在確認...');
    const vesselTeamNames = [
      'pacific-glory-team',
      'ocean-dream-team',
      'grain-master-team',
      'star-carrier-team',
      'blue-horizon-team'
    ];
    
    for (const teamName of vesselTeamNames) {
      try {
        const teamResponse = await api.get(`/teams/name/${teamName}`);
        const team = teamResponse.data;
        console.log(`✅ ${team.display_name} が存在します`);
        
        // チャンネル数を確認
        const channelsResponse = await api.get(`/teams/${team.id}/channels`);
        const channels = channelsResponse.data;
        console.log(`   チャンネル数: ${channels.length}`);
        
        if (channels.length > 0) {
          console.log('   チャンネル:');
          channels.slice(0, 3).forEach(ch => {
            console.log(`     - ${ch.display_name || ch.name}`);
          });
        }
      } catch (error) {
        console.log(`❌ ${teamName} が見つかりません`);
      }
    }
    
    // 4. sho1ユーザーの確認
    console.log('\n4. sho1ユーザーの確認...');
    try {
      const sho1Response = await api.get('/users/username/sho1');
      const sho1 = sho1Response.data;
      console.log(`✅ sho1ユーザーが存在します (ID: ${sho1.id})`);
      
      // sho1のチームメンバーシップを確認
      const sho1TeamsResponse = await api.get(`/users/${sho1.id}/teams`);
      const sho1Teams = sho1TeamsResponse.data;
      console.log(`   所属チーム数: ${sho1Teams.length}`);
      
      sho1Teams.forEach(team => {
        console.log(`     - ${team.display_name}`);
      });
    } catch (error) {
      console.log('❌ sho1ユーザーが見つかりません');
    }
    
    console.log('\n✅ API接続確認完了！');
    
  } catch (error) {
    console.error('エラーが発生しました:', error.response?.data || error.message);
  }
}

checkApiConnection();