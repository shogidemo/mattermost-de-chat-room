import React from 'react';
import {
  CssBaseline,
  ThemeProvider,
  createTheme,
} from '@mui/material';
import { AppProvider, useApp } from './contexts/AppContext';
import LoginForm from './components/screens/LoginForm';
import MainScreen from './components/screens/MainScreen';
import ChatBubble from './components/ui/common/ChatBubble';
import ChannelSelector from './components/ui/channels/ChannelSelector';
import VesselSelectionScreen from './components/screens/VesselSelectionScreen';
import { CircularProgress, Backdrop } from '@mui/material';

// Material-UIテーマ設定
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});


// ルートアプリケーションコンポーネント
const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ThemeProvider>
  );
};

// モック本船データ
const mockVessels = [
  {
    id: 'vessel-1',
    name: 'Pacific Glory',
    callSign: 'VRPG7',
    cargo: '小麦',
    cargoAmount: '50,000トン',
    origin: 'オーストラリア',
    destination: '横浜港',
    status: '航行中',
    eta: '2025-06-25',
    progress: 75,
    icon: '🚢',
    lastUpdate: '2時間前',
  },
  {
    id: 'vessel-2',
    name: 'Ocean Dream',
    callSign: 'JXOD8',
    cargo: '大豆',
    cargoAmount: '30,000トン',
    origin: 'ブラジル',
    destination: '神戸港',
    status: '入港準備中',
    eta: '2025-06-23',
    progress: 95,
    icon: '🛳️',
    lastUpdate: '30分前',
  },
  {
    id: 'vessel-3',
    name: 'Grain Master',
    callSign: 'PHGM9',
    cargo: 'とうもろこし',
    cargoAmount: '40,000トン',
    origin: 'アメリカ',
    destination: '名古屋港',
    status: '荷揚げ中',
    eta: '到着済み',
    progress: 100,
    icon: '⚓',
    lastUpdate: '1時間前',
  },
  {
    id: 'vessel-4',
    name: 'Star Carrier',
    callSign: 'SGSC5',
    cargo: '小麦',
    cargoAmount: '35,000トン',
    origin: 'カナダ',
    destination: '千葉港',
    status: '検査中',
    eta: '到着済み',
    progress: 100,
    icon: '🚢',
    lastUpdate: '3時間前',
  },
  {
    id: 'vessel-5',
    name: 'Blue Horizon',
    callSign: 'PABH2',
    cargo: '大麦',
    cargoAmount: '25,000トン',
    origin: 'ロシア',
    destination: '博多港',
    status: '出港準備中',
    eta: '2025-07-01',
    progress: 10,
    icon: '🛳️',
    lastUpdate: '5時間前',
  },
];

// モックチャンネルデータ（チャット用）
const mockChannels: any[] = [];

// 画面状態の型定義
type ScreenState = 'login' | 'vessel-selection' | 'main';

// 開発モード：ログイン不要でチャット機能をテスト（無効化してMattermost連携）
const DEVELOPMENT_MODE = false; // import.meta.env.DEV;

