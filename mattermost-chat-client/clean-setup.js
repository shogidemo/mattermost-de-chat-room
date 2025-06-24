import axios from 'axios';
import { chromium } from 'playwright';

const API_URL = 'http://localhost:8065/api/v4';
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'Admin123456!';

// 船舶チーム情報
const VESSEL_TEAMS = [
  { id: 'vessel-1', teamName: 'pacific-glory-team', displayName: 'Pacific Glory チーム' },
  { id: 'vessel-2', teamName: 'ocean-dream-team', displayName: 'Ocean Dream チーム' },
  { id: 'vessel-3', teamName: 'grain-master-team', displayName: 'Grain Master チーム' },
  { id: 'vessel-4', teamName: 'star-carrier-team', displayName: 'Star Carrier チーム' },
  { id: 'vessel-5', teamName: 'blue-horizon-team', displayName: 'Blue Horizon チーム' },
];

// デフォルトチャンネル
const DEFAULT_CHANNELS = [
  { name: 'general', display_name: '一般', purpose: '日常的な連絡・情報共有' },
  { name: 'operations', display_name: '運航管理', purpose: '運航に関する情報・指示' },
  { name: 'maintenance', display_name: '保守・整備', purpose: '船舶の保守・整備情報' },
];

async function setupMattermost() {
  console.log('🚀 Mattermostクリーンセットアップを開始します...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. 初期セットアップページにアクセス
    console.log('1. 初期セットアップページにアクセス...');
    await page.goto('http://localhost:8065');
    await page.waitForLoadState('networkidle');

    // 管理者アカウント作成画面が表示されるか確認
    const isFirstTimeSetup = await page.locator('text=Create Admin Account').count() > 0 || 
                             await page.locator('text=管理者アカウント').count() > 0;

    if (isFirstTimeSetup) {
      console.log('2. 管理者アカウントを作成...');
      
      // フォームに入力
      await page.fill('input[placeholder*="Email"], input[name="email"]', ADMIN_EMAIL);
      await page.fill('input[placeholder*="Username"], input[name="username"]', ADMIN_USERNAME);
      await page.fill('input[placeholder*="Password"], input[name="password"]', ADMIN_PASSWORD);
      
      // 次へボタンをクリック
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
      
      // チーム作成画面
      console.log('3. 初期チームを作成...');
      const teamNameInput = await page.locator('input[placeholder*="Team Name"], input[name="teamName"]').first();
      if (await teamNameInput.count() > 0) {
        await teamNameInput.fill('Default Team');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(2000);
      }
      
      // セットアップ完了
      console.log('✅ 初期セットアップ完了！');
    } else {
      console.log('ℹ️ 既に初期セットアップ済みです');
    }

    // ブラウザを閉じる
    await browser.close();

    // API経由でのセットアップを続行
    console.log('\n4. API経由でのセットアップを開始...');
    
    // 管理者でログイン
    const loginResponse = await axios.post(`${API_URL}/users/login`, {
      login_id: ADMIN_USERNAME,
      password: ADMIN_PASSWORD,
    });
    
    const token = loginResponse.headers.token;
    const adminUserId = loginResponse.data.id;
    console.log('✅ 管理者でログイン成功');
    
    // Axiosインスタンスを作成
    const api = axios.create({
      baseURL: API_URL,
      headers: { Authorization: `Bearer ${token}` },
    });

    // 5. sho1ユーザーを作成
    console.log('\n5. sho1ユーザーを作成...');
    try {
      const sho1Response = await api.post('/users', {
        email: 'sho1@example.com',
        username: 'sho1',
        password: 'sho12345',
      });
      console.log('✅ sho1ユーザー作成成功');
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('ℹ️ sho1ユーザーは既に存在します');
      } else {
        console.error('❌ sho1ユーザー作成エラー:', error.response?.data?.message);
      }
    }

    // sho1のIDを取得
    const sho1Response = await api.get('/users/username/sho1');
    const sho1UserId = sho1Response.data.id;

    // 6. 船舶チームを作成
    console.log('\n6. 船舶チームを作成...');
    const createdTeams = [];
    
    for (const vessel of VESSEL_TEAMS) {
      console.log(`\n  ${vessel.displayName} を作成中...`);
      
      try {
        const teamResponse = await api.post('/teams', {
          name: vessel.teamName,
          display_name: vessel.displayName,
          type: 'O', // Open team
          description: `${vessel.displayName}の船舶運航管理チーム`,
        });
        
        const teamId = teamResponse.data.id;
        createdTeams.push({ ...vessel, teamId });
        console.log(`  ✅ チーム作成成功 (ID: ${teamId})`);
        
        // sho1をメンバーに追加
        await api.post(`/teams/${teamId}/members`, {
          team_id: teamId,
          user_id: sho1UserId,
        });
        console.log(`  ✅ sho1をメンバーに追加`);
        
        // デフォルトチャンネルを作成
        console.log(`  チャンネルを作成中...`);
        for (const channel of DEFAULT_CHANNELS) {
          try {
            const channelResponse = await api.post('/channels', {
              team_id: teamId,
              name: channel.name,
              display_name: channel.display_name,
              purpose: channel.purpose,
              type: 'O',
            });
            console.log(`    ✅ ${channel.display_name}`);
          } catch (error) {
            console.error(`    ❌ ${channel.display_name}: ${error.response?.data?.message}`);
          }
        }
        
      } catch (error) {
        console.error(`  ❌ エラー: ${error.response?.data?.message}`);
      }
    }

    console.log('\n✅ セットアップ完了！');
    console.log('\n以下の情報でログインできます:');
    console.log('- 管理者: admin / Admin123456!');
    console.log('- 一般ユーザー: sho1 / sho12345');
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
    await browser.close();
  }
}

setupMattermost();