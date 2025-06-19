import axios from 'axios';

const MATTERMOST_URL = 'http://localhost:8065';

async function setupTestEnvironment() {
  console.log('テスト環境をセットアップしています...\n');
  
  try {
    // 1. システムの状態を確認
    try {
      const pingResponse = await axios.get(`${MATTERMOST_URL}/api/v4/system/ping`);
      console.log('✅ Mattermostサーバーが稼働しています');
    } catch (error) {
      console.error('❌ Mattermostサーバーに接続できません');
      console.error('エラー:', error.message);
      return;
    }
    
    // 2. 設定の確認
    try {
      const configResponse = await axios.get(`${MATTERMOST_URL}/api/v4/config/client`);
      const config = configResponse.data;
      console.log('✅ サインアップ設定:');
      console.log(`  - メールでのサインアップ: ${config.EnableSignUpWithEmail}`);
      console.log(`  - オープンサーバー: ${config.EnableOpenServer}`);
      console.log(`  - ユーザー作成: ${config.EnableUserCreation}`);
    } catch (error) {
      console.log('❌ 設定の取得に失敗しました');
    }
    
    console.log('\n========================================');
    console.log('テスト環境のセットアップ手順:');
    console.log('========================================\n');
    
    console.log('1. Mattermostにアクセス:');
    console.log('   http://localhost:8065');
    console.log('');
    
    console.log('2. 初回アクセスの場合:');
    console.log('   - 管理者アカウントを作成');
    console.log('   - チームを作成（例: "myteam"）');
    console.log('');
    
    console.log('3. ログイン後、以下のチャンネルを作成:');
    console.log('   - 営業チーム (public)');
    console.log('   - 開発チーム (public)');
    console.log('   - 品質管理 (public)');
    console.log('');
    
    console.log('4. テストユーザーを作成:');
    console.log('   a. 左上のメニュー → System Console');
    console.log('   b. User Management → Users → Add User');
    console.log('   c. 以下のユーザーを作成:');
    console.log('      - Email: testuser1@example.com');
    console.log('        Username: testuser1');
    console.log('        Password: Test1234!');
    console.log('      - Email: testuser2@example.com');
    console.log('        Username: testuser2');
    console.log('        Password: Test1234!');
    console.log('');
    
    console.log('5. ユーザーをチームに追加:');
    console.log('   a. Teams → チーム名 → Add Members');
    console.log('   b. testuser1, testuser2 を追加');
    console.log('');
    
    console.log('========================================\n');
    
    // モックチャンネルのテスト用に、アプリでログインできるかテスト
    console.log('アプリケーションのモックチャンネルでテストする場合:');
    console.log('1. http://localhost:5173 にアクセス');
    console.log('2. 任意のユーザー名/パスワードでログイン（例: user1/password1）');
    console.log('3. 開発チーム、営業チーム等のモックチャンネルが利用可能');
    console.log('\n注: 実際のMattermostチャンネルを使用するには、上記の手順で設定が必要です。');
    
  } catch (error) {
    console.error('セットアップ中にエラーが発生しました:', error);
  }
}

// スクリプトの実行
setupTestEnvironment();