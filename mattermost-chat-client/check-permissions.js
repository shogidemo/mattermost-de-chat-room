// Mattermost権限確認スクリプト
// ブラウザコンソールで実行して、sho1ユーザーの権限を確認

console.log('🔐 権限確認スクリプト開始...\n');

(async () => {
  try {
    // 現在のユーザー情報
    const currentUser = window.__mattermostAppState?.user;
    if (!currentUser) {
      console.error('❌ ユーザー情報が取得できません。ログインしてください。');
      return;
    }
    
    console.log('👤 現在のユーザー:', currentUser.username);
    console.log('ID:', currentUser.id);
    console.log('ロール:', currentUser.roles || '不明');
    
    // チーム一覧を取得して権限を推測
    console.log('\n📋 所属チーム一覧:');
    const teams = await window.mattermostDebug.getAllTeams();
    teams.forEach(team => {
      console.log(`- ${team.display_name} (${team.name})`);
    });
    
    // テスト: 新しいチームを作成できるか（実際には作成しない）
    console.log('\n🧪 権限テスト:');
    
    // 1. チーム作成権限のテスト
    console.log('1. チーム作成権限: ');
    if (currentUser.roles && currentUser.roles.includes('system_admin')) {
      console.log('✅ システム管理者権限あり');
    } else if (teams.length > 1) {
      console.log('⚠️ 一般ユーザー（複数チームに所属）');
      console.log('   → チーム作成には管理者権限が必要かもしれません');
    } else {
      console.log('❌ 権限が制限されている可能性があります');
    }
    
    // 2. 現在のチームでのロール確認
    const currentTeam = window.__mattermostAppState?.currentTeam;
    if (currentTeam) {
      console.log('\n2. 現在のチームでのロール:');
      console.log(`   チーム: ${currentTeam.display_name}`);
      console.log(`   → チーム管理者権限の確認が必要`);
    }
    
    // 推奨事項
    console.log('\n💡 推奨事項:');
    console.log('1. Mattermost管理画面でsho1ユーザーの権限を確認');
    console.log('2. 必要に応じて以下の権限を付与:');
    console.log('   - Create Public Teams（パブリックチーム作成）');
    console.log('   - Create Public Channels（パブリックチャンネル作成）');
    console.log('3. または、管理者が船舶チームを事前に作成');
    
  } catch (error) {
    console.error('❌ 権限確認エラー:', error);
  }
})();