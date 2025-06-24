import axios from 'axios';

const API_URL = 'http://localhost:8065/api/v4';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'Admin123456!';

async function addUserToTeams() {
  console.log('👥 ユーザーをチームに追加します...\n');
  
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
    
    // 2. sho1ユーザーを取得
    console.log('\n2. sho1ユーザーを取得...');
    const sho1Response = await api.get('/users/username/sho1');
    const sho1 = sho1Response.data;
    console.log(`✅ sho1ユーザー発見 (ID: ${sho1.id})`);
    
    // 3. すべてのチームを取得
    console.log('\n3. すべてのチームを取得...');
    const teamsResponse = await api.get('/teams');
    const teams = teamsResponse.data;
    console.log(`✅ ${teams.length}個のチームが見つかりました`);
    
    // 4. 船舶チームにsho1を追加
    console.log('\n4. 船舶チームにsho1を追加...');
    const vesselTeamNames = [
      'pacific-glory-team',
      'ocean-dream-team',
      'grain-master-team',
      'star-carrier-team',
      'blue-horizon-team'
    ];
    
    for (const team of teams) {
      if (vesselTeamNames.includes(team.name)) {
        try {
          console.log(`\n  ${team.display_name} (${team.name}) に追加中...`);
          
          // メンバーとして追加
          await api.post(`/teams/${team.id}/members`, {
            team_id: team.id,
            user_id: sho1.id,
          });
          console.log(`  ✅ 追加成功`);
          
          // チャンネルも確認
          const channelsResponse = await api.get(`/teams/${team.id}/channels`);
          const channels = channelsResponse.data;
          console.log(`  チャンネル数: ${channels.length}`);
          
          // 各チャンネルにも追加
          for (const channel of channels) {
            try {
              await api.post(`/channels/${channel.id}/members`, {
                user_id: sho1.id,
              });
              console.log(`    ✅ ${channel.display_name || channel.name} に追加`);
            } catch (error) {
              if (error.response?.status === 400) {
                console.log(`    ℹ️ ${channel.display_name || channel.name} に既に追加済み`);
              }
            }
          }
        } catch (error) {
          if (error.response?.status === 400) {
            console.log(`  ℹ️ 既にメンバーです`);
          } else {
            console.error(`  ❌ エラー: ${error.response?.data?.message}`);
          }
        }
      }
    }
    
    // 5. sho1の所属チームを確認
    console.log('\n5. sho1の所属チームを最終確認...');
    const sho1TeamsResponse = await api.get(`/users/${sho1.id}/teams`);
    const sho1Teams = sho1TeamsResponse.data;
    console.log(`✅ sho1は${sho1Teams.length}個のチームに所属しています:`);
    
    sho1Teams.forEach(team => {
      console.log(`  - ${team.display_name}`);
    });
    
    console.log('\n✅ 完了！');
    console.log('\n次のステップ:');
    console.log('1. ブラウザを更新');
    console.log('2. sho1でログイン');
    console.log('3. 船舶を選択してチャンネルが表示されることを確認');
    
  } catch (error) {
    console.error('エラーが発生しました:', error.response?.data || error.message);
  }
}

addUserToTeams();