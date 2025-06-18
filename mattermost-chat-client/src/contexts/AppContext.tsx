import React, { createContext, useContext, useReducer, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import MattermostClient from '../api/mattermost';
import type { AppState, User, Team, Channel, Post, WebSocketEvent } from '../types/mattermost';

// ローカルストレージからメッセージを復元
const restorePostsFromStorage = (): Record<string, Post[]> => {
  try {
    const savedPosts = localStorage.getItem('mattermost_posts');
    return savedPosts ? JSON.parse(savedPosts) : {};
  } catch (error) {
    console.error('メッセージの復元に失敗:', error);
    return {};
  }
};

// ローカルストレージにメッセージを保存
const savePostsToStorage = (posts: Record<string, Post[]>): void => {
  try {
    localStorage.setItem('mattermost_posts', JSON.stringify(posts));
  } catch (error) {
    console.error('メッセージの保存に失敗:', error);
  }
};

// ローカルストレージからチャンネルを復元
const restoreChannelsFromStorage = (): Channel[] => {
  try {
    const savedChannels = localStorage.getItem('mattermost_channels');
    return savedChannels ? JSON.parse(savedChannels) : [];
  } catch (error) {
    console.error('チャンネルの復元に失敗:', error);
    return [];
  }
};

// ローカルストレージにチャンネルを保存
const saveChannelsToStorage = (channels: Channel[]): void => {
  try {
    localStorage.setItem('mattermost_channels', JSON.stringify(channels));
    console.log('💾 チャンネルリストをローカルストレージに保存:', channels.length);
  } catch (error) {
    console.error('チャンネルの保存に失敗:', error);
  }
};

// ローカルストレージから現在のチーム・チャンネルを復元
const restoreCurrentSelectionFromStorage = (): { team: Team | null; channel: Channel | null } => {
  try {
    const savedTeam = localStorage.getItem('mattermost_current_team');
    const savedChannel = localStorage.getItem('mattermost_current_channel');
    return {
      team: savedTeam ? JSON.parse(savedTeam) : null,
      channel: savedChannel ? JSON.parse(savedChannel) : null
    };
  } catch (error) {
    console.error('現在の選択の復元に失敗:', error);
    return { team: null, channel: null };
  }
};

// ローカルストレージに現在のチーム・チャンネルを保存
const saveCurrentSelectionToStorage = (team: Team | null, channel: Channel | null): void => {
  try {
    if (team) {
      localStorage.setItem('mattermost_current_team', JSON.stringify(team));
    }
    if (channel) {
      localStorage.setItem('mattermost_current_channel', JSON.stringify(channel));
    }
  } catch (error) {
    console.error('現在の選択の保存に失敗:', error);
  }
};

// localStorage内容の確認（デバッグ用）
const debugLocalStorage = () => {
  console.log('🗄️ localStorage確認:');
  console.log('- mattermost_channels:', localStorage.getItem('mattermost_channels'));
  console.log('- mattermost_current_team:', localStorage.getItem('mattermost_current_team'));
  console.log('- mattermost_current_channel:', localStorage.getItem('mattermost_current_channel'));
  console.log('- mattermost_posts keys:', Object.keys(restorePostsFromStorage()));
};

// アプリケーション状態の初期値
const getInitialState = (): AppState => {
  debugLocalStorage();
  const restoredSelection = restoreCurrentSelectionFromStorage();
  const restoredChannels = restoreChannelsFromStorage();
  
  console.log('🔄 初期状態復元:', {
    restoredChannelsCount: restoredChannels.length,
    restoredTeam: restoredSelection.team?.display_name || restoredSelection.team?.name,
    restoredChannel: restoredSelection.channel?.display_name || restoredSelection.channel?.name
  });
  
  return {
    user: null,
    currentTeam: restoredSelection.team,
    currentChannel: restoredSelection.channel,
    channels: restoredChannels,
    posts: restorePostsFromStorage(),
    users: {}, // ユーザー情報キャッシュを初期化
    isLoading: false,
    error: null,
    isConnected: false,
  };
};

const initialState: AppState = getInitialState();

// アクションタイプの定義
type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_CURRENT_TEAM'; payload: Team | null }
  | { type: 'SET_CURRENT_CHANNEL'; payload: Channel | null }
  | { type: 'SET_CHANNELS'; payload: Channel[] }
  | { type: 'SET_POSTS'; payload: { channelId: string; posts: Post[] } }
  | { type: 'ADD_POST'; payload: { channelId: string; post: Post } }
  | { type: 'UPDATE_POST'; payload: { channelId: string; post: Post } }
  | { type: 'DELETE_POST'; payload: { channelId: string; postId: string } }
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'CACHE_USER'; payload: User }
  | { type: 'CACHE_USERS'; payload: User[] };

