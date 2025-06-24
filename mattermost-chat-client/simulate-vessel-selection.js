// 船舶選択シミュレーション
// このスクリプトをブラウザコンソールで実行して、Ocean Dream選択時の動作を確認

console.log('🚢 船舶選択シミュレーション開始...\n');

// 現在の状態を確認
console.log('1️⃣ 現在の状態確認:');
window.mattermostDebug.showCurrentState();

// Ocean Dream選択をシミュレート
console.log('\n2️⃣ Ocean Dream (vessel-2) 選択シミュレーション:');
console.log('実行中...\n');

// handleVesselSelectと同じ処理を実行
(async () => {
  try {
    // selectVesselTeamを直接呼び出し
    const result = await window.mattermostDebug.testVesselTeam('vessel-2');
    
    console.log('\n✅ シミュレーション成功!');
    console.log('選択されたチーム:', result.display_name);
    
    // 2秒後に状態を再確認
    setTimeout(() => {
      console.log('\n3️⃣ 選択後の状態:');
      window.mattermostDebug.showCurrentState();
      
      console.log('\n4️⃣ チャンネル更新:');
      window.mattermostDebug.refreshChannels();
    }, 2000);
    
  } catch (error) {
    console.error('\n❌ シミュレーション失敗!');
    console.error('エラー:', error.message);
    
    // エラーの詳細分析
    console.log('\n📊 エラー分析:');
    
    if (error.message.includes('権限')) {
      console.log('問題: チーム作成権限がありません');
      console.log('解決策: Mattermost管理者にsho1ユーザーへの権限付与を依頼');
    } else if (error.message.includes('存在せず')) {
      console.log('問題: 船舶チームが存在しません');
      console.log('解決策: 以下のチームを管理者に作成してもらう');
      console.log('- ocean-dream-team (Ocean Dream チーム)');
    } else {
      console.log('問題: 不明なエラー');
      console.log('詳細:', error);
    }
    
    // 回避策の提示
    console.log('\n💡 一時的な回避策:');
    console.log('1. Mattermost (http://localhost:8065) に管理者でログイン');
    console.log('2. チーム作成: ocean-dream-team');
    console.log('3. sho1ユーザーをチームに追加');
    console.log('4. デフォルトチャンネルを作成');
  }
})();