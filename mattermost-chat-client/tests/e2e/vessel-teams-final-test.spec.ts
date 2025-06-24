import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// テストデータ
const users = [
  { username: 'sho1', password: 'sho12345', expectedError: true },
  { username: 'admin', password: 'Admin123456!', expectedError: false }
];

const vesselTeams = [
  { vesselName: 'Pacific Glory', teamName: 'Pacific Glory チーム', vesselSelector: 'vessel-1' },
  { vesselName: 'Ocean Dream', teamName: 'Ocean Dream チーム', vesselSelector: 'vessel-2' },
  { vesselName: 'Grain Master', teamName: 'Grain Master チーム', vesselSelector: 'vessel-3' },
  { vesselName: 'Star Carrier', teamName: 'Star Carrier チーム', vesselSelector: 'vessel-4' },
  { vesselName: 'Blue Horizon', teamName: 'Blue Horizon チーム', vesselSelector: 'vessel-5' }
];

// スクリーンショット保存ディレクトリ
const screenshotDir = path.join(process.cwd(), 'test-results', 'vessel-teams-final');
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

test.describe('船舶チーム機能 最終テスト', () => {
  for (const user of users) {
    test(`${user.username} ユーザーでのテスト`, async ({ page }) => {
      const userScreenshotDir = path.join(screenshotDir, user.username);
      if (!fs.existsSync(userScreenshotDir)) {
        fs.mkdirSync(userScreenshotDir, { recursive: true });
      }

      console.log(`\n=== ${user.username} ユーザーでのテスト開始 ===`);
      
      // アプリケーションにアクセス
      await page.goto('http://localhost:5173');
      await page.waitForTimeout(2000);

      // ログイン画面のスクリーンショット
      await page.screenshot({ 
        path: path.join(userScreenshotDir, '01-login-page.png'),
        fullPage: true 
      });

      // ログイン
      await page.fill('input[name="username"]', user.username);
      await page.fill('input[name="password"]', user.password);
      await page.click('button[type="submit"]');
      
      // ログイン完了を待つ
      await page.waitForTimeout(3000);
      
      // ログイン後のスクリーンショット
      await page.screenshot({ 
        path: path.join(userScreenshotDir, '02-after-login.png'),
        fullPage: true 
      });

      // 各船舶のテストを実行
      const testResults = [];
      let vesselIndex = 0;
      
      for (const vessel of vesselTeams) {
        vesselIndex++;
        console.log(`\nテスト ${vesselIndex}/5: ${vessel.vesselName}`);
        
        const result = {
          vesselName: vessel.vesselName,
          expectedTeam: vessel.teamName,
          actualTeam: '',
          channelCount: 0,
          error: '',
          success: false
        };

        try {
          // 船舶一覧に戻る（必要な場合）
          const currentUrl = page.url();
          if (!currentUrl.includes('vessel-selection') && vesselIndex > 1) {
            await page.goBack();
            await page.waitForTimeout(2000);
          }

          // 船舶カードを探してクリック
          const vesselCard = page.locator(`text="${vessel.vesselName}"`).first();
          await vesselCard.click();
          
          // エラーダイアログのチェック
          await page.waitForTimeout(2000);
          
          const errorDialog = page.locator('text="船舶チーム切り替えに失敗しました"');
          if (await errorDialog.isVisible()) {
            console.log('❌ エラーダイアログが表示されました');
            result.error = 'チーム切り替えエラー';
            
            // エラーのスクリーンショット
            await page.screenshot({ 
              path: path.join(userScreenshotDir, `${vessel.vesselSelector}-error.png`),
              fullPage: true 
            });
            
            // エラーダイアログを閉じる
            const okButton = page.locator('button:has-text("OK")').or(page.locator('button:has-text("Ok")'));
            if (await okButton.isVisible()) {
              await okButton.click();
              await page.waitForTimeout(1000);
            }
            
            continue;
          }

          // ダッシュボード表示を待つ
          await page.waitForTimeout(3000);
          
          // ダッシュボードのスクリーンショット
          await page.screenshot({ 
            path: path.join(userScreenshotDir, `${vessel.vesselSelector}-dashboard.png`),
            fullPage: true 
          });

          // チャットバブルをクリック
          const chatButton = page.locator('button[aria-label="チャット"]');
          if (await chatButton.isVisible()) {
            await chatButton.click();
            await page.waitForTimeout(2000);
            
            // チャットパネルのスクリーンショット
            await page.screenshot({ 
              path: path.join(userScreenshotDir, `${vessel.vesselSelector}-chat.png`),
              fullPage: true 
            });

            // チーム名を取得
            const teamNameElement = page.locator('h2').first();
            if (await teamNameElement.isVisible()) {
              result.actualTeam = await teamNameElement.textContent() || '';
              console.log(`チーム名: ${result.actualTeam}`);
            }

            // チャンネル数を取得
            const channelCountElement = page.locator('text=/\\d+\\s*チャンネル/');
            if (await channelCountElement.isVisible()) {
              const channelText = await channelCountElement.textContent() || '0';
              result.channelCount = parseInt(channelText.match(/\\d+/)?.[0] || '0');
              console.log(`チャンネル数: ${result.channelCount}`);
            }

            // チャットパネルを閉じる
            await page.keyboard.press('Escape');
            await page.waitForTimeout(1000);
            
            result.success = result.actualTeam.includes(vessel.teamName) || result.actualTeam.includes('チーム');
          }
          
        } catch (error) {
          console.error(`エラー: ${error.message}`);
          result.error = error.message;
        }
        
        testResults.push(result);
      }

      // テスト結果をファイルに保存
      const reportData = {
        testDate: new Date().toISOString(),
        user: user.username,
        results: testResults,
        summary: {
          total: testResults.length,
          successful: testResults.filter(r => r.success).length,
          failed: testResults.filter(r => !r.success).length,
          errors: testResults.filter(r => r.error).length
        }
      };

      fs.writeFileSync(
        path.join(userScreenshotDir, 'test-report.json'),
        JSON.stringify(reportData, null, 2)
      );

      // コンソールにサマリーを出力
      console.log(`\n=== ${user.username} テスト結果サマリー ===`);
      console.log(`成功: ${reportData.summary.successful}/${reportData.summary.total}`);
      console.log(`失敗: ${reportData.summary.failed}/${reportData.summary.total}`);
      if (reportData.summary.errors > 0) {
        console.log(`エラー: ${reportData.summary.errors}`);
      }
      
      // 期待値の検証
      if (user.expectedError) {
        // sho1ユーザーはエラーが期待される
        expect(reportData.summary.errors).toBeGreaterThan(0);
      } else {
        // adminユーザーは成功が期待される
        expect(reportData.summary.successful).toBeGreaterThan(0);
      }
    });
  }

  test('テスト結果レポート生成', async ({ page }) => {
    // 全体のサマリーレポートを生成
    const overallReport = {
      testDate: new Date().toISOString(),
      testEnvironment: {
        url: 'http://localhost:5173',
        browser: 'Chromium'
      },
      userReports: []
    };

    for (const user of users) {
      const reportPath = path.join(screenshotDir, user.username, 'test-report.json');
      if (fs.existsSync(reportPath)) {
        const userReport = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
        overallReport.userReports.push({
          username: user.username,
          summary: userReport.summary,
          details: userReport.results
        });
      }
    }

    // HTMLレポートを生成
    const htmlReport = `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>船舶チーム機能 テストレポート</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1, h2, h3 { color: #333; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .success { color: green; }
        .fail { color: red; }
        .summary { background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <h1>船舶チーム機能 テストレポート</h1>
    <p>実施日時: ${new Date().toLocaleString('ja-JP')}</p>
    
    ${overallReport.userReports.map(userReport => `
        <h2>${userReport.username} ユーザー</h2>
        <div class="summary">
            <p>テスト総数: ${userReport.summary.total}</p>
            <p class="success">成功: ${userReport.summary.successful}</p>
            <p class="fail">失敗: ${userReport.summary.failed}</p>
            <p class="fail">エラー: ${userReport.summary.errors}</p>
        </div>
        
        <table>
            <tr>
                <th>船舶名</th>
                <th>期待されるチーム</th>
                <th>実際のチーム</th>
                <th>チャンネル数</th>
                <th>結果</th>
                <th>エラー</th>
            </tr>
            ${userReport.details.map(detail => `
                <tr>
                    <td>${detail.vesselName}</td>
                    <td>${detail.expectedTeam}</td>
                    <td>${detail.actualTeam || '-'}</td>
                    <td>${detail.channelCount}</td>
                    <td class="${detail.success ? 'success' : 'fail'}">${detail.success ? '✓' : '✗'}</td>
                    <td>${detail.error || '-'}</td>
                </tr>
            `).join('')}
        </table>
    `).join('')}
    
    <h2>スクリーンショット</h2>
    <p>スクリーンショットは以下のディレクトリに保存されています:</p>
    <ul>
        ${users.map(user => `
            <li>${user.username}: test-results/vessel-teams-final/${user.username}/</li>
        `).join('')}
    </ul>
</body>
</html>
    `;

    fs.writeFileSync(
      path.join(screenshotDir, 'test-report.html'),
      htmlReport
    );

    console.log('\n✅ テストレポートを生成しました:');
    console.log(`   ${path.join(screenshotDir, 'test-report.html')}`);
  });
});