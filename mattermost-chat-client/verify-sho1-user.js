import axios from 'axios';

const MATTERMOST_URL = 'http://localhost:8065';

const api = axios.create({
  baseURL: `${MATTERMOST_URL}/api/v4`,
  headers: {
    'Content-Type': 'application/json',
  }
});

async function verifySho1User() {
  console.log('🔍 sho1ユーザーの確認\n');

  try {
    // 管理者でログイン
    console.log('1️⃣ 管理者でログイン中...');
    const loginResponse = await api.post('/users/login', {
      login_id: 'admin',
      password: 'Admin123456!'
    });
    
    const authToken = loginResponse.headers.token;
    api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    console.log('✅ 管理者ログイン成功\n');

    // sho1ユーザーを検索
    console.log('2️⃣ sho1ユーザーを検索中...');
    try {
      const userResponse = await api.get('/users/username/sho1');
      const user = userResponse.data;
      console.log('✅ sho1ユーザーが見つかりました！');
      console.log(`- ID: ${user.id}`);
      console.log(`- ユーザー名: ${user.username}`);
      console.log(`- メール: ${user.email}`);
      console.log(`- 作成日: ${new Date(user.create_at).toLocaleString()}`);
      console.log(`- 最終活動: ${new Date(user.update_at).toLocaleString()}`);
      console.log(`- ロール: ${user.roles}`);
      
      // ユーザーのチーム所属を確認
      console.log('\n3️⃣ チーム所属を確認中...');
      const teamsResponse = await api.get(`/users/${user.id}/teams`);
      const teams = teamsResponse.data;
      console.log(`所属チーム数: ${teams.length}`);
      teams.forEach(team => {
        console.log(`- ${team.display_name} (${team.name})`);
      });
      
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('❌ sho1ユーザーが存在しません！');
        
        // ユーザーを作成する
        console.log('\n4️⃣ sho1ユーザーを作成中...');
        try {
          const createUserResponse = await api.post('/users', {
            email: 'sho1@example.com',
            username: 'sho1',
            password: 'sho12345',
            first_name: 'Sho',
            last_name: 'One'
          });
          
          console.log('✅ sho1ユーザーを作成しました！');
          console.log(`- ID: ${createUserResponse.data.id}`);
          
        } catch (createError) {
          console.error('❌ ユーザー作成エラー:', createError.response?.data || createError.message);
        }
      } else {
        console.error('❌ エラー:', error.response?.data || error.message);
      }
    }

  } catch (error) {
    console.error('❌ エラー:', error.response?.data || error.message);
  }
}

// 実行
verifySho1User();