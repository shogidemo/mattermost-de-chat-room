import axios from 'axios';

const API_URL = 'http://localhost:8065/api/v4';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'Admin123456!';

async function fixTeamTypes() {
  console.log('🔧 チームタイプと権限を修正します...\n');
  
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
    console.log('\n3. 船舶チームの詳細を確認...');
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
        console.log(`\n📋 ${team.display_name}:`);
        console.log(`  - ID: ${team.id}`);
        console.log(`  - Type: ${team.type} (${team.type === 'O' ? 'Open' : 'Private'})`);
        console.log(`  - Allow Open Invite: ${team.allow_open_invite}`);
        
        // チームのメンバーシップ設定を確認
        const memberships = await api.get(`/teams/${team.id}/members`);
        const sho1Member = memberships.data.find(m => m.user_id === sho1.id);
        
        if (sho1Member) {
          console.log(`  ✅ sho1は既にメンバーです`);
        } else {
          console.log(`  ❌ sho1はメンバーではありません`);
          
          // 強制的にメンバーとして追加
          try {
            await api.post(`/teams/${team.id}/members`, {
              team_id: team.id,
              user_id: sho1.id,
            });
            console.log(`  ✅ sho1をメンバーとして追加しました`);
          } catch (error) {
            console.log(`  ❌ メンバー追加エラー: ${error.response?.data?.message}`);
          }
        }
        
        // チームの設定を更新（オープンチームに変更）
        if (team.type !== 'O' || !team.allow_open_invite) {
          console.log('  🔧 チーム設定を更新中...');
          await api.put(`/teams/${team.id}`, {
            type: 'O',
            allow_open_invite: true
          });
          console.log('  ✅ オープンチームに変更しました');
        }
        
      } catch (error) {
        console.error(`❌ ${teamName}: ${error.response?.data?.message || error.message}`);
      }
    }
    
    // 4. sho1の最終確認
    console.log('\n4. sho1の所属チームを最終確認...');
    const sho1TeamsResponse = await api.get(`/users/${sho1.id}/teams`);
    const sho1Teams = sho1TeamsResponse.data;
    console.log(`\n✅ sho1は${sho1Teams.length}個のチームに所属しています:`);
    
    sho1Teams.forEach(team => {
      console.log(`  - ${team.display_name} (${team.type === 'O' ? 'Open' : 'Private'})`);
    });
    
    console.log('\n✅ 修正完了！');
    console.log('\n次のステップ:');
    console.log('1. ブラウザを更新（またはキャッシュをクリア）');
    console.log('2. sho1で再ログイン');
    console.log('3. 船舶を選択してチャンネルが表示されることを確認');
    
  } catch (error) {
    console.error('エラーが発生しました:', error.response?.data || error.message);
  }
}

fixTeamTypes();