// リデューサー関数
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_CURRENT_TEAM': {
      const newState = { ...state, currentTeam: action.payload };
      saveCurrentSelectionToStorage(action.payload, state.currentChannel);
      return newState;
    }
    case 'SET_CURRENT_CHANNEL': {
      const newState = { ...state, currentChannel: action.payload };
      saveCurrentSelectionToStorage(state.currentTeam, action.payload);
      return newState;
    }
    case 'SET_CHANNELS': {
      saveChannelsToStorage(action.payload);
      return { ...state, channels: action.payload };
    }
    case 'SET_POSTS': {
      const newPostsForSetPosts = {
        ...state.posts,
        [action.payload.channelId]: action.payload.posts,
      };
      savePostsToStorage(newPostsForSetPosts);
      return {
        ...state,
        posts: newPostsForSetPosts,
      };
    }
    case 'ADD_POST': {
      const existingPosts = state.posts[action.payload.channelId] || [];
      const newPostsForAddPost = {
        ...state.posts,
        [action.payload.channelId]: [...existingPosts, action.payload.post],
      };
      savePostsToStorage(newPostsForAddPost);
      return {
        ...state,
        posts: newPostsForAddPost,
      };
    }
    case 'UPDATE_POST': {
      const channelPosts = state.posts[action.payload.channelId] || [];
      const updatedPosts = channelPosts.map(post =>
        post.id === action.payload.post.id ? action.payload.post : post
      );
      const newPostsForUpdatePost = {
        ...state.posts,
        [action.payload.channelId]: updatedPosts,
      };
      savePostsToStorage(newPostsForUpdatePost);
      return {
        ...state,
        posts: newPostsForUpdatePost,
      };
    }
    case 'DELETE_POST': {
      const filteredPosts = (state.posts[action.payload.channelId] || []).filter(
        post => post.id !== action.payload.postId
      );
      const newPostsForDeletePost = {
        ...state.posts,
        [action.payload.channelId]: filteredPosts,
      };
      savePostsToStorage(newPostsForDeletePost);
      return {
        ...state,
        posts: newPostsForDeletePost,
      };
    }
    case 'SET_CONNECTED':
      return { ...state, isConnected: action.payload };
    case 'CACHE_USER':
      return {
        ...state,
        users: {
          ...state.users,
          [action.payload.id]: action.payload,
        },
      };
    case 'CACHE_USERS': {
      const newUsers = { ...state.users };
      action.payload.forEach(user => {
        newUsers[user.id] = user;
      });
      return {
        ...state,
        users: newUsers,
      };
    }
    default:
      return state;
  }
}

// コンテキストの型定義
interface AppContextType {
  state: AppState;
  client: MattermostClient;
  dispatch: React.Dispatch<AppAction>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  selectTeam: (team: Team) => Promise<void>;
  selectChannel: (channel: Channel) => Promise<void>;
  sendMessage: (message: string, rootId?: string) => Promise<void>;
  loadChannelPosts: (channelId: string) => Promise<void>;
  refreshChannels: () => Promise<void>;
  getUserInfo: (userId: string) => Promise<User>;
  getUserDisplayName: (userId: string) => string;
}

// コンテキストの作成
const AppContext = createContext<AppContextType | null>(null);

