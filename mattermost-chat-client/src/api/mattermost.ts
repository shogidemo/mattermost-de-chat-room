import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
import type {
  User,
  Team,
  Channel,
  Post,
  LoginCredentials,
  LoginResponse,
  APIError,
  ChannelMember,
  CreateChannelRequest,
  CreatePostRequest,
  WebSocketEvent
} from '../types/mattermost';

class MattermostClient {
  private axiosInstance: AxiosInstance;
  private token: string | null = null;
  private websocket: WebSocket | null = null;
  private websocketUrl: string;
  private eventHandlers: Map<string, ((event: WebSocketEvent) => void)[]> = new Map();
  private reconnectionAttempts: number = 0;
  private currentBackoffDelay: number = 1000;

  constructor(baseURL: string = '') {
    // 開発環境ではViteプロキシを使用、本番環境では直接アクセス
    const apiBaseURL = baseURL || (import.meta.env.DEV ? '/api/v4' : 'http://localhost:8065/api/v4');
    
    this.axiosInstance = axios.create({
      baseURL: apiBaseURL,
      timeout: 10000,
      withCredentials: true, // クッキー認証を有効化
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // WebSocket URL の設定
    const wsBaseURL = baseURL || 'http://localhost:8065';
    this.websocketUrl = wsBaseURL.replace('http', 'ws') + '/api/v4/websocket';

    // リクエストインターセプター - 認証トークンを自動で追加
    this.axiosInstance.interceptors.request.use(
      (config) => {
        if (this.token && this.token !== 'session-based') {
          config.headers['Authorization'] = `Bearer ${this.token}`;
        }
        // セッションベース認証ではクッキーを使用（withCredentials: trueで自動）
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // レスポンスインターセプター - エラーハンドリング
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          const apiError: APIError = {
            id: error.response.data?.id || 'unknown_error',
            message: error.response.data?.message || 'APIエラーが発生しました',
            detailed_error: error.response.data?.detailed_error,
            request_id: error.response.data?.request_id,
            status_code: error.response.status,
          };
          return Promise.reject(apiError);
        }
        return Promise.reject(error);
      }
    );
  }

  // 認証関連メソッド
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      console.log('🔐 ログイン試行:', { login_id: credentials.login_id });
      
      const response: AxiosResponse<User> = await this.axiosInstance.post('/users/login', credentials);
      const user = response.data;
      
      // Mattermostは複数の方法でトークンを返す可能性がある
      this.token = response.headers['token'] || 
                   response.headers['Token'] || 
                   response.headers['authorization']?.replace('Bearer ', '') ||
                   (user as any).token;
      
      console.log('📥 レスポンスヘッダー:', response.headers);
      console.log('👤 ユーザー情報:', user);
      console.log('🎫 取得トークン:', this.token ? 'あり' : 'なし');
      
      if (!this.token) {
        console.warn('⚠️ トークンがヘッダーで見つからない、ユーザーオブジェクトを確認');
        // ユーザーオブジェクトからトークンを探す
        if (user && typeof user === 'object') {
          const userObj = user as any;
          this.token = userObj.token || userObj.auth_token || userObj.session_token;
        }
      }
      
      if (!this.token) {
        console.error('❌ 認証トークンが見つかりません');
        console.log('利用可能なヘッダー:', Object.keys(response.headers));
        console.log('ユーザーオブジェクトのキー:', user ? Object.keys(user) : 'なし');
        
        // セッションベース認証を試行（トークンがない場合）
        console.log('🔄 セッションベース認証に切り替え');
        this.token = 'session-based'; // セッション認証フラグ
      }

      // ローカルストレージに保存
      if (this.token && this.token !== 'session-based') {
        localStorage.setItem('mattermost_token', this.token);
      }
      localStorage.setItem('mattermost_user', JSON.stringify(user));

      return { token: this.token, user };
    } catch (error) {
      console.error('ログインエラー:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.axiosInstance.post('/users/logout');
    } catch (error) {
      console.error('ログアウトエラー:', error);
    } finally {
      this.token = null;
      this.disconnectWebSocket();
      localStorage.removeItem('mattermost_token');
      localStorage.removeItem('mattermost_user');
    }
  }

