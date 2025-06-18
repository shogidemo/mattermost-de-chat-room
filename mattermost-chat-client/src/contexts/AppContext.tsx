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
  | { type: 'SET_CONNECTED'; payload: boolean };

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

  // セッション復元の試行
  useEffect(() => {
    const user = client.restoreSession();
    if (user) {
      dispatch({ type: 'SET_USER', payload: user });
      
      // WebSocket接続を試行
      connectWebSocket();
      
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
  }, []);

  // メッセージポーリング機能
  const startMessagePolling = () => {
    // 既にポーリングが動作中の場合は停止して新しく開始
    if ((window as any).stopMessagePolling) {
      (window as any).stopMessagePolling();
    }
    
    console.log('📨 メッセージポーリング開始（2秒間隔）');
    
    const pollMessages = async () => {
      try {
        if (state.currentChannel && state.user) {
          console.log('🔍 ポーリング実行中:', {
            channelId: state.currentChannel.id.substring(0, 8),
            channelName: state.currentChannel.display_name || state.currentChannel.name,
            userId: state.user.id.substring(0, 8)
          });
          
          // 現在のチャンネルの最新メッセージを取得
          const response = await client.getPostsForChannel(state.currentChannel.id, 0, 15);
          const latestPosts = response.order.map(postId => response.posts[postId]);
          
          console.log('📊 API応答:', {
            orderCount: response.order.length,
            latestPostsCount: latestPosts.length,
            latestMessages: latestPosts.slice(0, 3).map(p => p.message.substring(0, 15))
          });
          
          // 既存のメッセージと比較して新しいメッセージのみ追加
          const existingPosts = state.posts[state.currentChannel.id] || [];
          const existingPostIds = new Set(existingPosts.map(p => p.id));
          
          const newPosts = latestPosts.filter(post => !existingPostIds.has(post.id));
          
          if (newPosts.length > 0) {
            console.log('📨 ポーリング: 新しいメッセージを発見:', newPosts.length, newPosts.map(p => p.message.substring(0, 20)));
            console.log('🆕 新しいメッセージ詳細:', newPosts.map(p => ({
              id: p.id.substring(0, 8),
              message: p.message,
              user_id: p.user_id,
              create_at: new Date(p.create_at).toLocaleString()
            })));
            // 時系列順にソートして追加
            newPosts.sort((a, b) => a.create_at - b.create_at).forEach(post => {
              console.log('➕ メッセージ追加:', post.message, 'チャンネル:', state.currentChannel!.id.substring(0, 8));
              dispatch({
                type: 'ADD_POST',
                payload: { channelId: state.currentChannel!.id, post },
              });
            });
          } else {
            console.log('📭 ポーリング: 新しいメッセージなし (既存:', existingPosts.length, '件, 最新:', latestPosts.length, '件)');
          }
        }
      } catch (error) {
        console.error('❌ ポーリングエラー:', error);
      }
    };

    // 初回実行
    pollMessages();
    
    // 2秒間隔でポーリング（より高速化）
    const pollingInterval = setInterval(pollMessages, 2000);
    
    // クリーンアップ関数を保存
    (window as any).stopMessagePolling = () => {
      console.log('⏹️ メッセージポーリング停止');
      clearInterval(pollingInterval);
      delete (window as any).stopMessagePolling;
    };
    
    return pollingInterval;
  };

  // WebSocket接続
  const connectWebSocket = async () => {
    try {
      console.log('🔌 WebSocket接続試行開始');
      await client.connectWebSocket();
      console.log('✅ WebSocket接続成功');
      dispatch({ type: 'SET_CONNECTED', payload: true });
      
      // WebSocket成功時はポーリング停止
      if ((window as any).stopMessagePolling) {
        (window as any).stopMessagePolling();
      }
      
      // WebSocketイベントハンドラーの設定
      setupWebSocketHandlers();
    } catch (error) {
      console.error('❌ WebSocket接続エラー:', error);
      dispatch({ type: 'SET_CONNECTED', payload: false });
      
      // WebSocket接続失敗時はポーリングにフォールバック
      console.log('🔄 WebSocket接続失敗 - ポーリング機能を開始します');
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
        console.log('📨 WebSocketイベント受信:', { eventType: 'posted', data: event.data });
        const post = JSON.parse(event.data.post);
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
        hasData: !!event.data
      });
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
      
      // WebSocket接続（失敗しても続行）
      try {
        await connectWebSocket();
      } catch (error) {
        console.warn('⚠️ WebSocket接続に失敗しましたが、HTTP APIでチャット機能は利用可能です:', error);
      }

      // ユーザーの所属チームを取得
      const teams = await client.getTeamsForUser(loginResponse.user.id);
      if (teams.length > 0) {
        await selectTeam(teams[0]);
      }
      
      // ログイン完了後にポーリング確認（WebSocket失敗時の保険）
      setTimeout(() => {
        if (!client.isWebSocketConnected() && typeof (window as any).stopMessagePolling !== 'function') {
          console.log('🔄 ログイン完了後にポーリング開始（保険）');
          startMessagePolling();
        }
      }, 2000);
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
      
      // チャンネル選択時にポーリングが動作していない場合は開始
      if (!client.isWebSocketConnected() && typeof (window as any).stopMessagePolling !== 'function') {
        console.log('🔄 チャンネル選択時にポーリング開始');
        startMessagePolling();
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
          console.log('- 接続状態:', client.isWebSocketConnected());
          console.log('- 認証トークン:', !!client.getToken());
          console.log('- アプリ接続状態:', state.isConnected);
          
          if (!client.isWebSocketConnected()) {
            console.log('🔄 WebSocket再接続を試行');
            connectWebSocket();
          }
        },
        testPolling: () => {
          console.log('📨 ポーリング診断開始');
          console.log('- ポーリング関数存在:', typeof (window as any).stopMessagePolling);
          console.log('- 現在のチャンネル:', state.currentChannel?.display_name || state.currentChannel?.name);
          console.log('- 現在のユーザー:', state.user?.username);
          console.log('- 既存メッセージ数:', state.posts[state.currentChannel?.id || '']?.length || 0);
          
          if (typeof (window as any).stopMessagePolling === 'function') {
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
          if ((window as any).stopMessagePolling) {
            (window as any).stopMessagePolling();
          }
          startMessagePolling();
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