// アプリケーションコンテンツ（認証状態により切り替え）
const AppContent: React.FC = () => {
  const { state, selectVesselTeam } = useApp();
  const { user, channels: realChannels, currentTeam } = state;
  const [currentScreen, setCurrentScreen] = React.useState<ScreenState>(DEVELOPMENT_MODE ? 'vessel-selection' : 'login');
  const [selectedVessel, setSelectedVessel] = React.useState<typeof mockVessels[0] | null>(null);
  const [showChannelPopup, setShowChannelPopup] = React.useState(false);
  const [mergedChannels, setMergedChannels] = React.useState(DEVELOPMENT_MODE ? mockChannels : []);
  const [selectedChannelId, setSelectedChannelId] = React.useState<string | null>(null);

  // ユーザーログイン状態に基づく画面制御
  React.useEffect(() => {
    if (!DEVELOPMENT_MODE) {
      if (!user) {
        setCurrentScreen('login');
      } else if (currentScreen === 'login') {
        setCurrentScreen('vessel-selection');
      }
    }
  }, [user, currentScreen]);

  // 実チャンネルリストとモックチャンネルリストの統合
  React.useEffect(() => {
    const debugLog = (message: string, data?: any) => {
      if (import.meta.env.DEV) {
        console.log(`[チャンネルリスト統合] ${message}`, data || '');
      }
    };

    const integrateChannelLists = () => {
      // 開発モードの場合はモックチャンネルを使用
      if (DEVELOPMENT_MODE) {
        debugLog('開発モード：モックチャンネルを使用');
        return;
      }
      
      debugLog('チャンネルリスト統合開始', { 
        realChannelsCount: realChannels.length,
        currentTeam: currentTeam?.display_name || currentTeam?.name
      });
      
      if (realChannels.length > 0) {
        debugLog('実チャンネルリスト取得完了', { count: realChannels.length });
        
        // 実際のチャンネル情報をログ出力（デバッグ用）
        realChannels.forEach(channel => {
          console.log(`[実チャンネル情報] ID: ${channel.id}, 名前: ${channel.display_name || channel.name}, タイプ: ${channel.type}`);
        });
        
        // 営業チームチャンネルを探す
        const salesChannel = realChannels.find(ch => 
          (ch.display_name || ch.name).includes('営業') || 
          (ch.display_name || ch.name).includes('sales') ||
          ch.name === 'sales-team'
        );
        
        if (salesChannel) {
          console.log(`[営業チーム発見] ID: ${salesChannel.id}, 名前: ${salesChannel.display_name || salesChannel.name}`);
        } else {
          console.log('[警告] 営業チームチャンネルが見つかりません');
        }
        
        // チャンネルタイプに応じてアイコンを決定
        const getChannelIcon = (channel: any) => {
          switch (channel.type) {
            case 'O': return '🏢'; // オープンチャンネル
            case 'P': return '🔒'; // プライベートチャンネル
            case 'D': return '👤'; // ダイレクトメッセージ
            case 'G': return '👥'; // グループメッセージ
            default: return '💬';
          }
        };

        // 実チャンネルをUIで表示できる形式に変換
        const convertedRealChannels = realChannels.map(channel => ({
          id: channel.id,
          name: channel.display_name || channel.name,
          lastMessage: `${channel.type === 'O' ? 'パブリック' : channel.type === 'P' ? 'プライベート' : 'DM'}チャンネル`,
          timestamp: new Date(channel.last_post_at || channel.create_at).toLocaleString('ja-JP', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          unreadCount: 0,
          icon: getChannelIcon(channel),
          isOnline: true,
        }));

        // Mattermostの実チャンネルのみを使用
        const integrated = [...convertedRealChannels];
        
        console.log('[統合] Mattermostチャンネルのみを表示:', {
          totalChannels: integrated.length,
          channelNames: integrated.map(ch => ch.name)
        });

        setMergedChannels(integrated);
        debugLog('チャンネルリスト統合完了', { 
          total: integrated.length,
          mattermostChannels: convertedRealChannels.length,
          salesChannelFound: !!salesChannel
        });
        
        // チャンネル同期状況の詳細ログ
        console.log('✅ Mattermostとの完全同期完了');
        console.log('📋 同期されたチャンネル:', realChannels.map(ch => ({
          name: ch.display_name || ch.name,
          type: ch.type,
          id: ch.id.substring(0, 8) + '...'
        })));
        
        if (realChannels.length === 0) {
          console.warn('⚠️ Mattermostチャンネルが見つかりません');
          console.log('💡 Mattermostでチャンネルを作成してください');
        }
        
      } else {
        debugLog('Mattermostチャンネルなし、デバッグ情報を確認');
        console.log('🔍 デバッグ情報:', {
          realChannelsCount: realChannels.length,
          currentTeam: currentTeam?.display_name || currentTeam?.name,
          user: user?.username,
          isLoggedIn: !!user
        });
        
        // Mattermostチャンネルがない場合
        if (!user) {
          console.log('ℹ️ 未ログイン状態 - ログインしてください');
          setMergedChannels([]);
        } else {
          console.log('⚠️ ログイン済みだがチャンネルなし - 一時的にモックチャンネルを表示');
          // チャンネル情報が取得されるまで空の配列を設定
          setMergedChannels([]);
        }
      }
    };

    integrateChannelLists();
  }, [realChannels, currentTeam]);

  // 未読メッセージ数を計算
  const totalUnreadCount = mergedChannels.reduce((total, channel) => total + channel.unreadCount, 0);

  const handleChatBubbleClick = () => {
    setShowChannelPopup(true);
  };

  const handleChannelSelect = (channelId: string) => {
    setSelectedChannelId(channelId);
    setCurrentScreen('main');
    console.log(`[チャンネル選択] チャンネルID: ${channelId} が選択されました`);
  };

  const handleVesselSelect = async (vesselId: string) => {
    const vessel = mockVessels.find(v => v.id === vesselId);
    if (vessel) {
      setSelectedVessel(vessel);
      console.log(`[本船選択] 本船: ${vessel.name} が選択されました`);
      
      try {
        // 船舶専用チームに切り替え
        console.log('🚢 船舶専用チームに切り替え開始');
        await selectVesselTeam(vesselId);
        console.log('✅ 船舶専用チーム切り替え完了');
      } catch (error) {
        console.error('❌ 船舶チーム切り替えエラー:', error);
        // エラーが発生してもメイン画面には遷移する
      }
      
      setCurrentScreen('main');
    }
  };

  if (!DEVELOPMENT_MODE && !user) {
    return <LoginForm />;
  }

  // 画面の切り替えロジック
  if (currentScreen === 'vessel-selection') {
    return (
      <VesselSelectionScreen
        vessels={mockVessels}
        onVesselSelect={handleVesselSelect}
      />
    );
  }

  // メイン画面（チャットバブル付き）
  return (
    <>
      <MainScreen onChatClick={handleChatBubbleClick} selectedVessel={selectedVessel} />
      <ChatBubble 
        unreadCount={totalUnreadCount}
        onClick={handleChatBubbleClick}
      />
      <ChannelSelector
        open={showChannelPopup}
        onClose={() => setShowChannelPopup(false)}
        channels={[]} // AppContextから直接取得するため空配列
        initialChannelId={selectedChannelId}
      />
      
      {/* 船舶チーム切り替え中のローディング表示 */}
      <Backdrop
        open={state.isLoading}
        sx={{ 
          color: '#fff', 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          flexDirection: 'column',
          gap: 2
        }}
      >
        <CircularProgress color="inherit" />
        <div style={{ textAlign: 'center' }}>
          <div>船舶チーム準備中...</div>
          {selectedVessel && (
            <div style={{ fontSize: '0.9em', opacity: 0.8 }}>
              {selectedVessel.name} ({selectedVessel.callSign})
            </div>
          )}
        </div>
      </Backdrop>
    </>
  );
};

export default App;
