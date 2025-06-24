import axios from 'axios';

const MATTERMOST_URL = 'http://localhost:8065';
const USERNAME = 'sho1';
const PASSWORD = 'Password123!';

const api = axios.create({
  baseURL: `${MATTERMOST_URL}/api/v4`,
  headers: {
    'Content-Type': 'application/json',
  }
});

async function checkPermissions() {
  console.log('🔍 sho1ユーザーの権限確認\n');

  try {
    // ログイン
    console.log('1️⃣ ログイン中...');
    const loginResponse = await api.post('/users/login', {
      login_id: USERNAME,
      password: PASSWORD
    });
    
    const authToken = loginResponse.headers.token;
    api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    console.log('✅ ログイン成功\n');

    // ユーザー情報取得
    console.log('2️⃣ ユーザー情報取得...');
    const userResponse = await api.get('/users/me');
    const user = userResponse.data;
    console.log(`ユーザー名: ${user.username}`);
    console.log(`ロール: ${user.roles}`);
    console.log(`ID: ${user.id}\n`);

    // システム設定の確認
    console.log('3️⃣ システム設定確認...');
    try {
      const configResponse = await api.get('/config');
      console.log('✅ 管理者権限あり（システム設定にアクセス可能）');
    } catch (e) {
      console.log('ℹ️  一般ユーザー権限（システム設定にアクセス不可）');
    }

    // チーム作成テスト
    console.log('\n4️⃣ チーム作成権限テスト...');
    try {
      const testTeamName = `test-team-${Date.now()}`;
      const createResponse = await api.post('/teams', {
        name: testTeamName,
        display_name: 'テストチーム',
        type: 'O'
      });
      
      console.log('✅ チーム作成権限あり！');
      
      // テストチームを削除
      await api.delete(`/teams/${createResponse.data.id}`);
      console.log('✅ テストチーム削除完了\n');
      
      return true;
    } catch (e) {
      console.log('❌ チーム作成権限なし');
      console.log(`エラー: ${e.response?.data?.message || e.message}\n`);
      return false;
    }

  } catch (error) {
    console.error('❌ エラー:', error.response?.data || error.message);
    return false;
  }
}

// 実行
checkPermissions().then(hasPermission => {
  if (hasPermission) {
    console.log('✨ sho1ユーザーでチーム作成可能です！');
    console.log('setup-vessel-teams.js の認証情報を以下に変更してください:');
    console.log('const ADMIN_USERNAME = \'sho1\';');
    console.log('const ADMIN_PASSWORD = \'Password123!\';');
  } else {
    console.log('⚠️  sho1ユーザーにはチーム作成権限がありません。');
    console.log('管理者権限を持つユーザーで実行する必要があります。');
  }
});