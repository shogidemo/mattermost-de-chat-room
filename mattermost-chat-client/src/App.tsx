import React from 'react';
import {
  CssBaseline,
  ThemeProvider,
  createTheme,
} from '@mui/material';
import { AppProvider, useApp } from './contexts/AppContext';
import LoginForm from './components/LoginForm';
import MainScreen from './components/MainScreen';
import ChatBubble from './components/ChatBubble';
import ChannelListPopup from './components/ChannelListPopup';
import ChannelSelectionScreen from './components/ChannelSelectionScreen';

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

// モックチャンネルデータ
const mockChannels = [
  {
    id: 'mhm57ysh9jbj78yyof5cshiu6w',
    name: '営業チーム',
    lastMessage: '明日の会議の件ですが...',
    timestamp: '14:30',
    unreadCount: 3,
    icon: '👥',
    isOnline: true,
  },
  {
    id: '2',
    name: '開発チーム',
    lastMessage: 'バグ修正完了しました',
    timestamp: '12:15',
    unreadCount: 0,
    icon: '💻',
    isOnline: true,
  },
  {
    id: '3',
    name: '品質管理',
    lastMessage: '検査結果を共有します',
    timestamp: '11:45',
    unreadCount: 1,
    icon: '🔍',
    isOnline: false,
  },
  {
    id: '4',
    name: '物流チーム',
    lastMessage: '配送完了報告',
    timestamp: '昨日',
    unreadCount: 0,
    icon: '🚛',
    isOnline: true,
  },
  {
    id: '5',
    name: '佐藤チーム',
    lastMessage: '佐藤さんからの最新アップデート',
    timestamp: '15:45',
    unreadCount: 2,
    icon: '👤',
    isOnline: true,
  },
  {
    id: '6',
    name: '佐藤プロジェクト',
    lastMessage: 'プロジェクト進捗報告',
    timestamp: '13:20',
    unreadCount: 1,
    icon: '📋',
    isOnline: true,
  },
];

// 画面状態の型定義
type ScreenState = 'login' | 'channel-selection' | 'main';

// 開発モード：ログイン不要でチャット機能をテスト（無効化してMattermost連携）
const DEVELOPMENT_MODE = false; // import.meta.env.DEV;

// アプリケーションコンテンツ（認証状態により切り替え）
const AppContent: React.FC = () => {
  const { state } = useApp();
  const { user, channels: realChannels, currentTeam } = state;
  const [currentScreen, setCurrentScreen] = React.useState<ScreenState>(DEVELOPMENT_MODE ? 'channel-selection' : 'login');
  const [showChannelPopup, setShowChannelPopup] = React.useState(false);
  const [mergedChannels, setMergedChannels] = React.useState(DEVELOPMENT_MODE ? mockChannels : []);
  const [selectedChannelId, setSelectedChannelId] = React.useState<string | null>(null);

  // ユーザーログイン状態に基づく画面制御
  React.useEffect(() => {
    if (!DEVELOPMENT_MODE) {
      if (!user) {
        setCurrentScreen('login');
      } else if (currentScreen === 'login') {
        setCurrentScreen('channel-selection');
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
          console.log('⚠️ ログイン済みだがチャンネルなし - Mattermostでチャンネルを作成してください');
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

  if (!DEVELOPMENT_MODE && !user) {
    return <LoginForm />;
  }

  // 画面の切り替えロジック
  if (currentScreen === 'channel-selection') {
    return (
      <ChannelSelectionScreen
        channels={mergedChannels}
        onChannelSelect={handleChannelSelect}
      />
    );
  }

  // メイン画面（チャットバブル付き）
  return (
    <>
      <MainScreen onChatClick={handleChatBubbleClick} />
      <ChatBubble 
        unreadCount={totalUnreadCount}
        onClick={handleChatBubbleClick}
      />
      <ChannelListPopup
        open={showChannelPopup}
        onClose={() => setShowChannelPopup(false)}
        channels={mergedChannels}
        initialChannelId={selectedChannelId}
      />
    </>
  );
};

export default App;
