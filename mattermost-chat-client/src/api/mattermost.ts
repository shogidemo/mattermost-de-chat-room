import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  User,
  Team,
  Channel,
  Post,
  LoginCredentials,
  LoginResponse,
  APIError,
  ChannelMember,
  TeamMember,
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

  constructor(baseURL: string = 'http://localhost:8065') {
    this.axiosInstance = axios.create({
      baseURL: `${baseURL}/api/v4`,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.websocketUrl = baseURL.replace('http', 'ws') + '/api/v4/websocket';

    // リクエストインターセプター - 認証トークンを自動で追加
    this.axiosInstance.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers['Authorization'] = `Bearer ${this.token}`;
        }
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
      const response: AxiosResponse<User> = await this.axiosInstance.post('/users/login', credentials);
      const user = response.data;
      this.token = response.headers['token'];
      
      if (!this.token) {
        throw new Error('認証トークンが取得できませんでした');
      }

      // ローカルストレージにトークンを保存
      localStorage.setItem('mattermost_token', this.token);
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
      throw new Error('WebSocket接続には認証が必要です');
    }

    return new Promise((resolve, reject) => {
      try {
        this.websocket = new WebSocket(`${this.websocketUrl}?token=${this.token}`);

        this.websocket.onopen = () => {
          console.log('WebSocket接続が確立されました');
          resolve();
        };

        this.websocket.onmessage = (event) => {
          try {
            const wsEvent: WebSocketEvent = JSON.parse(event.data);
            this.handleWebSocketEvent(wsEvent);
          } catch (error) {
            console.error('WebSocketメッセージの解析エラー:', error);
          }
        };

        this.websocket.onclose = (event) => {
          console.log('WebSocket接続が閉じられました:', event.code, event.reason);
          // 自動再接続ロジック（オプション）
          if (event.code !== 1000) { // 正常終了以外の場合
            setTimeout(() => {
              if (this.token) {
                this.connectWebSocket();
              }
            }, 5000);
          }
        };

        this.websocket.onerror = (error) => {
          console.error('WebSocketエラー:', error);
          reject(error);
        };
      } catch (error) {
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
    return !!this.token;
  }

  getToken(): string | null {
    return this.token;
  }
}

export default MattermostClient;