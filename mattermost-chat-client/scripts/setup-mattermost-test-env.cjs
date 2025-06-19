#!/usr/bin/env node

/**
 * Mattermost テスト環境自動セットアップスクリプト
 * 
 * このスクリプトは、Mattermost APIを使用して以下を自動的に作成します：
 * - テストユーザー（testuser1, testuser2）
 * - 管理者ユーザー（admin）
 * - チーム（myteam）
 * - チャンネル（営業チーム、開発チーム、品質管理）
 */

const axios = require('axios');

// 設定
const MATTERMOST_URL = process.env.MATTERMOST_URL || 'http://localhost:8065';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123456!';

/**
 * Mattermost APIクライアントクラス
 */
class MattermostSetup {
  constructor(baseURL = MATTERMOST_URL) {
    this.client = axios.create({
      baseURL: `${baseURL}/api/v4`,
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });
    this.token = null;
    this.adminToken = null;
  }

  /**
   * APIエラーハンドリング
   */
  handleError(error, context) {
    if (error.response) {
      const { status, data } = error.response;
      console.error(`❌ ${context} - エラー ${status}:`, data.message || data);
      
      // 既に存在する場合は警告のみ
      if (status === 400 && data.id === 'store.sql_user.save.username_exists.app_error') {
        console.log(`⚠️  ${context} - ユーザーは既に存在します`);
        return { exists: true, data: null };
      }
      if (status === 400 && data.id === 'store.sql_team.save.domain_exists.app_error') {
        console.log(`⚠️  ${context} - チームは既に存在します`);
        return { exists: true, data: null };
      }
      if (status === 400 && data.id === 'store.sql_channel.save_channel.exists.app_error') {
        console.log(`⚠️  ${context} - チャンネルは既に存在します`);
        return { exists: true, data: null };
      }
    } else {
      console.error(`❌ ${context} - ネットワークエラー:`, error.message);
    }
    throw error;
  }

  /**
   * ユーザーログイン
   */
  async login(username, password) {
    try {
      console.log(`🔑 ${username} でログイン中...`);
      const response = await this.client.post('/users/login', {
        login_id: username,
        password
      });
      const token = response.headers.token;
      this.client.defaults.headers.Authorization = `Bearer ${token}`;
      this.token = token;
      console.log(`✅ ${username} でログイン成功`);
      return { user: response.data, token };
    } catch (error) {
      return this.handleError(error, 'ログイン');
    }
  }

  /**
   * ユーザー作成
   */
  async createUser(userData) {
    try {
      console.log(`👤 ユーザー作成中: ${userData.username}`);
      const response = await this.client.post('/users', userData);
      console.log(`✅ ユーザー作成成功: ${userData.username}`);
      return response.data;
    } catch (error) {
      const result = this.handleError(error, `ユーザー作成 (${userData.username})`);
      if (result.exists) {
        // 既存ユーザーを検索
        try {
          const searchResponse = await this.client.post('/users/search', {
            term: userData.username,
            allow_inactive: false
          });
          if (searchResponse.data.length > 0) {
            console.log(`ℹ️  既存ユーザーを使用: ${userData.username}`);
            return searchResponse.data[0];
          }
        } catch (searchError) {
          console.error('ユーザー検索エラー:', searchError.message);
        }
      }
      throw error;
    }
  }

  /**
   * チーム作成
   */
  async createTeam(teamData) {
    try {
      console.log(`👥 チーム作成中: ${teamData.display_name}`);
      const response = await this.client.post('/teams', teamData);
      console.log(`✅ チーム作成成功: ${teamData.display_name}`);
      return response.data;
    } catch (error) {
      const result = this.handleError(error, `チーム作成 (${teamData.name})`);
      if (result.exists) {
        // 既存チームを取得
        try {
          const teamsResponse = await this.client.get('/teams');
          const existingTeam = teamsResponse.data.find(t => t.name === teamData.name);
          if (existingTeam) {
            console.log(`ℹ️  既存チームを使用: ${teamData.display_name}`);
            return existingTeam;
          }
        } catch (searchError) {
          console.error('チーム検索エラー:', searchError.message);
        }
      }
      throw error;
    }
  }

  /**
   * ユーザーをチームに追加
   */
  async addUserToTeam(teamId, userId) {
    try {
      console.log(`➕ ユーザーをチームに追加中...`);
      const response = await this.client.post(`/teams/${teamId}/members`, {
        team_id: teamId,
        user_id: userId
      });
      console.log(`✅ ユーザーをチームに追加成功`);
      return response.data;
    } catch (error) {
      // 既にメンバーの場合はスキップ
      if (error.response && error.response.status === 400) {
        console.log(`ℹ️  ユーザーは既にチームメンバーです`);
        return null;
      }
      return this.handleError(error, 'チームメンバー追加');
    }
  }

  /**
   * チャンネル作成
   */
  async createChannel(channelData) {
    try {
      console.log(`📢 チャンネル作成中: ${channelData.display_name}`);
      const response = await this.client.post('/channels', channelData);
      console.log(`✅ チャンネル作成成功: ${channelData.display_name}`);
      return response.data;
    } catch (error) {
      const result = this.handleError(error, `チャンネル作成 (${channelData.display_name})`);
      if (result.exists) {
        // 既存チャンネルを取得
        try {
          const channelResponse = await this.client.get(`/teams/${channelData.team_id}/channels/name/${channelData.name}`);
          console.log(`ℹ️  既存チャンネルを使用: ${channelData.display_name}`);
          return channelResponse.data;
        } catch (searchError) {
          console.error('チャンネル検索エラー:', searchError.message);
        }
      }
      throw error;
    }
  }

