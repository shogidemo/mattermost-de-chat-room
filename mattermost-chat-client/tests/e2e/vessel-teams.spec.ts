import { test, expect } from '@playwright/test';

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

test.describe('船舶チーム機能テスト', () => {
  test.beforeEach(async ({ page }) => {
    // アプリケーションにアクセス
    await page.goto('http://localhost:5173');
    
    // ログイン
    await page.fill('input[name="username"]', testUser.username);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    // ログイン完了を待つ
    await page.waitForSelector('text="ダッシュボード"', { timeout: 10000 });
  });

  // 各船舶のテストを実行
  for (const vessel of vesselTeams) {
    test(`${vessel.vesselName} - チーム切り替えテスト`, async ({ page }) => {
      // テスト開始時のスクリーンショット
      await page.screenshot({ 
        path: `test-results/screenshots/01-${vessel.vesselSelector}-initial.png`,
        fullPage: true 
      });

      // 船舶カードをクリック
      await page.click(`[data-vessel-id="${vessel.vesselSelector}"]`);
      await page.waitForTimeout(1000); // 遷移を待つ

      // 船舶選択後のスクリーンショット
      await page.screenshot({ 
        path: `test-results/screenshots/02-${vessel.vesselSelector}-selected.png`,
        fullPage: true 
      });

      // チャットバブルをクリック
      await page.click('button[aria-label="チャット"]');
      await page.waitForTimeout(1000); // パネルが開くのを待つ

      // チャットパネル表示後のスクリーンショット
      await page.screenshot({ 
        path: `test-results/screenshots/03-${vessel.vesselSelector}-chat-open.png`,
        fullPage: true 
      });

      // チーム名が正しく表示されているか確認
      const teamNameElement = await page.locator('.MuiTypography-root').filter({ hasText: vessel.teamName });
      const isTeamNameVisible = await teamNameElement.isVisible();
      
      // チャンネル数を確認
      const channelCountText = await page.locator('text=/\\d+\\s*チャンネル/').textContent();
      const channelCount = parseInt(channelCountText?.match(/\\d+/)?.[0] || '0');

      // テスト結果を記録
      console.log(`${vessel.vesselName} テスト結果:`);
      console.log(`- チーム名表示: ${isTeamNameVisible ? '✅' : '❌'} (期待値: ${vessel.teamName})`);
      console.log(`- チャンネル数: ${channelCount} (期待値: 3以上)`);
      
      // アサーション
      expect(isTeamNameVisible).toBe(true);
      expect(channelCount).toBeGreaterThanOrEqual(3);

      // チャットパネルを閉じる
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    });
  }

  test('テスト結果サマリー生成', async ({ page }) => {
    // 全テストケースのサマリーを作成
    const summary = {
      testDate: new Date().toISOString(),
      testUser: testUser.username,
      results: vesselTeams.map(vessel => ({
        vesselName: vessel.vesselName,
        expectedTeam: vessel.teamName,
        screenshotPaths: [
          `03-${vessel.vesselSelector}-chat-open.png`
        ]
      }))
    };

    // サマリーをファイルに保存
    const fs = require('fs');
    fs.writeFileSync(
      'test-results/vessel-teams-test-summary.json',
      JSON.stringify(summary, null, 2)
    );
  });
});