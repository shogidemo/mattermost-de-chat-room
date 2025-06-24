/**
 * デバッグヘルパー関数
 */

export const setupGlobalDebugHelpers = () => {
  if (typeof window !== 'undefined') {
    // グローバルデバッグオブジェクトを作成
    (window as any).mattermostDebug = {
      // 現在の状態を表示
      showCurrentState: () => {
        const appState = (window as any).__mattermostAppState;
        if (!appState) {
          console.log('❌ AppStateが見つかりません。アプリケーションが初期化されていない可能性があります。');
          return;
        }
        
        console.log('='.repeat(60));
        console.log('📊 現在のMattermost状態');
        console.log('='.repeat(60));
        console.log('👤 ユーザー:', appState.user?.username || '未ログイン');
        console.log('🏢 現在のチーム:', appState.currentTeam?.display_name || 'なし');
        console.log('📋 チームID:', appState.currentTeam?.id || 'なし');
        console.log('💬 チャンネル数:', appState.channels?.length || 0);
        console.log('🌐 WebSocket状態:', appState.isWebSocketConnected ? '接続中' : '切断');
        console.log('⏳ ローディング中:', appState.isLoading ? 'はい' : 'いいえ');
        console.log('❌ エラー:', appState.error || 'なし');
        console.log('='.repeat(60));
      },

      // 全チームを表示
      getAllTeams: async () => {
        const client = (window as any).__mattermostClient;
        if (!client) {
          console.log('❌ MattermostClientが見つかりません。');
          return;
        }
        
        try {
          const teams = await client.getMyTeams();
          console.log('='.repeat(60));
          console.log('🏢 所属チーム一覧');
          console.log('='.repeat(60));
          teams.forEach((team: any, index: number) => {
            console.log(`${index + 1}. ${team.display_name}`);
            console.log(`   - ID: ${team.id}`);
            console.log(`   - URL名: ${team.name}`);
            console.log(`   - タイプ: ${team.type === 'O' ? '公開' : '招待制'}`);
          });
          console.log('='.repeat(60));
          return teams;
        } catch (error) {
          console.error('❌ チーム取得エラー:', error);
        }
      },

      // 船舶チームテスト
      testVesselTeam: async (vesselId: string) => {
        const selectVesselTeam = (window as any).__selectVesselTeam;
        if (!selectVesselTeam) {
          console.log('❌ selectVesselTeam関数が見つかりません。');
          return;
        }
        
        console.log(`🚢 船舶 ${vesselId} のチーム切り替えテスト開始...`);
        try {
          const team = await selectVesselTeam(vesselId);
          console.log('✅ チーム切り替え成功:', team.display_name);
          return team;
        } catch (error) {
          console.error('❌ チーム切り替え失敗:', error);
          throw error;
        }
      },

      // チャンネル更新
      refreshChannels: async () => {
        const refreshChannels = (window as any).__refreshChannels;
        if (!refreshChannels) {
          console.log('❌ refreshChannels関数が見つかりません。');
          return;
        }
        
        console.log('🔄 チャンネルリスト更新中...');
        await refreshChannels();
        console.log('✅ チャンネルリスト更新完了');
        
        const appState = (window as any).__mattermostAppState;
        console.log(`💬 チャンネル数: ${appState?.channels?.length || 0}`);
      },

      // チーム切り替え履歴
      showTeamHistory: () => {
        const history = (window as any).__teamSwitchHistory || [];
        console.log('='.repeat(60));
        console.log('📜 チーム切り替え履歴');
        console.log('='.repeat(60));
        if (history.length === 0) {
          console.log('履歴なし');
        } else {
          history.forEach((entry: any, index: number) => {
            console.log(`${index + 1}. ${new Date(entry.timestamp).toLocaleTimeString()}`);
            console.log(`   - 操作: ${entry.action}`);
            console.log(`   - チーム: ${entry.teamName}`);
            console.log(`   - 成功: ${entry.success ? '✅' : '❌'}`);
            if (entry.error) {
              console.log(`   - エラー: ${entry.error}`);
            }
          });
        }
        console.log('='.repeat(60));
      }
    };

    console.log('✅ Mattermostデバッグヘルパーが利用可能になりました。');
    console.log('📝 使用可能なコマンド:');
    console.log('  - window.mattermostDebug.showCurrentState()');
    console.log('  - window.mattermostDebug.getAllTeams()');
    console.log('  - window.mattermostDebug.testVesselTeam("vessel-1")');
    console.log('  - window.mattermostDebug.refreshChannels()');
    console.log('  - window.mattermostDebug.showTeamHistory()');
  }
};

// チーム切り替え履歴を記録
export const recordTeamSwitch = (action: string, teamName: string, success: boolean, error?: string) => {
  if (typeof window !== 'undefined') {
    if (!(window as any).__teamSwitchHistory) {
      (window as any).__teamSwitchHistory = [];
    }
    
    (window as any).__teamSwitchHistory.push({
      timestamp: new Date().toISOString(),
      action,
      teamName,
      success,
      error
    });
    
    // 最新の10件のみ保持
    if ((window as any).__teamSwitchHistory.length > 10) {
      (window as any).__teamSwitchHistory.shift();
    }
  }
};