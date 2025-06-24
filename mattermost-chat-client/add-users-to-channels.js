/**
 * ユーザーをチャンネルに追加するスクリプト
 * SQL経由で作成されたチャンネルにユーザーを追加
 */

import axios from 'axios';

const MATTERMOST_URL = 'http://localhost:8065';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'Admin123456!';
const TARGET_USERNAME = 'sho1';

const api = axios.create({
  baseURL: `${MATTERMOST_URL}/api/v4`,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Teams
const TEAMS = [
  { id: '51ug8r6idtrkzf8ortj1xaso3e', name: 'Pacific Glory' },
  { id: 'p1g6ni5thtboxyntatuh9uczjh', name: 'Ocean Dream' },
  { id: 'rckku9qykbr85ycmu6g3hwx48c', name: 'Grain Master' },
  { id: 'dtrxczo4dfbgtdg18p5y6yd8kh', name: 'Star Carrier' },
  { id: 'r7a1ppzpxjgufr7j5jjd1mbizy', name: 'Blue Horizon' }
];

async function addUsersToChannels() {
  console.log('👥 チャンネルメンバー追加開始...\n');

  try {
    // ログイン
    console.log('1️⃣ 管理者ログイン...');
    const loginResponse = await api.post('/users/login', {
      login_id: ADMIN_USERNAME,
      password: ADMIN_PASSWORD
    });
    
    const authToken = loginResponse.headers.token;
    api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    const adminId = loginResponse.data.id;
    console.log('✅ ログイン成功\n');

    // 対象ユーザー取得
    console.log('2️⃣ 対象ユーザー情報取得...');
    const targetUser = await api.get(`/users/username/${TARGET_USERNAME}`);
    const targetUserId = targetUser.data.id;
    console.log(`✅ ユーザー発見: ${TARGET_USERNAME} (${targetUserId})\n`);

    // 各チームのチャンネルを取得してユーザーを追加
    console.log('3️⃣ チャンネルメンバー追加...');
    for (const team of TEAMS) {
      console.log(`\n--- ${team.name} ---`);
      
      try {
        // チームのチャンネル一覧を別の方法で取得
        // 直接SQLで取得したチャンネルIDを使用
        const channelNames = [
          `${team.name.toLowerCase().replace(/\s+/g, '-')}-general`,
          `${team.name.toLowerCase().replace(/\s+/g, '-')}-operations`,
          `${team.name.toLowerCase().replace(/\s+/g, '-')}-maintenance`
        ];

        for (const channelName of channelNames) {
          try {
            // チャンネル名でチャンネルを取得
            const channel = await api.get(`/teams/${team.id}/channels/name/${channelName}`);
            
            // 管理者を追加
            try {
              await api.post(`/channels/${channel.data.id}/members`, {
                user_id: adminId
              });
              console.log(`✅ 管理者を ${channelName} に追加`);
            } catch (e) {
              if (e.response?.status === 409) {
                console.log(`ℹ️  管理者は既に ${channelName} のメンバー`);
              }
            }

            // 対象ユーザーを追加
            try {
              await api.post(`/channels/${channel.data.id}/members`, {
                user_id: targetUserId
              });
              console.log(`✅ ${TARGET_USERNAME}を ${channelName} に追加`);
            } catch (e) {
              if (e.response?.status === 409) {
                console.log(`ℹ️  ${TARGET_USERNAME}は既に ${channelName} のメンバー`);
              }
            }
          } catch (e) {
            console.error(`❌ チャンネル ${channelName} の処理エラー:`, e.response?.data?.message || e.message);
          }
        }
      } catch (error) {
        console.error(`❌ チーム ${team.name} の処理エラー:`, error.response?.data || error.message);
      }
    }

    // ログアウト
    await api.post('/users/logout');
    console.log('\n👋 ログアウト完了');

  } catch (error) {
    console.error('\n❌ 失敗:', error.response?.data || error.message);
  }
}

// 実行
addUsersToChannels();