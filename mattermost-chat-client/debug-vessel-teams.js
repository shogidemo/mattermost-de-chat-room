// 船舶チーム問題診断スクリプト
// ブラウザコンソールで実行: コピー＆ペーストして実行

console.log('🔍 船舶チーム診断開始...\n');

async function diagnoseVesselTeams() {
  // 1. 現在の状態確認
  console.log('1️⃣ 現在の状態:');
  window.mattermostDebug.showCurrentState();
  
  // 2. 全チーム確認
  console.log('\n2️⃣ 全チーム一覧:');
  try {
    const teams = await window.mattermostDebug.getAllTeams();
    console.table(teams.map(t => ({
      name: t.name,
      display_name: t.display_name,
      type: t.type
    })));
    
    // 船舶チームの存在確認
    const vesselTeamNames = [
      'pacific-glory-team',
      'ocean-dream-team',
      'grain-master-team',
      'star-carrier-team',
      'blue-horizon-team'
    ];
    
    const existingVesselTeams = teams.filter(t => vesselTeamNames.includes(t.name));
    const missingVesselTeams = vesselTeamNames.filter(name => 
      !teams.some(t => t.name === name)
    );
    
    console.log('\n📊 船舶チーム状況:');
    console.log('✅ 存在する船舶チーム:', existingVesselTeams.length);
    existingVesselTeams.forEach(t => console.log(`  - ${t.display_name} (${t.name})`));
    
    console.log('❌ 存在しない船舶チーム:', missingVesselTeams.length);
    missingVesselTeams.forEach(name => console.log(`  - ${name}`));
    
  } catch (error) {
    console.error('チーム取得エラー:', error);
  }
  
  // 3. Ocean Dreamチーム切り替えテスト
  console.log('\n3️⃣ Ocean Dreamチーム切り替えテスト:');
  try {
    const result = await window.mattermostDebug.testVesselTeam('vessel-2');
    console.log('✅ 切り替え成功:', result.display_name);
    
    // 切り替え後の状態確認
    setTimeout(() => {
      console.log('\n4️⃣ 切り替え後の状態:');
      window.mattermostDebug.showCurrentState();
    }, 1000);
    
  } catch (error) {
    console.error('❌ 切り替えエラー:', error);
    console.log('エラー詳細:');
    console.log('- メッセージ:', error.message);
    console.log('- スタック:', error.stack);
    
    // エラーメッセージから問題を判断
    if (error.message.includes('権限')) {
      console.log('\n💡 解決策: 管理者にチーム作成権限を付与してもらってください');
    } else if (error.message.includes('存在せず')) {
      console.log('\n💡 解決策: 管理者に船舶チームを作成してもらってください');
    }
  }
  
  // 4. ローカルストレージ確認
  console.log('\n5️⃣ ローカルストレージ:');
  const currentTeam = localStorage.getItem('mattermost_current_team');
  const channels = localStorage.getItem('mattermost_channels');
  
  if (currentTeam) {
    const team = JSON.parse(currentTeam);
    console.log('保存されているチーム:', team.display_name || team.name);
  }
  
  if (channels) {
    const channelList = JSON.parse(channels);
    console.log('保存されているチャンネル数:', channelList.length);
  }
  
  console.log('\n✅ 診断完了');
  console.log('上記の情報を確認して、問題を特定してください。');
}

// 実行
diagnoseVesselTeams();