  /**
   * 初期メッセージ投稿
   */
  async postMessage(channelId, message) {
    try {
      const response = await this.client.post('/posts', {
        channel_id: channelId,
        message: message
      });
      console.log(`✅ メッセージ投稿成功`);
      return response.data;
    } catch (error) {
      console.error('メッセージ投稿エラー:', error.message);
      return null;
    }
  }

  /**
   * メインセットアップ処理
   */
  async setup() {
    console.log('🚀 Mattermost テスト環境セットアップを開始します...\n');

    try {
      // 1. 管理者でログイン（既存の管理者アカウントが必要）
      console.log('📋 ステップ 1/5: 管理者ログイン');
      try {
        await this.login(ADMIN_USERNAME, ADMIN_PASSWORD);
        this.adminToken = this.token;
      } catch (error) {
        console.log('⚠️  既存の管理者アカウントが見つかりません。新規ユーザーとして作成します。');
      }

      // 2. テストユーザー作成
      console.log('\n📋 ステップ 2/5: テストユーザー作成');
      const users = [];
      
      // testuser1
      const user1 = await this.createUser({
        email: 'testuser1@example.com',
        username: 'testuser1',
        password: 'Test1234!',
        first_name: 'テスト',
        last_name: 'ユーザー1'
      });
      users.push(user1);

      // testuser2
      const user2 = await this.createUser({
        email: 'testuser2@example.com',
        username: 'testuser2',
        password: 'Test1234!',
        first_name: 'テスト',
        last_name: 'ユーザー2'
      });
      users.push(user2);

      // 管理者ユーザー（まだ作成されていない場合）
      if (!this.adminToken) {
        const adminUser = await this.createUser({
          email: ADMIN_EMAIL,
          username: ADMIN_USERNAME,
          password: ADMIN_PASSWORD,
          first_name: '管理者',
          last_name: 'アカウント'
        });
        users.push(adminUser);
        
        // 最初のユーザーは自動的に管理者になることが多い
        await this.login(ADMIN_USERNAME, ADMIN_PASSWORD);
      }

      // 3. チーム作成
      console.log('\n📋 ステップ 3/5: チーム作成');
      const team = await this.createTeam({
        name: 'myteam',
        display_name: 'マイチーム',
        type: 'O', // Open team
        description: 'テスト用のチーム'
      });

      // 4. ユーザーをチームに追加
      console.log('\n📋 ステップ 4/5: ユーザーをチームに追加');
      for (const user of users) {
        await this.addUserToTeam(team.id, user.id);
      }

      // 5. チャンネル作成
      console.log('\n📋 ステップ 5/5: チャンネル作成');
      const channels = [
        {
          team_id: team.id,
          name: 'sales-team',
          display_name: '営業チーム',
          type: 'O',
          purpose: '営業チームの連絡用チャンネル',
          header: '営業関連の情報共有'
        },
        {
          team_id: team.id,
          name: 'dev-team',
          display_name: '開発チーム',
          type: 'O',
          purpose: '開発チームの連絡用チャンネル',
          header: '開発関連の情報共有'
        },
        {
          team_id: team.id,
          name: 'qa-team',
          display_name: '品質管理',
          type: 'O',
          purpose: '品質管理チームの連絡用チャンネル',
          header: 'QA関連の情報共有'
        }
      ];

      const createdChannels = [];
      for (const channelData of channels) {
        const channel = await this.createChannel(channelData);
        createdChannels.push(channel);
        
        // 初期メッセージを投稿
        await this.postMessage(
          channel.id,
          `🎉 ${channel.display_name}チャンネルへようこそ！このチャンネルは${channelData.purpose}です。`
        );
      }

      // セットアップ完了
      console.log('\n✨ セットアップが完了しました！\n');
      console.log('📌 作成されたリソース:');
      console.log(`  - チーム: ${team.display_name} (${team.name})`);
      console.log('  - ユーザー:');
      console.log('    - testuser1 / Test1234!');
      console.log('    - testuser2 / Test1234!');
      console.log(`    - ${ADMIN_USERNAME} / ${ADMIN_PASSWORD}`);
      console.log('  - チャンネル:');
      createdChannels.forEach(ch => {
        console.log(`    - ${ch.display_name} (#${ch.name})`);
      });
      console.log('\n🎯 これらの認証情報でE2Eテストを実行できます！');

      return {
        team,
        users,
        channels: createdChannels
      };

    } catch (error) {
      console.error('\n❌ セットアップ中にエラーが発生しました:', error.message);
      process.exit(1);
    }
  }
}

// スクリプト実行
async function main() {
  // Mattermostサーバーの起動確認
  console.log(`🔍 Mattermostサーバーの確認中... (${MATTERMOST_URL})`);
  try {
    await axios.get(`${MATTERMOST_URL}/api/v4/system/ping`);
    console.log('✅ Mattermostサーバーが稼働中です\n');
  } catch (error) {
    console.error('❌ Mattermostサーバーに接続できません');
    console.error('  以下を確認してください:');
    console.error('  1. docker-compose up -d でMattermostが起動していること');
    console.error('  2. http://localhost:8065 でアクセスできること');
    console.error(`  3. 環境変数 MATTERMOST_URL が正しいこと (現在: ${MATTERMOST_URL})`);
    process.exit(1);
  }

  // セットアップ実行
  const setup = new MattermostSetup();
  await setup.setup();
}

// エラーハンドリング
process.on('unhandledRejection', (error) => {
  console.error('予期しないエラー:', error);
  process.exit(1);
});

// 実行
if (require.main === module) {
  main();
}

module.exports = MattermostSetup;