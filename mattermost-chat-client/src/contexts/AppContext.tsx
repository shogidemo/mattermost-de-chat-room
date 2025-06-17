import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import MattermostClient from '../api/mattermost';
import { AppState, User, Team, Channel, Post, WebSocketEvent } from '../types/mattermost';

// アプリケーション状態の初期値
const initialState: AppState = {
  user: null,
  currentTeam: null,
  currentChannel: null,
  channels: [],
  posts: {},
  isLoading: false,
  error: null,
  isConnected: false,
};

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
    case 'SET_CURRENT_TEAM':
      return { ...state, currentTeam: action.payload };
    case 'SET_CURRENT_CHANNEL':
      return { ...state, currentChannel: action.payload };
    case 'SET_CHANNELS':
      return { ...state, channels: action.payload };
    case 'SET_POSTS':
      return {
        ...state,
        posts: {
          ...state.posts,
          [action.payload.channelId]: action.payload.posts,
        },
      };
    case 'ADD_POST':
      const existingPosts = state.posts[action.payload.channelId] || [];
      return {
        ...state,
        posts: {
          ...state.posts,
          [action.payload.channelId]: [...existingPosts, action.payload.post],
        },
      };
    case 'UPDATE_POST':
      const channelPosts = state.posts[action.payload.channelId] || [];
      const updatedPosts = channelPosts.map(post =>
        post.id === action.payload.post.id ? action.payload.post : post
      );
      return {
        ...state,
        posts: {
          ...state.posts,
          [action.payload.channelId]: updatedPosts,
        },
      };
    case 'DELETE_POST':
      const filteredPosts = (state.posts[action.payload.channelId] || []).filter(
        post => post.id !== action.payload.postId
      );
      return {
        ...state,
        posts: {
          ...state.posts,
          [action.payload.channelId]: filteredPosts,
        },
      };
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
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  selectTeam: (team: Team) => Promise<void>;
  selectChannel: (channel: Channel) => Promise<void>;
  sendMessage: (message: string, rootId?: string) => Promise<void>;
  loadChannelPosts: (channelId: string) => Promise<void>;
}

// コンテキストの作成
const AppContext = createContext<AppContextType | null>(null);

// プロバイダーコンポーネント
interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const client = new MattermostClient();

  // セッション復元の試行
  useEffect(() => {
    const user = client.restoreSession();
    if (user) {
      dispatch({ type: 'SET_USER', payload: user });
      // WebSocket接続を試行
      connectWebSocket();
    }
  }, []);

  // WebSocket接続
  const connectWebSocket = async () => {
    try {
      await client.connectWebSocket();
      dispatch({ type: 'SET_CONNECTED', payload: true });
      
      // WebSocketイベントハンドラーの設定
      setupWebSocketHandlers();
    } catch (error) {
      console.error('WebSocket接続エラー:', error);
      dispatch({ type: 'SET_CONNECTED', payload: false });
    }
  };

  // WebSocketイベントハンドラーの設定
  const setupWebSocketHandlers = () => {
    // 新しい投稿の受信
    client.onWebSocketEvent('posted', (event: WebSocketEvent) => {
      const post = JSON.parse(event.data.post);
      dispatch({
        type: 'ADD_POST',
        payload: { channelId: post.channel_id, post },
      });
    });

    // 投稿の更新
    client.onWebSocketEvent('post_edited', (event: WebSocketEvent) => {
      const post = JSON.parse(event.data.post);
      dispatch({
        type: 'UPDATE_POST',
        payload: { channelId: post.channel_id, post },
      });
    });

    // 投稿の削除
    client.onWebSocketEvent('post_deleted', (event: WebSocketEvent) => {
      const post = JSON.parse(event.data.post);
      dispatch({
        type: 'DELETE_POST',
        payload: { channelId: post.channel_id, postId: post.id },
      });
    });

    // ユーザーの入退室など他のイベントも必要に応じて追加
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
      
      // WebSocket接続
      await connectWebSocket();

      // ユーザーの所属チームを取得
      const teams = await client.getTeamsForUser(loginResponse.user.id);
      if (teams.length > 0) {
        await selectTeam(teams[0]);
      }
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
    }
  };

  // チーム選択
  const selectTeam = async (team: Team) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      dispatch({ type: 'SET_CURRENT_TEAM', payload: team });
      
      // チームのチャンネル一覧を取得
      const channels = await client.getChannelsForTeam(team.id);
      dispatch({ type: 'SET_CHANNELS', payload: channels });

      // デフォルトチャンネル（Town Square）を選択
      const defaultChannel = channels.find(ch => ch.name === 'town-square') || channels[0];
      if (defaultChannel) {
        await selectChannel(defaultChannel);
      }
    } catch (error) {
      console.error('チーム選択エラー:', error);
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
    if (!state.currentChannel) {
      throw new Error('チャンネルが選択されていません');
    }

    try {
      await client.createPost({
        channel_id: state.currentChannel.id,
        message,
        root_id: rootId,
      });
      // WebSocketで新しい投稿は自動的に受信される
    } catch (error) {
      console.error('メッセージ送信エラー:', error);
      throw error;
    }
  };

  const contextValue: AppContextType = {
    state,
    client,
    login,
    logout,
    selectTeam,
    selectChannel,
    sendMessage,
    loadChannelPosts,
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