// プロバイダーコンポーネント
interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const client = useMemo(() => new MattermostClient(), []);
  
  // グローバル状態へのアクセスを提供（ポーリング用）
  React.useEffect(() => {
    (window as any).__mattermostAppState = state;
    return () => {
      delete (window as any).__mattermostAppState;
    };
  }, [state]);

  // セッション復元の試行（1回のみ実行）
  useEffect(() => {
    const user = client.restoreSession();
    if (user) {
      dispatch({ type: 'SET_USER', payload: user });
      
      // 認証確認後にWebSocket接続を試行
      const initializeConnection = async () => {
        try {
          console.log('🔄 セッション復元後のWebSocket接続初期化開始');
          
          // 認証状態を確認
          const currentUser = await client.getCurrentUser();
          console.log('✅ セッション復元認証確認成功:', currentUser.username);
          
          // WebSocket接続を強制実行
          console.log('🔌 セッション復元後WebSocket接続試行開始...');
          console.log('🔍 セッション復元時の認証状態:', {
            hasToken: !!client.getToken(),
            tokenType: client.getToken() === 'session-based' ? 'session' : 'bearer',
            isAuthenticated: client.isAuthenticated()
          });
          
          await connectWebSocket();
          console.log('✅ セッション復元後WebSocket接続成功');
        } catch (error) {
          console.error('❌ セッション復元WebSocket接続エラー詳細:', {
            message: (error as any)?.message,
            stack: (error as any)?.stack,
            name: (error as any)?.name
          });
          console.warn('⚠️ セッション復元時認証確認失敗またはWebSocket接続失敗 - ポーリングにフォールバック');
          // 認証失敗時はWebSocketをスキップしてポーリングのみ使用
          startMessagePolling();
        }
      };
      
      initializeConnection();
      
      // セッション復元時に自動でチーム・チャンネル情報を取得
      const initializeUserData = async () => {
        try {
          console.log('🔄 セッション復元後の初期化開始');
          
          // ユーザーの所属チームを取得
          const teams = await client.getTeamsForUser(user.id);
          console.log('📋 取得したチーム一覧:', teams.map(t => ({id: t.id, name: t.display_name || t.name})));
          
          if (teams.length > 0) {
            console.log('✅ チーム取得完了:', teams.length);
            
            // 既存のチーム選択があるかチェック
            const savedTeam = state.currentTeam && teams.find(t => t.id === state.currentTeam!.id);
            const teamToSelect = savedTeam || teams[0];
            
            console.log('🔄 セッション復元時のチーム選択:', {
              savedTeam: state.currentTeam?.display_name || state.currentTeam?.name,
              selectedTeam: teamToSelect.display_name || teamToSelect.name,
              savedChannelsCount: state.channels.length
            });
            
            // 保存されたチャンネルがある場合はそれを使用、なければAPIから取得
            if (state.channels.length > 0 && savedTeam) {
              console.log('💾 保存されたチャンネルリストを使用:', state.channels.length);
              console.log('📋 保存されたチャンネル詳細:', state.channels.map(ch => ({
                name: ch.display_name || ch.name,
                id: ch.id.substring(0, 8) + '...',
                type: ch.type
              })));
              
              // 現在のチャンネル選択も復元
              if (state.currentChannel) {
                console.log('🏠 保存されたチャンネル選択を復元:', state.currentChannel.display_name || state.currentChannel.name);
              }
            } else {
              console.log('🔄 APIからチャンネル取得が必要');
              // 全チームのチャンネルを取得
              await selectTeam(teamToSelect);
              console.log('🏠 チーム選択完了:', teamToSelect.display_name || teamToSelect.name);
            }
          } else {
            console.warn('⚠️ ユーザーが所属するチームがありません');
          }
        } catch (error) {
          console.error('❌ セッション復元後の初期化エラー:', error);
          // エラーが発生してもアプリは継続動作
        }
      };
      
      initializeUserData();
    }
  }, []); // 依存配列を空にして1回のみ実行

  // ポーリング重複防止用のフラグ
  const pollingActiveRef = React.useRef(false);
  const pollingIntervalRef = React.useRef<number | null>(null);
  const pollingStoppingRef = React.useRef(false); // ポーリング停止中フラグを追加

  // メッセージポーリング機能
  const startMessagePolling = React.useCallback(() => {
    // ポーリング停止処理中の場合は開始を遅延
    if (pollingStoppingRef.current) {
      console.log('⏳ ポーリング停止中 - 開始を遅延');
      setTimeout(() => startMessagePolling(), 200);
      return;
    }
    
    // 既にポーリングが動作中の場合は何もしない
    if (pollingActiveRef.current || pollingIntervalRef.current) {
      console.log('🚫 ポーリング既に動作中 - 重複開始を防止');
      return;
    }
    
    // 既存のポーリングを確実に停止
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if ((window as any).stopMessagePolling) {
      (window as any).stopMessagePolling();
    }
    
    pollingActiveRef.current = true;
    console.log('📨 メッセージポーリング開始（2秒間隔）');
    
    const pollMessages = async () => {
      // 現在の状態を取得（クロージャの問題を回避）
      const currentState = (window as any).__mattermostAppState || state;
      try {
        if (currentState.currentChannel && currentState.user) {
          // 現在のチャンネルの最新メッセージを取得
          const response = await client.getPostsForChannel(currentState.currentChannel.id, 0, 30);
          const latestPosts = response.order.map(postId => response.posts[postId]);
          
          // 既存のメッセージと比較
          const existingPosts = currentState.posts[currentState.currentChannel.id] || [];
          const existingPostIds = new Set(existingPosts.map((p: Post) => p.id));
          
          // 新しいメッセージを抽出
          const newPosts = latestPosts.filter(post => !existingPostIds.has(post.id));
          
          // 削除されたメッセージを検出
          const latestPostIds = new Set(latestPosts.map((p: Post) => p.id));
          const deletedPosts = existingPosts.filter((post: Post) => !latestPostIds.has(post.id));
          
          if (newPosts.length > 0 || deletedPosts.length > 0) {
            console.log('📨 ポーリング: 変更を検出', {
              新規: newPosts.length,
              削除: deletedPosts.length
            });
            
            // 完全なメッセージリストを設定（全体を更新）
            dispatch({
              type: 'SET_POSTS',
              payload: { 
                channelId: currentState.currentChannel.id, 
                posts: latestPosts.sort((a, b) => a.create_at - b.create_at)
              },
            });
          }
        }
      } catch (error) {
        console.error('❌ ポーリングエラー:', error);
      }
    };

    // 初回実行
    pollMessages();
    
    // 2秒間隔でポーリング
    pollingIntervalRef.current = setInterval(pollMessages, 2000);
    
    // クリーンアップ関数を保存
    (window as any).stopMessagePolling = () => {
      console.log('⏹️ メッセージポーリング停止');
      pollingStoppingRef.current = true;
      pollingActiveRef.current = false;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      delete (window as any).stopMessagePolling;
      // 停止処理完了を示すため少し遅延
      setTimeout(() => {
        pollingStoppingRef.current = false;
      }, 100);
    };
    
    return pollingIntervalRef.current;
  }, [client]); // 依存関係を最小化してcallbackの再生成を防ぐ

  // WebSocket接続
  const connectWebSocket = async () => {
    try {
      console.log('🔌 [DETAILED] AppContext.connectWebSocket: WebSocket接続試行開始');
      console.log('🔍 [DETAILED] 現在の認証状態:', {
        hasToken: !!client.getToken(),
        token: client.getToken(),
        tokenType: client.getToken() === 'session-based' ? 'session' : 'bearer',
        isAuthenticated: client.isAuthenticated(),
        currentUser: state.user?.username || 'unknown'
      });
      
      console.log('📞 [DETAILED] client.connectWebSocket() 呼び出し開始...');
      await client.connectWebSocket();
      console.log('✅ [DETAILED] AppContext.connectWebSocket: WebSocket接続成功');
      dispatch({ type: 'SET_CONNECTED', payload: true });
      
      // WebSocket成功時はポーリング停止
      if ((window as any).stopMessagePolling) {
        (window as any).stopMessagePolling();
      }
      
      // WebSocketイベントハンドラーの設定
      setupWebSocketHandlers();
    } catch (error) {
      console.error('❌ AppContext.connectWebSocket: WebSocket接続エラー詳細:', {
        error: error,
        message: (error as any)?.message,
        stack: (error as any)?.stack,
        name: (error as any)?.name
      });
      dispatch({ type: 'SET_CONNECTED', payload: false });
      
      // WebSocket接続失敗時はポーリングにフォールバック
      console.log('🔄 AppContext.connectWebSocket: WebSocket接続失敗 - ポーリング機能を開始します');
      startMessagePolling();
      
      // 認証エラーの場合は再ログインが必要
      if (error instanceof Error && error.message && error.message.includes('authentication')) {
        console.error('🔑 認証エラーによりWebSocket接続失敗');
        dispatch({ type: 'SET_ERROR', payload: '認証が必要です。再ログインしてください。' });
      }
    }
  };

  // WebSocketイベントハンドラーの設定
  const setupWebSocketHandlers = () => {
    console.log('🔧 WebSocketイベントハンドラー設定開始');
    
    // 新しい投稿の受信
    client.onWebSocketEvent('posted', (event: WebSocketEvent) => {
      try {
        console.log('📨 WebSocketイベント受信 (posted):', event);
        console.log('📊 イベントデータ構造:', {
          hasData: !!event.data,
          dataKeys: event.data ? Object.keys(event.data) : [],
          dataType: typeof event.data,
          rawData: event.data
        });
        
        // postデータの取得を試行
        let post;
        if (event.data && typeof event.data.post === 'string') {
          post = JSON.parse(event.data.post);
          console.log('📝 文字列からpostをパース成功');
        } else if (event.data && event.data.post && typeof event.data.post === 'object') {
          post = event.data.post;
          console.log('📝 postオブジェクトを直接使用');
        } else {
          console.error('❌ postデータが見つかりません:', event.data);
          return;
        }
        
        console.log('📨 Mattermostから新しい投稿受信:', { 
          channelId: post.channel_id, 
          message: post.message,
          userId: post.user_id,
          postId: post.id,
          timestamp: new Date(post.create_at).toLocaleString(),
          currentChannelId: state.currentChannel?.id
        });
        
        // 現在表示中のチャンネルの場合は即座に表示更新
        if (post.channel_id === state.currentChannel?.id) {
          console.log('✅ 現在のチャンネルのメッセージ - 即座に表示更新');
        } else {
          console.log('📂 他のチャンネルのメッセージ - バックグラウンド保存');
        }
        
        dispatch({
          type: 'ADD_POST',
          payload: { channelId: post.channel_id, post },
        });
      } catch (error) {
        console.error('❌ 投稿イベント処理エラー:', error);
        console.error('❌ イベントデータ:', event);
        console.error('❌ エラースタック:', (error as Error).stack);
      }
    });

    // 投稿の更新
    client.onWebSocketEvent('post_edited', (event: WebSocketEvent) => {
      try {
        const post = JSON.parse(event.data.post);
        console.log('✏️ 投稿更新受信:', { channelId: post.channel_id, postId: post.id });
        
        dispatch({
          type: 'UPDATE_POST',
          payload: { channelId: post.channel_id, post },
        });
      } catch (error) {
        console.error('❌ 投稿更新イベント処理エラー:', error);
      }
    });

    // 投稿の削除
    client.onWebSocketEvent('post_deleted', (event: WebSocketEvent) => {
      try {
        const post = JSON.parse(event.data.post);
        console.log('🗑️ 投稿削除受信:', { channelId: post.channel_id, postId: post.id });
        
        dispatch({
          type: 'DELETE_POST',
          payload: { channelId: post.channel_id, postId: post.id },
        });
      } catch (error) {
        console.error('❌ 投稿削除イベント処理エラー:', error);
      }
    });

    // チャンネル参加/退出イベント
    client.onWebSocketEvent('channel_viewed', (event: WebSocketEvent) => {
      console.log('👁️ チャンネル閲覧イベント:', event.data);
    });

    // ユーザーの入退室など他のイベント
    client.onWebSocketEvent('user_added', (event: WebSocketEvent) => {
      console.log('👤 ユーザー追加イベント:', event.data);
    });

    // すべてのWebSocketイベントをログ出力（デバッグ用）
    client.onWebSocketEvent('*', (event: WebSocketEvent) => {
      console.log('🔔 WebSocketイベント:', { 
        type: event.event, 
        seq: event.seq,
        broadcast: event.broadcast,
        hasData: !!event.data,
        dataKeys: event.data ? Object.keys(event.data) : [],
        eventData: event
      });
      
      // 特定のイベントタイプの詳細ログ
      if (event.event === 'posted' || event.event === 'post_edited' || event.event === 'post_deleted') {
        console.log('📮 投稿関連イベント詳細:', {
          eventType: event.event,
          channelId: event.broadcast?.channel_id,
          userId: event.broadcast?.user_id,
          dataStructure: event.data
        });
      }
    });

    console.log('✅ WebSocketイベントハンドラー設定完了');
  };

  // ログイン処理
  const login = async (username: string, password: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const loginResponse = await client.login({
        login_id: username,
        password,
      });

      dispatch({ type: 'SET_USER', payload: loginResponse.user });
      
      // ログイン成功後にWebSocket接続を強制実行
      console.log('📋 [FORCE] ログイン成功 - WebSocket接続を強制実行', {
        hasToken: !!client.getToken(),
        tokenType: client.getToken() === 'session-based' ? 'session' : 'bearer',
        isAuthenticated: client.isAuthenticated(),
        userId: loginResponse.user.id,
        username: loginResponse.user.username
      });
      
      // 少し待ってからWebSocket接続を確実に実行
      setTimeout(async () => {
        console.log('🔌 [FORCE] ログイン後WebSocket接続を遅延実行開始');
        try {
          await connectWebSocket();
          console.log('✅ [FORCE] ログイン後WebSocket接続成功');
        } catch (error) {
          console.error('❌ [FORCE] ログイン後WebSocket接続失敗:', error);
          console.warn('⚠️ WebSocket接続に失敗しましたが、HTTP APIでチャット機能は利用可能です');
          // WebSocket失敗時は即座にポーリング開始
          console.log('🔄 WebSocket失敗のため、即座にポーリング開始');
          const startFallbackPolling = async () => {
            if ((window as any).stopMessagePolling) {
              (window as any).stopMessagePolling();
            }
            await new Promise(resolve => setTimeout(resolve, 200));
            pollingActiveRef.current = false;
            pollingIntervalRef.current = null;
            startMessagePolling();
          };
          startFallbackPolling();
        }
      }, 1000); // 1秒後に実行

      // ユーザーの所属チームを取得
      const teams = await client.getTeamsForUser(loginResponse.user.id);
      if (teams.length > 0) {
        await selectTeam(teams[0]);
      }
      
      // ログイン完了後にポーリング確認（WebSocket失敗時の保険）
      // WebSocket接続に失敗する可能性があるため、3秒後に確認
      setTimeout(() => {
        if (!client.isWebSocketConnected() && !pollingActiveRef.current) {
          console.log('⚠️ WebSocket未接続 - ポーリングモードで動作開始');
          // 既存のポーリングを安全に停止してから開始
          const startLoginFallbackPolling = async () => {
            if ((window as any).stopMessagePolling) {
              (window as any).stopMessagePolling();
            }
            await new Promise(resolve => setTimeout(resolve, 200));
            pollingActiveRef.current = false;
            pollingIntervalRef.current = null;
            startMessagePolling();
          };
          startLoginFallbackPolling();
        } else {
          console.log('✅ WebSocket接続済みまたはポーリング動作中 - 追加アクション不要');
        }
      }, 3000);
    } catch (error) {
      console.error('ログインエラー:', error);
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'ログインに失敗しました',
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // ログアウト処理
  const logout = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      await client.logout();
    } catch (error) {
      console.error('ログアウトエラー:', error);
    } finally {
      dispatch({ type: 'SET_USER', payload: null });
      dispatch({ type: 'SET_CURRENT_TEAM', payload: null });
      dispatch({ type: 'SET_CURRENT_CHANNEL', payload: null });
      dispatch({ type: 'SET_CHANNELS', payload: [] });
      dispatch({ type: 'SET_CONNECTED', payload: false });
      dispatch({ type: 'SET_LOADING', payload: false });
      
      // ローカルストレージからデータをクリア
      localStorage.removeItem('mattermost_posts');
      localStorage.removeItem('mattermost_channels');
      localStorage.removeItem('mattermost_current_team');
      localStorage.removeItem('mattermost_current_channel');
    }
  };

  // チーム選択
  const selectTeam = async (team: Team) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      console.log('🏢 チーム選択開始:', { teamId: team.id, teamName: team.display_name || team.name });
      dispatch({ type: 'SET_CURRENT_TEAM', payload: team });
      
      // チームのチャンネル一覧を取得
      console.log('📡 チャンネル一覧取得開始...', { teamId: team.id, teamName: team.display_name || team.name });
      const channels = await client.getChannelsForTeam(team.id);
      console.log('📋 取得したチャンネル一覧:', channels.map(ch => ({
        id: ch.id,
        name: ch.display_name || ch.name,
        type: ch.type,
        team_id: ch.team_id
      })));
      
      if (channels.length === 0) {
        console.warn('⚠️ このチームにはチャンネルがありません');
        console.log('💡 Mattermostでチャンネルを作成するか、他のチームに参加してください');
      }
      
      dispatch({ type: 'SET_CHANNELS', payload: channels });
      console.log('✅ チャンネル一覧をAppContextに保存完了:', channels.length);

      // チャンネルがある場合のみデフォルト選択
      if (channels.length > 0) {
        const defaultChannel = channels.find(ch => ch.name === 'town-square') || 
                               channels.find(ch => ch.type === 'O') || 
                               channels[0];
        console.log('🏠 デフォルトチャンネル選択:', {
          id: defaultChannel.id,
          name: defaultChannel.display_name || defaultChannel.name,
          type: defaultChannel.type
        });
        await selectChannel(defaultChannel);
      } else {
        console.warn('⚠️ このチームにはチャンネルがありません');
        console.log('💡 Mattermostで最初のチャンネルを作成してください');
      }
    } catch (error) {
      console.error('❌ チーム選択エラー:', error);
      dispatch({
        type: 'SET_ERROR',
        payload: 'チーム情報の取得に失敗しました',
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // チャンネル選択
  const selectChannel = async (channel: Channel) => {
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      dispatch({ type: 'SET_CURRENT_CHANNEL', payload: channel });
      await loadChannelPosts(channel.id);
      
      // チャンネル選択時にWebSocketが未接続の場合はポーリング開始
      if (!client.isWebSocketConnected()) {
        console.log('🔄 チャンネル選択時にポーリング開始');
        // 既存のポーリングを安全に停止してから新しく開始
        const stopCurrentPolling = async () => {
          if ((window as any).stopMessagePolling) {
            (window as any).stopMessagePolling();
          }
          // ポーリング停止が完了するまで待機
          await new Promise(resolve => setTimeout(resolve, 200));
          // フラグをリセット
          pollingActiveRef.current = false;
          pollingIntervalRef.current = null;
          // 新しいポーリングを開始
          startMessagePolling();
        };
        stopCurrentPolling();
      }
    } catch (error) {
      console.error('チャンネル選択エラー:', error);
      dispatch({
        type: 'SET_ERROR',
        payload: 'チャンネル情報の取得に失敗しました',
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // チャンネルの投稿を読み込み
  const loadChannelPosts = async (channelId: string) => {
    try {
      const response = await client.getPostsForChannel(channelId);
      const posts = response.order.map(postId => response.posts[postId]);
      dispatch({
        type: 'SET_POSTS',
        payload: { channelId, posts: posts.reverse() }, // 時系列順に並び替え
      });
    } catch (error) {
      console.error('投稿読み込みエラー:', error);
    }
  };

  // メッセージ送信
  const sendMessage = async (message: string, rootId?: string) => {
    console.log('📨 AppContext.sendMessage呼び出し:', { 
      message, 
      rootId, 
      currentChannelId: state.currentChannel?.id,
      currentChannelName: state.currentChannel?.display_name || state.currentChannel?.name,
      currentTeamId: state.currentTeam?.id 
    });
    
    if (!state.currentChannel) {
      console.error('❌ チャンネルが選択されていません');
      throw new Error('チャンネルが選択されていません');
    }

    // 認証状態の確認
    const authStatus = client.isAuthenticated();
    const tokenValue = client.getToken();
    console.log('🔍 認証状態確認:', { authStatus, tokenValue, tokenType: typeof tokenValue });
    
    if (!authStatus) {
      console.error('❌ 認証が失効しています');
      dispatch({ type: 'SET_ERROR', payload: '認証が失効しました。再ログインしてください。' });
      throw new Error('認証が必要です');
    }

    try {
      console.log('🔗 client.createPost呼び出し開始');
      console.log('📤 送信データ:', {
        channel_id: state.currentChannel.id,
        message: message,
        root_id: rootId,
        user_id: state.user?.id
      });
      
      const post = await client.createPost({
        channel_id: state.currentChannel.id,
        message,
        root_id: rootId,
      });
      console.log('✅ client.createPost成功:', post);
      console.log('🔄 Mattermostにメッセージが送信されました:', {
        messageText: message,
        channelName: state.currentChannel.display_name || state.currentChannel.name,
        postId: post.id,
        timestamp: new Date(post.create_at).toLocaleString()
      });
      console.log('📊 送信されたPost詳細:', {
        id: post.id,
        channel_id: post.channel_id,
        user_id: post.user_id,
        message: post.message,
        create_at: post.create_at
      });
      
      // WebSocketが接続されていない場合は、手動でメッセージを追加
      if (!client.isWebSocketConnected()) {
        console.log('📥 WebSocket未接続のため、手動でメッセージを追加');
        dispatch({
          type: 'ADD_POST',
          payload: { channelId: state.currentChannel.id, post },
        });
        
        // ポーリング機能が動作していない場合は最新メッセージを再読み込み
        if (!(window as any).stopMessagePolling) {
          setTimeout(() => {
            if (state.currentChannel) {
              loadChannelPosts(state.currentChannel.id);
            }
          }, 500);
        }
      } else {
        console.log('📡 WebSocket接続中 - リアルタイム更新を待機');
      }
    } catch (error) {
      console.error('❌ AppContext.sendMessage エラー詳細:', error);
      console.error('❌ エラー情報:', {
        message: (error as any)?.message,
        status_code: (error as any)?.status_code,
        detailed_error: (error as any)?.detailed_error,
        request_id: (error as any)?.request_id
      });
      
      // 401エラーの場合は認証切れ
      if (error && typeof error === 'object' && 'status_code' in error && error.status_code === 401) {
        console.error('🔑 401認証エラー: セッションが失効しました');
        dispatch({ type: 'SET_ERROR', payload: '認証が失効しました。再ログインしてください。' });
        // 認証情報をクリア
        client.clearSession();
        dispatch({ type: 'SET_USER', payload: null });
        // ポーリングも停止
        if ((window as any).stopMessagePolling) {
          (window as any).stopMessagePolling();
        }
      }
      
      throw error;
    }
  };

  // チャンネルリストの手動更新
  const refreshChannels = async () => {
    if (!state.currentTeam) {
      console.warn('⚠️ チームが選択されていないため、チャンネル更新をスキップ');
      console.log('🔍 現在の状態:', {
        hasUser: !!state.user,
        currentTeam: state.currentTeam,
        channelsCount: state.channels.length
      });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      console.log('🔄 チャンネルリスト手動更新開始', {
        teamId: state.currentTeam.id,
        teamName: state.currentTeam.display_name || state.currentTeam.name,
        currentChannelsCount: state.channels.length
      });
      
      // 最新のチャンネル一覧を取得
      const channels = await client.getChannelsForTeam(state.currentTeam.id);
      console.log('📋 更新されたチャンネル一覧:', channels.map(ch => ({
        id: ch.id,
        name: ch.display_name || ch.name,
        type: ch.type
      })));
      
      if (channels.length === 0) {
        console.warn('⚠️ 更新後もチャンネルがありません');
        console.log('💡 Mattermostでこのチームにチャンネルを作成してください');
      }
      
      dispatch({ type: 'SET_CHANNELS', payload: channels });
      console.log('✅ チャンネルリスト更新完了:', channels.length);
      
    } catch (error) {
      console.error('❌ チャンネルリスト更新エラー:', error);
      console.error('❌ エラー詳細:', {
        message: (error as any)?.message,
        status_code: (error as any)?.status_code,
        detailed_error: (error as any)?.detailed_error
      });
      dispatch({
        type: 'SET_ERROR',
        payload: 'チャンネルリストの更新に失敗しました',
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // ユーザー情報取得とキャッシュ
  const getUserInfo = async (userId: string): Promise<User> => {
    // キャッシュから検索
    if (state.users[userId]) {
      return state.users[userId];
    }

    try {
      console.log('👤 ユーザー情報取得:', userId);
      const user = await client.getUserById(userId);
      dispatch({ type: 'CACHE_USER', payload: user });
      return user;
    } catch (error) {
      console.error('❌ ユーザー情報取得エラー:', error);
      // エラー時はダミーユーザーを返す
      const dummyUser: User = {
        id: userId,
        username: `ユーザー${userId.slice(-4)}`,
        email: '',
        create_at: 0,
        update_at: 0,
        delete_at: 0,
      };
      return dummyUser;
    }
  };

  // ユーザー表示名取得（キャッシュから即座に取得、なければIDから生成）
  const getUserDisplayName = (userId: string): string => {
    const user = state.users[userId];
    if (user) {
      return user.nickname || user.username || `ユーザー${userId.slice(-4)}`;
    }
    
    // キャッシュにない場合はバックグラウンドで取得
    getUserInfo(userId).catch(error => {
      console.warn('⚠️ バックグラウンドユーザー情報取得失敗:', error);
    });
    
    // 即座にフォールバック名を返す
    return `ユーザー${userId.slice(-4)}`;
  };

  // デバッグ用関数（開発環境のみ）
  React.useEffect(() => {
    if (import.meta.env.DEV) {
      (window as any).mattermostDebug = {
        clearStorage: () => {
          localStorage.removeItem('mattermost_posts');
          localStorage.removeItem('mattermost_channels');
          localStorage.removeItem('mattermost_current_team');
          localStorage.removeItem('mattermost_current_channel');
          console.log('🗑️ Mattermostデータをクリアしました。ページをリロードしてください。');
        },
        showState: () => {
          console.log('🔍 現在の状態:', {
            user: state.user?.username,
            currentTeam: state.currentTeam?.display_name || state.currentTeam?.name,
            currentChannel: state.currentChannel?.display_name || state.currentChannel?.name,
            channelsCount: state.channels.length,
            channels: state.channels.map(ch => ({ name: ch.display_name || ch.name, type: ch.type })),
            isConnected: state.isConnected,
            isLoading: state.isLoading,
            error: state.error,
            websocketConnected: client.isWebSocketConnected(),
            hasToken: !!client.getToken()
          });
        },
        testWebSocket: () => {
          console.log('🔌 WebSocket診断開始');
          const status = client.getWebSocketStatus();
          console.log('📊 WebSocket状態詳細:', status);
          console.log('- 接続状態:', status.connected ? '✅ 接続中' : '❌ 未接続');
          console.log('- ReadyState:', `${status.readyState} (${status.readyStateText})`);
          console.log('- WebSocket URL:', status.url || '未設定');
          console.log('- 認証タイプ:', status.tokenType);
          console.log('- 再接続試行数:', status.reconnectionAttempts);
          console.log('- アプリ接続状態:', state.isConnected);
          
          if (!status.connected) {
            console.log('🔄 WebSocket再接続を試行');
            connectWebSocket();
          }
        },
        testPolling: () => {
          console.log('📨 ポーリング診断開始');
          console.log('- ポーリング関数存在:', typeof (window as any).stopMessagePolling);
          console.log('- ポーリングアクティブ:', pollingActiveRef.current);
          console.log('- ポーリングインターバル:', !!pollingIntervalRef.current);
          console.log('- 現在のチャンネル:', state.currentChannel?.display_name || state.currentChannel?.name);
          console.log('- 現在のユーザー:', state.user?.username);
          console.log('- 既存メッセージ数:', state.posts[state.currentChannel?.id || '']?.length || 0);
          
          if (pollingActiveRef.current && pollingIntervalRef.current) {
            console.log('✅ ポーリング動作中');
          } else {
            console.log('❌ ポーリング未動作 - 手動開始');
            startMessagePolling();
          }
        },
        forceRefreshMessages: async () => {
          if (state.currentChannel) {
            console.log('🔄 メッセージ強制更新実行');
            await loadChannelPosts(state.currentChannel.id);
          } else {
            console.warn('⚠️ チャンネルが選択されていません');
          }
        },
        startPollingNow: () => {
          console.log('🚀 緊急ポーリング開始');
          // 現在のポーリングを安全に停止
          const emergencyStartPolling = async () => {
            if ((window as any).stopMessagePolling) {
              (window as any).stopMessagePolling();
            }
            await new Promise(resolve => setTimeout(resolve, 200));
            pollingActiveRef.current = false;
            pollingIntervalRef.current = null;
            startMessagePolling();
          };
          emergencyStartPolling();
        },
        refreshChannels: refreshChannels,
        forceChannelRefresh: async () => {
          if (state.currentTeam) {
            console.log('🔄 強制チャンネル更新実行');
            await refreshChannels();
          } else {
            console.warn('⚠️ チームが選択されていません');
          }
        }
      };
      console.log('🛠️ デバッグ関数を有効化しました:');
      console.log('  - window.mattermostDebug.clearStorage() - ローカルデータクリア');
      console.log('  - window.mattermostDebug.showState() - 現在の状態表示');
      console.log('  - window.mattermostDebug.testWebSocket() - WebSocket接続診断');
      console.log('  - window.mattermostDebug.testPolling() - ポーリング診断');
      console.log('  - window.mattermostDebug.forceRefreshMessages() - メッセージ強制更新');
      console.log('  - window.mattermostDebug.startPollingNow() - 緊急ポーリング開始');
      console.log('  - window.mattermostDebug.refreshChannels() - チャンネル更新');
      console.log('  - window.mattermostDebug.forceChannelRefresh() - 強制チャンネル更新');
    }
  }, [state, refreshChannels]);

  const contextValue: AppContextType = {
    state,
    client,
    dispatch,
    login,
    logout,
    selectTeam,
    selectChannel,
    sendMessage,
    loadChannelPosts,
    refreshChannels,
    getUserInfo,
    getUserDisplayName,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// カスタムフック
export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp は AppProvider 内で使用する必要があります');
  }
  return context;
};