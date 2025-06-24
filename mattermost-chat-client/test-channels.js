/**
 * チャンネルアクセステストスクリプト
 * Mattermostのチャンネル関連APIの動作を確認
 */

import axios from 'axios';

const MATTERMOST_URL = 'http://localhost:8065';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'Admin123456!';

const api = axios.create({
  baseURL: `${MATTERMOST_URL}/api/v4`,
  headers: {
    'Content-Type': 'application/json',
  }
});

async function testChannelAPIs() {
  console.log('📋 チャンネルAPIテスト開始...\n');

  try {
    // ログイン
    console.log('1️⃣ 管理者ログイン...');
    const loginResponse = await api.post('/users/login', {
      login_id: ADMIN_USERNAME,
      password: ADMIN_PASSWORD
    });
    
    const authToken = loginResponse.headers.token;
    api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    const userId = loginResponse.data.id;
    console.log(`✅ ログイン成功 (ID: ${userId})\n`);

    // ユーザーのチーム取得
    console.log('2️⃣ ユーザーのチーム取得...');
    try {
      const teams = await api.get(`/users/me/teams`);
      console.log(`✅ チーム数: ${teams.data.length}`);
      
      if (teams.data.length > 0) {
        const firstTeam = teams.data[0];
        console.log(`   最初のチーム: ${firstTeam.display_name} (${firstTeam.id})`);
        
        // そのチームのチャンネルを取得してみる
        console.log(`\n3️⃣ チームのチャンネル取得を試行...`);
        try {
          const channels = await api.get(`/teams/${firstTeam.id}/channels`);
          console.log(`✅ チャンネル取得成功! チャンネル数: ${channels.data.length}`);
        } catch (e) {
          console.error(`❌ /teams/{id}/channels エラー:`, e.response?.data);
        }
        
        // 別のエンドポイントも試す
        try {
          const myChannels = await api.get(`/users/me/teams/${firstTeam.id}/channels`);
          console.log(`✅ /users/me/teams/{id}/channels 成功! チャンネル数: ${myChannels.data.length}`);
        } catch (e) {
          console.error(`❌ /users/me/teams/{id}/channels エラー:`, e.response?.data);
        }
      }
    } catch (e) {
      console.error(`❌ チーム取得エラー:`, e.response?.data);
    }

    // システム全体のチャンネル数を確認
    console.log('\n4️⃣ システム統計情報...');
    try {
      const analytics = await api.get('/analytics/old');
      console.log('✅ 分析データ:', JSON.stringify(analytics.data, null, 2));
    } catch (e) {
      console.error(`❌ 分析データ取得エラー:`, e.response?.data);
    }

    // ログアウト
    await api.post('/users/logout');
    console.log('\n👋 ログアウト完了');

  } catch (error) {
    console.error('\n❌ テスト失敗:', error.response?.data || error.message);
  }
}

// 実行
testChannelAPIs();