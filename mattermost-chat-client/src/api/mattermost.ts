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
        'X-Requested-With': 'XMLHttpRequest', // CSRF保護回避
      },
    });

    // WebSocket URL の設定
    if (import.meta.env.DEV) {
      // 開発環境では直接Mattermostサーバーに接続（プロキシ経由ではなく）
      const mattermostUrl = import.meta.env.VITE_MATTERMOST_URL || 'http://localhost:8065';
      this.websocketUrl = import.meta.env.VITE_WEBSOCKET_DEV_URL || mattermostUrl.replace('http', 'ws') + '/api/v4/websocket';
      console.log('🔧 開発環境WebSocket URL設定:', this.websocketUrl);
    } else {
      // 本番環境では直接接続
      const wsBaseURL = baseURL || import.meta.env.VITE_MATTERMOST_URL || 'http://localhost:8065';
      this.websocketUrl = wsBaseURL.replace('http', 'ws') + '/api/v4/websocket';
    }

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
      
      // CSRF保護を回避するためのヘッダーを追加
      const response: AxiosResponse<User> = await this.axiosInstance.post('/users/login', credentials, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Content-Type': 'application/json',
        }
      });
      const user = response.data;
      
      // Mattermostのトークンを取得（ヘッダー名の大文字小文字に注意）
      this.token = response.headers.token || 
                   response.headers.Token || 
                   response.headers['token'] || 
                   response.headers['Token'] ||
                   response.headers.authorization?.replace('Bearer ', '') ||
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
        console.warn('⚠️ 認証トークンが見つかりません - セッションベース認証を使用');
        console.log('利用可能なヘッダー:', Object.keys(response.headers));
        console.log('ユーザーオブジェクトのキー:', user ? Object.keys(user) : 'なし');
        console.log('📋 全ヘッダー内容:', response.headers);
        
        // セッションベース認証を使用（クッキー認証）
        this.token = 'session-based';
        console.log('🍪 セッションベース認証（クッキー）を使用します');
      }

      // ローカルストレージに保存
      if (this.token && this.token !== 'session-based') {
        localStorage.setItem('mattermost_token', this.token);
      } else {
        localStorage.setItem('mattermost_token', 'session-based');
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
      console.log('🔄 セッション復元:', { 
        tokenType: token === 'session-based' ? 'session' : 'bearer',
        tokenLength: token.length 
      });
      try {
        const user = JSON.parse(userStr);
        console.log('✅ ユーザー情報復元成功:', user.username);
        return user;
      } catch (error) {
        console.error('❌ ユーザー情報の復元に失敗:', error);
        this.clearSession();
      }
    }
    console.log('⚠️ 保存されたセッションが見つかりません');
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
    try {
      console.log('📡 チャンネル取得API呼び出し:', { teamId, endpoint: `/teams/${teamId}/channels` });
      const response = await this.axiosInstance.get<Channel[]>(`/teams/${teamId}/channels`);
      console.log('✅ チャンネル取得API成功:', { 
        count: response.data.length,
        channels: response.data.map(ch => ({ name: ch.display_name || ch.name, type: ch.type }))
      });
      return response.data;
    } catch (error) {
      console.error('❌ チャンネル取得API失敗:', error);
      
      // フォールバック: 全チャンネルから該当チームのものを取得
      try {
        console.log('🔄 フォールバック: 全チャンネル取得を試行');
        const allChannelsResponse = await this.axiosInstance.get<Channel[]>('/channels');
        const teamChannels = allChannelsResponse.data.filter(ch => ch.team_id === teamId);
        console.log('✅ フォールバック成功:', { 
          totalChannels: allChannelsResponse.data.length,
          teamChannels: teamChannels.length 
        });
        return teamChannels;
      } catch (fallbackError) {
        console.error('❌ フォールバックも失敗:', fallbackError);
        throw error; // 元のエラーを投げる
      }
    }
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
    console.log('🔌 WebSocket接続開始 - 詳細ログ:', { 
      websocketUrl: this.websocketUrl,
      hasToken: !!this.token,
      tokenLength: this.token?.length || 0,
      tokenType: this.token === 'session-based' ? 'session' : this.token ? 'bearer' : 'none',
      env: import.meta.env.DEV ? 'development' : 'production'
    });
    
    // WebSocket URLをそのまま使用（トークンは認証チャレンジで送信）
    const wsUrl = this.websocketUrl;
    
    // 既存の接続をクリーンアップ
    if (this.websocket) {
      console.log('🧹 既存WebSocket接続をクリーンアップ');
      this.websocket.close();
      this.websocket = null;
    }

    // トークンがない、またはセッションベース認証の場合
    if (!this.token || this.token === 'session-based') {
      console.log('🔌 セッションベース認証でWebSocket接続を試行');
      return this.connectWebSocketWithSession();
    }

    console.log('🔌 トークンベース認証でWebSocket接続開始:', { 
      hasToken: !!this.token,
      tokenLength: this.token.length,
      url: this.websocketUrl 
    });

    return new Promise((resolve, reject) => {
      try {
        // WebSocket接続を確立（認証はあとで送信）
        console.log('🔗 WebSocket接続試行:', wsUrl);
        
        this.websocket = new WebSocket(wsUrl);

        // タイムアウト設定
        const connectTimeout = setTimeout(() => {
          if (this.websocket && this.websocket.readyState === WebSocket.CONNECTING) {
            console.warn('⏰ WebSocket接続がタイムアウトしました');
            this.websocket.close();
            reject(new Error('WebSocket接続タイムアウト'));
          }
        }, 10000); // 10秒タイムアウト

        this.websocket.onopen = () => {
          clearTimeout(connectTimeout);
          console.log('✅ WebSocket接続が確立されました');
          console.log('🔗 WebSocket接続詳細:', {
            url: this.websocket?.url,
            readyState: this.websocket?.readyState,
            protocol: this.websocket?.protocol
          });
          
          // Mattermost WebSocket認証チャレンジを送信
          console.log('🔑 認証チャレンジ送信中...', { tokenType: this.token === 'session-based' ? 'session' : 'bearer' });
          
          // トークンがある場合のみ認証チャレンジを送信
          if (this.token && this.token !== 'session-based') {
            // Mattermost v4 APIの正しい認証フォーマット
            const authChallenge = {
              seq: 1,
              action: 'authentication_challenge',
              data: {
                token: this.token
              }
            };
            console.log('📤 認証チャレンジ送信:', authChallenge);
            
            // 遅延して送信（接続が完全に確立されるのを待つ）
            setTimeout(() => {
              if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
                this.websocket.send(JSON.stringify(authChallenge));
                console.log('📤 認証チャレンジ送信完了');
              }
            }, 100);
            
            // Mattermostは認証応答を送信しない場合があるので、
            // タイムアウト後にresolveを呼ぶ
            setTimeout(() => {
              console.log('✅ 認証応答待ちタイムアウト - 接続成功とみなす');
              this.reconnectionAttempts = 0;
              this.currentBackoffDelay = 1000;
              resolve();
            }, 500);
          } else {
            console.log('⚠️ セッションベース認証の場合、認証チャレンジは送信しません');
            // セッションベース認証の場合はhelloメッセージを待つ
          }
          
          // 接続成功時にリセット
          this.reconnectionAttempts = 0;
          this.currentBackoffDelay = 1000;
          // resolve()は認証成功後に実行
        };

        this.websocket.onmessage = (event) => {
          try {
            const wsData = JSON.parse(event.data);
            console.log('📨 WebSocketメッセージ受信:', wsData);
            
            // 認証チャレンジの応答を確認
            if (wsData.seq_reply === 1) {
              if (wsData.status === 'OK') {
                console.log('✅ WebSocket認証成功');
                // 接続成功時にリセット
                this.reconnectionAttempts = 0;
                this.currentBackoffDelay = 1000;
                resolve();
                return;
              } else if (wsData.error) {
                console.error('❌ WebSocket認証エラー:', wsData.error);
                reject(new Error(`WebSocket認証失敗: ${wsData.error.message || JSON.stringify(wsData.error)}`));
                return;
              }
            }
            
            // 通常のイベント処理
            if (wsData.event) {
              const wsEvent: WebSocketEvent = wsData;
              console.log('📨 WebSocketイベント:', wsEvent.event);
              
              // helloイベントの確認
              if (wsEvent.event === 'hello') {
                console.log('👋 WebSocket hello メッセージ受信');
                // セッションベース認証の場合、helloメッセージを受信したら接続成功
                if (this.token === 'session-based') {
                  console.log('✅ セッションベースWebSocket接続成功');
                  this.reconnectionAttempts = 0;
                  this.currentBackoffDelay = 1000;
                  resolve();
                  return;
                }
              }
              
              this.handleWebSocketEvent(wsEvent);
            }
          } catch (error) {
            console.error('❌ WebSocketメッセージの解析エラー:', error);
            console.error('❌ 受信データ:', event.data);
          }
        };

        this.websocket.onclose = (event) => {
          clearTimeout(connectTimeout);
          console.log('🔌 WebSocket接続が閉じられました:', { 
            code: event.code, 
            reason: event.reason,
            wasClean: event.wasClean 
          });
          
          // コード1006は異常終了、4001は認証エラー
          if (event.code === 1006) {
            console.warn('⚠️ WebSocket異常終了 - ネットワークまたはサーバー問題の可能性');
          } else if (event.code === 4001) {
            console.error('🔑 WebSocket認証エラー');
          }
          
          // 認証エラー以外で再接続を試行
          if (event.code !== 1000 && event.code !== 4001 && this.reconnectionAttempts < 3) {
            const backoffDelay = Math.min(this.currentBackoffDelay, 30000);
            console.log(`🔄 ${backoffDelay / 1000}秒後に再接続を試行します (試行回数: ${this.reconnectionAttempts + 1})`);
            setTimeout(() => {
              if (this.token) {
                this.reconnectionAttempts++;
                this.connectWebSocket().catch((err) => {
                  console.error('❌ 再接続失敗:', err);
                });
                this.currentBackoffDelay = Math.min(this.currentBackoffDelay * 2, 30000);
              }
            }, backoffDelay);
          } else {
            this.reconnectionAttempts = 0;
            this.currentBackoffDelay = 1000;
          }
        };

        this.websocket.onerror = (error) => {
          clearTimeout(connectTimeout);
          console.error('❌ WebSocketエラー詳細:', {
            error: error,
            errorMessage: (error as any)?.message || '不明なエラー',
            errorType: (error as any)?.type || 'unknown',
            readyState: this.websocket?.readyState,
            readyStateText: this.websocket ? {
              0: 'CONNECTING',
              1: 'OPEN',
              2: 'CLOSING',
              3: 'CLOSED'
            }[this.websocket.readyState] : 'NO_WEBSOCKET',
            url: this.websocket?.url,
            websocketUrl: this.websocketUrl,
            hasToken: !!this.token,
            tokenType: this.token === 'session-based' ? 'session' : this.token ? 'bearer' : 'none',
            reconnectionAttempts: this.reconnectionAttempts,
            timestamp: new Date().toISOString()
          });
          
          // ブラウザの詳細情報も出力
          console.error('🌐 ブラウザ環境詳細:', {
            userAgent: navigator.userAgent,
            onLine: navigator.onLine,
            language: navigator.language,
            cookieEnabled: navigator.cookieEnabled
          });
          
          reject(new Error(`WebSocket接続エラー: ${(error as any)?.message || 'unknown'} (readyState=${this.websocket?.readyState})`));
        };
      } catch (error) {
        console.error('❌ WebSocket接続エラー:', error);
        reject(error);
      }
    });
  }

  // セッションベース認証でのWebSocket接続
  private async connectWebSocketWithSession(): Promise<void> {
    console.log('🔌 セッションベースWebSocket接続試行');
    
    return new Promise((resolve, reject) => {
      try {
        // セッションベース認証では認証用のクッキーが自動で送信される
        console.log('🔗 WebSocket接続試行（セッション認証）:', this.websocketUrl);
        
        // クッキーを含むヘッダーを設定
        const headers: Record<string, string> = {};
        if (typeof document !== 'undefined') {
          headers['Cookie'] = document.cookie;
        }
        
        this.websocket = new WebSocket(this.websocketUrl);

        const connectTimeout = setTimeout(() => {
          if (this.websocket && this.websocket.readyState === WebSocket.CONNECTING) {
            console.warn('⏰ セッションベースWebSocket接続がタイムアウトしました');
            this.websocket.close();
            reject(new Error('セッションベースWebSocket接続タイムアウト'));
          }
        }, 15000); // タイムアウトを15秒に延長

        this.websocket.onopen = () => {
          clearTimeout(connectTimeout);
          console.log('✅ セッションベースWebSocket接続が確立されました');
          
          // セッションベース認証の場合も認証チャレンジを試行
          if (this.token && this.token !== 'session-based') {
            console.log('🔑 セッションベース認証でも認証チャレンジ送信を試行');
            const authChallenge = {
              seq: 1,
              action: 'authentication_challenge',
              data: {
                token: this.token
              }
            };
            this.websocket!.send(JSON.stringify(authChallenge));
          } else {
            console.log('🍪 クッキーベース認証のみで接続');
            // クッキー認証の場合は、すぐに接続成功とする
            this.reconnectionAttempts = 0;
            this.currentBackoffDelay = 1000;
            // helloメッセージを待つ
          }
        };

        let helloReceived = false;
        this.websocket.onmessage = (event) => {
          try {
            const wsData = JSON.parse(event.data);
            console.log('📨 セッションベースWebSocketメッセージ受信:', wsData);
            
            // 認証チャレンジの応答を確認（送信した場合）
            if (wsData.status === 'OK' && wsData.seq_reply === 1) {
              console.log('✅ セッションベース認証チャレンジ成功');
              if (!helloReceived) {
                resolve();
                helloReceived = true;
              }
              return;
            }
            
            // 通常のイベント処理
            if (wsData.event) {
              const wsEvent: WebSocketEvent = wsData;
              
              // hello イベントで接続成功を確認
              if (wsEvent.event === 'hello' && !helloReceived) {
                console.log('👋 WebSocket hello メッセージ受信 - 接続成功');
                helloReceived = true;
                resolve();
              }
              
              this.handleWebSocketEvent(wsEvent);
            }
          } catch (error) {
            console.error('❌ セッションベースWebSocketメッセージの解析エラー:', error);
            console.error('❌ 受信データ:', event.data);
          }
        };

        this.websocket.onclose = (event) => {
          clearTimeout(connectTimeout);
          console.log('🔌 セッションベースWebSocket接続が閉じられました:', { 
            code: event.code, 
            reason: event.reason,
            wasClean: event.wasClean
          });
          
          // 1006は異常終了、1011はサーバーエラー
          if (event.code === 1006) {
            console.warn('⚠️ WebSocket異常終了 - サーバー接続問題の可能性');
          } else if (event.code === 1011) {
            console.error('🚫 WebSocketサーバーエラー');
          }
        };

        this.websocket.onerror = (error) => {
          clearTimeout(connectTimeout);
          console.error('❌ セッションベースWebSocketエラー詳細:', {
            error,
            readyState: this.websocket?.readyState,
            url: this.websocket?.url
          });
          reject(new Error('セッションベースWebSocket接続エラー'));
        };
      } catch (error) {
        console.error('❌ セッションベースWebSocket接続エラー:', error);
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

  // WebSocket接続状態の詳細を取得
  getWebSocketStatus(): {
    connected: boolean;
    readyState: number | null;
    readyStateText: string;
    url: string | null;
    hasToken: boolean;
    tokenType: string;
    reconnectionAttempts: number;
  } {
    const readyStateMap: { [key: number]: string } = {
      0: 'CONNECTING',
      1: 'OPEN',
      2: 'CLOSING',
      3: 'CLOSED'
    };
    
    return {
      connected: this.isWebSocketConnected(),
      readyState: this.websocket?.readyState ?? null,
      readyStateText: this.websocket ? readyStateMap[this.websocket.readyState] || 'UNKNOWN' : 'NO_WEBSOCKET',
      url: this.websocket?.url ?? null,
      hasToken: !!this.token,
      tokenType: this.token === 'session-based' ? 'session' : this.token ? 'bearer' : 'none',
      reconnectionAttempts: this.reconnectionAttempts
    };
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