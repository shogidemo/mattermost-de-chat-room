import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// テストデータ
const testUser = {
  username: 'sho1',
  password: 'sho12345'
};

const vesselTeams = [
  { vesselName: 'Pacific Glory', teamName: 'Pacific Glory チーム', vesselSelector: 'vessel-1' },
  { vesselName: 'Ocean Dream', teamName: 'Ocean Dream チーム', vesselSelector: 'vessel-2' },
  { vesselName: 'Grain Master', teamName: 'Grain Master チーム', vesselSelector: 'vessel-3' },
  { vesselName: 'Star Carrier', teamName: 'Star Carrier チーム', vesselSelector: 'vessel-4' },
  { vesselName: 'Blue Horizon', teamName: 'Blue Horizon チーム', vesselSelector: 'vessel-5' }
];

// スクリーンショット保存ディレクトリを作成
const screenshotDir = path.join(process.cwd(), 'test-results', 'vessel-teams-screenshots');
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

test.describe('船舶チーム機能テスト', () => {
  test('全船舶のチーム切り替えテスト', async ({ page }) => {
    console.log('テスト開始: 全船舶のチーム切り替えテスト');
    
    // アプリケーションにアクセス
    await page.goto('http://localhost:5173');
    console.log('アプリケーションにアクセスしました');

    // ログイン画面のスクリーンショット
    await page.screenshot({ 
      path: path.join(screenshotDir, '00-login-page.png'),
      fullPage: true 
    });

    // ログインフォームが表示されるまで待つ
    await page.waitForSelector('input[name="username"]', { timeout: 10000 });
    console.log('ログインフォームが表示されました');

    // ユーザー名とパスワードを入力
    await page.fill('input[name="username"]', testUser.username);
    await page.fill('input[name="password"]', testUser.password);
    console.log('認証情報を入力しました');

    // 入力後のスクリーンショット
    await page.screenshot({ 
      path: path.join(screenshotDir, '01-login-filled.png'),
      fullPage: true 
    });

    // ログインボタンをクリック
    await page.click('button[type="submit"]');
    console.log('ログインボタンをクリックしました');

    // ログイン完了を待つ（船舶一覧が表示されるまで）
    try {
      await page.waitForSelector('text="Pacific Glory"', { timeout: 15000 });
      console.log('ログイン成功: 船舶一覧が表示されました');
    } catch (error) {
      console.error('ログイン失敗またはタイムアウト');
      await page.screenshot({ 
        path: path.join(screenshotDir, 'login-error.png'),
        fullPage: true 
      });
      throw error;
    }

    // ダッシュボードのスクリーンショット
    await page.screenshot({ 
      path: path.join(screenshotDir, '02-dashboard.png'),
      fullPage: true 
    });

    // 各船舶のテストを実行
    const testResults = [];
    
    for (const vessel of vesselTeams) {
      console.log(`\n${vessel.vesselName} のテスト開始`);
      
      try {
        // 船舶カードを探してクリック
        const vesselCard = page.locator(`text="${vessel.vesselName}"`).first();
        await vesselCard.click();
        await page.waitForTimeout(2000); // 遷移を待つ
        console.log(`${vessel.vesselName} を選択しました`);

        // 船舶選択後のスクリーンショット
        await page.screenshot({ 
          path: path.join(screenshotDir, `${vessel.vesselSelector}-selected.png`),
          fullPage: true 
        });

        // チャットバブルを探してクリック
        const chatButton = page.locator('button[aria-label="チャット"]');
        if (await chatButton.isVisible()) {
          await chatButton.click();
          await page.waitForTimeout(1000); // パネルが開くのを待つ
          console.log('チャットパネルを開きました');
        } else {
          console.log('チャットボタンが見つかりません');
        }

        // チャットパネル表示後のスクリーンショット
        await page.screenshot({ 
          path: path.join(screenshotDir, `${vessel.vesselSelector}-chat-open.png`),
          fullPage: true 
        });

        // チーム名を探す
        let teamNameFound = false;
        let actualTeamName = 'Unknown';
        
        try {
          // チャットパネル内のチーム名を探す
          const teamNameElement = await page.locator('.MuiTypography-root').filter({ hasText: 'チーム' }).first();
          if (await teamNameElement.isVisible()) {
            actualTeamName = await teamNameElement.textContent() || 'Unknown';
            teamNameFound = actualTeamName.includes(vessel.teamName);
            console.log(`チーム名: ${actualTeamName} (期待値: ${vessel.teamName})`);
          }
        } catch (e) {
          console.log('チーム名要素が見つかりません');
        }

        // チャンネル数を確認
        let channelCount = 0;
        try {
          const channelCountText = await page.locator('text=/\\d+\\s*チャンネル/').textContent();
          channelCount = parseInt(channelCountText?.match(/\\d+/)?.[0] || '0');
          console.log(`チャンネル数: ${channelCount}`);
        } catch (e) {
          console.log('チャンネル数が取得できません');
        }

        // テスト結果を記録
        testResults.push({
          vesselName: vessel.vesselName,
          expectedTeam: vessel.teamName,
          actualTeam: actualTeamName,
          teamNameCorrect: teamNameFound,
          channelCount: channelCount,
          status: teamNameFound && channelCount >= 3 ? 'PASS' : 'FAIL',
          screenshotPath: `${vessel.vesselSelector}-chat-open.png`
        });

        // チャットパネルを閉じる
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);

        // ダッシュボードに戻る
        await page.goBack();
        await page.waitForTimeout(1000);
        
      } catch (error) {
        console.error(`${vessel.vesselName} のテストでエラー:`, error);
        testResults.push({
          vesselName: vessel.vesselName,
          expectedTeam: vessel.teamName,
          actualTeam: 'Error',
          teamNameCorrect: false,
          channelCount: 0,
          status: 'ERROR',
          error: error.message,
          screenshotPath: `${vessel.vesselSelector}-error.png`
        });
        
        // エラー時のスクリーンショット
        await page.screenshot({ 
          path: path.join(screenshotDir, `${vessel.vesselSelector}-error.png`),
          fullPage: true 
        });
      }
    }

    // テスト結果をファイルに保存
    const reportPath = path.join(screenshotDir, 'test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      testDate: new Date().toISOString(),
      testUser: testUser.username,
      results: testResults,
      summary: {
        total: testResults.length,
        passed: testResults.filter(r => r.status === 'PASS').length,
        failed: testResults.filter(r => r.status === 'FAIL').length,
        errors: testResults.filter(r => r.status === 'ERROR').length
      }
    }, null, 2));

    console.log('\n=== テスト結果サマリー ===');
    console.log(`総テスト数: ${testResults.length}`);
    console.log(`成功: ${testResults.filter(r => r.status === 'PASS').length}`);
    console.log(`失敗: ${testResults.filter(r => r.status === 'FAIL').length}`);
    console.log(`エラー: ${testResults.filter(r => r.status === 'ERROR').length}`);
    
    // 失敗したテストの詳細
    const failedTests = testResults.filter(r => r.status !== 'PASS');
    if (failedTests.length > 0) {
      console.log('\n失敗したテスト:');
      failedTests.forEach(result => {
        console.log(`- ${result.vesselName}: ${result.actualTeam} (期待値: ${result.expectedTeam})`);
      });
    }

    // 全てのテストが成功したかチェック
    expect(testResults.filter(r => r.status === 'PASS').length).toBe(vesselTeams.length);
  });
});