// 船舶チーム切り替え問題診断スクリプト
// ブラウザコンソールで実行してください

console.log('=== 船舶チーム切り替え問題診断開始 ===');

// 1. 現在の状態を確認
console.log('\n1. 現在の状態:');
window.mattermostDebug.showCurrentState();

// 2. 全チーム一覧を取得
console.log('\n2. 全チーム一覧を取得中...');
window.mattermostDebug.getAllTeams().then(teams => {
    console.log('取得したチーム:');
    teams.forEach(team => {
        console.log(`  - ${team.display_name} (${team.name})`);
    });
    
    // 船舶チームが存在するか確認
    const vesselTeams = teams.filter(team => 
        team.name.includes('-team') && 
        !team.name.includes('test')
    );
    
    if (vesselTeams.length > 0) {
        console.log('\n✅ 船舶チームが見つかりました:');
        vesselTeams.forEach(team => {
            console.log(`  - ${team.display_name}`);
        });
    } else {
        console.log('\n❌ 船舶チームが見つかりません');
        console.log('💡 管理者に船舶チームの作成を依頼してください');
    }
}).catch(error => {
    console.error('チーム取得エラー:', error);
});

// 3. Pacific Gloryチームへの切り替えテスト
console.log('\n3. Pacific Gloryチームへの切り替えテスト...');
window.mattermostDebug.testVesselTeam('vessel-1').then(result => {
    console.log('✅ チーム切り替え成功:', result.display_name);
    
    // チャンネル確認
    setTimeout(() => {
        console.log('\n4. チャンネル確認:');
        window.mattermostDebug.showCurrentState();
    }, 2000);
}).catch(error => {
    console.error('❌ チーム切り替えエラー:', error);
    console.log('エラー詳細:', error.message);
    
    if (error.message.includes('権限')) {
        console.log('💡 チーム作成権限がありません。管理者に依頼してください。');
    }
});

// 5. デバッグ情報収集
console.log('\n=== デバッグ情報 ===');
console.log('ローカルストレージ:');
console.log('- current_team:', localStorage.getItem('mattermost_current_team'));
console.log('- channels:', localStorage.getItem('mattermost_channels'));

console.log('\nブラウザ情報:');
console.log('- User Agent:', navigator.userAgent);
console.log('- Cookie Enabled:', navigator.cookieEnabled);

console.log('\n診断完了。上記の情報を確認してください。');