  // 保存済みトークンでセッションを復元
  restoreSession(): User | null {
    const token = localStorage.getItem('mattermost_token');
    const userStr = localStorage.getItem('mattermost_user');
    
    if (token && userStr) {
      this.token = token;
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('ユーザー情報の復元に失敗:', error);
        this.clearSession();
      }
    }
    return null;
  }

  clearSession(): void {
    this.token = null;
    localStorage.removeItem('mattermost_token');
    localStorage.removeItem('mattermost_user');
  }

  // ユーザー情報取得
  async getCurrentUser(): Promise<User> {
    const response = await this.axiosInstance.get<User>('/users/me');
    return response.data;
  }

  // チーム関連メソッド
  async getTeamsForUser(userId: string): Promise<Team[]> {
    const response = await this.axiosInstance.get<Team[]>(`/users/${userId}/teams`);
    return response.data;
  }

  async getTeam(teamId: string): Promise<Team> {
    const response = await this.axiosInstance.get<Team>(`/teams/${teamId}`);
    return response.data;
  }

  // チャンネル関連メソッド
  async getChannelsForTeam(teamId: string): Promise<Channel[]> {
    const response = await this.axiosInstance.get<Channel[]>(`/teams/${teamId}/channels`);
    return response.data;
  }

  async getChannel(channelId: string): Promise<Channel> {
    const response = await this.axiosInstance.get<Channel>(`/channels/${channelId}`);
    return response.data;
  }

  async createChannel(channelData: CreateChannelRequest): Promise<Channel> {
    const response = await this.axiosInstance.post<Channel>('/channels', channelData);
    return response.data;
  }

  async joinChannel(channelId: string, userId: string): Promise<ChannelMember> {
    const response = await this.axiosInstance.post<ChannelMember>(`/channels/${channelId}/members`, {
      user_id: userId,
    });
    return response.data;
  }

  async leaveChannel(channelId: string, userId: string): Promise<void> {
    await this.axiosInstance.delete(`/channels/${channelId}/members/${userId}`);
  }

  // 投稿関連メソッド
  async getPostsForChannel(channelId: string, page = 0, perPage = 60): Promise<{
    order: string[];
    posts: Record<string, Post>;
  }> {
    const response = await this.axiosInstance.get(
      `/channels/${channelId}/posts?page=${page}&per_page=${perPage}`
    );
    return response.data;
  }

  async createPost(postData: CreatePostRequest): Promise<Post> {
    const response = await this.axiosInstance.post<Post>('/posts', postData);
    return response.data;
  }

  async getPostThread(postId: string): Promise<{
    order: string[];
    posts: Record<string, Post>;
  }> {
    const response = await this.axiosInstance.get(`/posts/${postId}/thread`);
    return response.data;
  }

  async updatePost(postId: string, message: string): Promise<Post> {
    const response = await this.axiosInstance.put<Post>(`/posts/${postId}`, { message });
    return response.data;
  }

  async deletePost(postId: string): Promise<void> {
    await this.axiosInstance.delete(`/posts/${postId}`);
  }

  // WebSocket関連メソッド
  async connectWebSocket(): Promise<void> {
    if (!this.token) {
      console.error('❌ WebSocket接続にはトークンが必要ですが、トークンがありません');
      throw new Error('WebSocket接続には認証が必要です');
    }

    console.log('🔌 WebSocket接続開始:', { token: this.token === 'session-based' ? 'session-based' : 'token-based', url: this.websocketUrl });

    return new Promise((resolve, reject) => {
      try {
        // セッションベース認証の場合は、トークンなしでWebSocket接続を試行
        const wsUrl = this.token === 'session-based' 
          ? this.websocketUrl 
          : `${this.websocketUrl}?token=${this.token}`;
          
        console.log('🔗 WebSocket URL:', wsUrl);
        this.websocket = new WebSocket(wsUrl);

        this.websocket.onopen = () => {
          console.log('✅ WebSocket接続が確立されました');
          // 接続成功時にリセット
          this.reconnectionAttempts = 0;
          this.currentBackoffDelay = 1000;
          resolve();
        };

        this.websocket.onmessage = (event) => {
          try {
            const wsEvent: WebSocketEvent = JSON.parse(event.data);
            console.log('📨 WebSocketメッセージ受信:', wsEvent.event);
            this.handleWebSocketEvent(wsEvent);
          } catch (error) {
            console.error('❌ WebSocketメッセージの解析エラー:', error);
          }
        };

        this.websocket.onclose = (event) => {
          console.log('🔌 WebSocket接続が閉じられました:', { code: event.code, reason: event.reason });
          // 認証エラー以外の場合は自動再接続
          if (event.code !== 1000 && event.code !== 4001) { // 正常終了・認証エラー以外の場合
            const backoffDelay = Math.min(this.currentBackoffDelay, 30000); // 最大遅延は30秒
            console.log(`🔄 ${backoffDelay / 1000}秒後に再接続を試行します (試行回数: ${this.reconnectionAttempts + 1})`);
            setTimeout(() => {
              if (this.token) {
                this.reconnectionAttempts++;
                this.connectWebSocket().catch((err) => {
                  console.error('❌ 再接続失敗:', err);
                });
                this.currentBackoffDelay = Math.min(this.currentBackoffDelay * 2, 30000); // 最大遅延は30秒
              }
            }, backoffDelay);
          } else {
            // 正常終了または認証エラーの場合はリセット
            this.reconnectionAttempts = 0;
            this.currentBackoffDelay = 1000;
          }
        };

        this.websocket.onerror = (error) => {
          console.error('❌ WebSocketエラー詳細:', {
            message: (error as any)?.message || '不明なエラー',
            stack: (error as any)?.stack || 'スタックトレースなし',
            readyState: this.websocket?.readyState,
            url: this.websocket?.url,
            token: this.token ? 'あり' : 'なし',
            reconnectionAttempts: this.reconnectionAttempts
          });
          
          // Reject the promise to propagate the error
          reject(new Error(`WebSocket接続エラー: readyState=${this.websocket?.readyState}`));
        };
      } catch (error) {
        console.error('❌ WebSocket接続エラー:', error);
        reject(error);
      }
    });
  }

  disconnectWebSocket(): void {
    if (this.websocket) {
      this.websocket.close(1000, '正常終了');
      this.websocket = null;
    }
  }

  private handleWebSocketEvent(event: WebSocketEvent): void {
    const handlers = this.eventHandlers.get(event.event);
    if (handlers) {
      handlers.forEach(handler => handler(event));
    }

    // 全イベント用のハンドラーも実行
    const allHandlers = this.eventHandlers.get('*');
    if (allHandlers) {
      allHandlers.forEach(handler => handler(event));
    }
  }

  // WebSocketイベントハンドラーの登録
  onWebSocketEvent(eventType: string, handler: (event: WebSocketEvent) => void): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  // WebSocketイベントハンドラーの削除
  offWebSocketEvent(eventType: string, handler: (event: WebSocketEvent) => void): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  // WebSocket接続状態の確認
  isWebSocketConnected(): boolean {
    return this.websocket?.readyState === WebSocket.OPEN;
  }

  // ファイルアップロード
  async uploadFile(file: File, channelId: string): Promise<{ file_infos: any[] }> {
    const formData = new FormData();
    formData.append('files', file);
    formData.append('channel_id', channelId);

    const response = await this.axiosInstance.post('/files', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // ユーティリティメソッド
  isAuthenticated(): boolean {
    // session-basedの場合は常に認証済みとみなす（セッションベース認証）
    if (this.token === 'session-based') {
      return true;
    }
    // 通常のトークンベース認証
    return !!this.token;
  }

  getToken(): string | null {
    return this.token;
  }
}

export default MattermostClient;