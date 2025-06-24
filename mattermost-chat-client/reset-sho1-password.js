import axios from 'axios';

const MATTERMOST_URL = 'http://localhost:8065';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'Admin123456!';
const NEW_SHO1_PASSWORD = 'sho12345';

const api = axios.create({
  baseURL: `${MATTERMOST_URL}/api/v4`,
  headers: {
    'Content-Type': 'application/json',
  }
});

async function resetSho1Password() {
  console.log('🔑 sho1ユーザーのパスワードリセット\n');

  try {
    // 管理者でログイン
    console.log('1️⃣ 管理者でログイン中...');
    const loginResponse = await api.post('/users/login', {
      login_id: ADMIN_USERNAME,
      password: ADMIN_PASSWORD
    });
    
    const authToken = loginResponse.headers.token;
    api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    console.log('✅ 管理者ログイン成功\n');

    // sho1ユーザーを検索
    console.log('2️⃣ sho1ユーザーを検索中...');
    const userResponse = await api.get('/users/username/sho1');
    const user = userResponse.data;
    console.log('✅ sho1ユーザーが見つかりました');
    console.log(`- ID: ${user.id}`);
    console.log(`- ユーザー名: ${user.username}`);
    console.log(`- メール: ${user.email}\n`);

    // パスワードをリセット
    console.log('3️⃣ パスワードをリセット中...');
    try {
      await api.put(`/users/${user.id}/password`, {
        new_password: NEW_SHO1_PASSWORD
      });
      console.log('✅ パスワードリセット成功！');
      console.log(`新しいパスワード: ${NEW_SHO1_PASSWORD}\n`);
    } catch (error) {
      console.error('❌ パスワードリセットエラー:', error.response?.data || error.message);
    }

    // 新しいパスワードでログインテスト
    console.log('4️⃣ 新しいパスワードでログインテスト中...');
    try {
      // まず管理者をログアウト
      await api.post('/users/logout');
      
      // sho1でログイン
      const sho1LoginResponse = await api.post('/users/login', {
        login_id: 'sho1',
        password: NEW_SHO1_PASSWORD
      });
      
      console.log('✅ ログインテスト成功！');
      console.log('sho1ユーザーは以下の認証情報でログインできます:');
      console.log(`- ユーザー名: sho1`);
      console.log(`- パスワード: ${NEW_SHO1_PASSWORD}`);
      
    } catch (loginError) {
      console.error('❌ ログインテスト失敗:', loginError.response?.data || loginError.message);
      console.log('手動でパスワードをリセットする必要があるかもしれません。');
    }

  } catch (error) {
    console.error('❌ エラー:', error.response?.data || error.message);
  }
}

// 実行
resetSho1Password();