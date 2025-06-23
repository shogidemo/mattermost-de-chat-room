import axios from 'axios';
import MattermostClient from '../mattermost';
import type { LoginCredentials, User, Channel, Post } from '../../types/mattermost';

// axios をモック
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// WebSocket のモック
const mockWebSocket = {
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  readyState: 1, // OPEN
  url: 'ws://localhost:8065/api/v4/websocket',
  onopen: null,
  onmessage: null,
  onclose: null,
  onerror: null,
};

(global as any).WebSocket = jest.fn(() => mockWebSocket);

describe('MattermostClient', () => {
  let client: MattermostClient;
  let mockAxiosInstance: jest.Mocked<any>;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    
    // axios.create のモック
    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        request: {
          use: jest.fn(),
        },
        response: {
          use: jest.fn(),
        },
      },
    };
    
    mockedAxios.create.mockReturnValue(mockAxiosInstance);
    
    client = new MattermostClient('http://localhost:8065');
  });

  afterEach(() => {
    // WebSocket のクリーンアップ
    if ((client as any).websocket) {
      (client as any).websocket = null;
    }
  });

  describe('constructor', () => {
    it('axios インスタンスが正しく設定される', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'http://localhost:8065/api/v4',
        timeout: 10000,
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
    });

    it('インターセプターが設定される', () => {
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const mockCredentials: LoginCredentials = {
      login_id: 'testuser',
      password: 'testpass',
    };

    const mockUser: User = {
      id: 'user-id',
      username: 'testuser',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      nickname: '',
      auth_service: '',
      roles: 'user',
      locale: 'en',
      timezone: { useAutomaticTimezone: true, automaticTimezone: '', manualTimezone: '' },
      position: '',
      props: {},
      notify_props: {},
      last_password_update: Date.now(),
      last_picture_update: 0,
      create_at: Date.now(),
      update_at: Date.now(),
      delete_at: 0,
    };

    it('正常なログインが成功する', async () => {
      const mockResponse = {
        data: mockUser,
        headers: {
          token: 'mock-token',
        },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await client.login(mockCredentials);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/users/login', mockCredentials, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Content-Type': 'application/json',
        },
      });

      expect(result).toEqual({
        token: 'mock-token',
        user: mockUser,
      });

      expect(localStorage.getItem('mattermost_token')).toBe('mock-token');
      expect(localStorage.getItem('mattermost_user')).toBe(JSON.stringify(mockUser));
    });

    it('トークンがヘッダーにない場合セッションベース認証を使用する', async () => {
      const mockResponse = {
        data: mockUser,
        headers: {}, // トークンなし
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await client.login(mockCredentials);

      expect(result.token).toBe('session-based');
      expect(localStorage.getItem('mattermost_token')).toBe('session-based');
    });

    it('ログインエラーが適切に処理される', async () => {
      const mockError = {
        response: {
          status: 401,
          data: {
            id: 'login_failed',
            message: 'Invalid credentials',
          },
        },
      };

      mockAxiosInstance.post.mockRejectedValue(mockError);

      await expect(client.login(mockCredentials)).rejects.toEqual({
        id: 'login_failed',
        message: 'Invalid credentials',
        status_code: 401,
      });
    });
  });

  describe('logout', () => {
    it('正常にログアウトできる', async () => {
      // セットアップ: ログイン状態にする
      localStorage.setItem('mattermost_token', 'test-token');
      localStorage.setItem('mattermost_user', JSON.stringify({ id: 'user-id' }));

      mockAxiosInstance.post.mockResolvedValue({});

      await client.logout();

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/users/logout');
      expect(localStorage.getItem('mattermost_token')).toBeNull();
      expect(localStorage.getItem('mattermost_user')).toBeNull();
    });

    it('ログアウトAPIエラーでもローカルデータはクリアされる', async () => {
      localStorage.setItem('mattermost_token', 'test-token');
      localStorage.setItem('mattermost_user', JSON.stringify({ id: 'user-id' }));

      mockAxiosInstance.post.mockRejectedValue(new Error('API Error'));

      await client.logout();

      expect(localStorage.getItem('mattermost_token')).toBeNull();
      expect(localStorage.getItem('mattermost_user')).toBeNull();
    });
  });

  describe('restoreSession', () => {
    it('保存されたセッションを復元する', () => {
      const mockUser = { id: 'user-id', username: 'testuser' };
      localStorage.setItem('mattermost_token', 'stored-token');
      localStorage.setItem('mattermost_user', JSON.stringify(mockUser));

      const result = client.restoreSession();

      expect(result).toEqual(mockUser);
      expect(client.getToken()).toBe('stored-token');
    });

    it('無効なユーザーデータの場合はnullを返す', () => {
      localStorage.setItem('mattermost_token', 'stored-token');
      localStorage.setItem('mattermost_user', 'invalid-json');

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = client.restoreSession();

      expect(result).toBeNull();
      expect(localStorage.getItem('mattermost_token')).toBeNull();
      
      consoleSpy.mockRestore();
    });

    it('保存データがない場合はnullを返す', () => {
      const result = client.restoreSession();
      expect(result).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('現在のユーザー情報を取得する', async () => {
      const mockUser = { id: 'user-id', username: 'testuser' };
      mockAxiosInstance.get.mockResolvedValue({ data: mockUser });

      const result = await client.getCurrentUser();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/users/me');
      expect(result).toEqual(mockUser);
    });
  });

  describe('getUserById', () => {
    it('指定されたユーザーの情報を取得する', async () => {
      const mockUser = { id: 'user-id', username: 'testuser' };
      mockAxiosInstance.get.mockResolvedValue({ data: mockUser });

      const result = await client.getUserById('user-id');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/users/user-id');
      expect(result).toEqual(mockUser);
    });
  });

  describe('searchUsers', () => {
    it('ユーザーを検索する', async () => {
      const mockUsers = [
        { id: 'user1', username: 'user1' },
        { id: 'user2', username: 'user2' },
      ];
      mockAxiosInstance.post.mockResolvedValue({ data: { users: mockUsers } });

      const result = await client.searchUsers('test', 'team-id');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/users/search', {
        term: 'test',
        team_id: 'team-id',
        limit: 20,
      });
      expect(result).toEqual(mockUsers);
    });

    it('検索エラーの場合は空配列を返す', async () => {
      mockAxiosInstance.post.mockRejectedValue(new Error('Search failed'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await client.searchUsers('test');

      expect(result).toEqual([]);
      
      consoleSpy.mockRestore();
    });
  });

  describe('getChannelsForTeam', () => {
    it('チームのチャンネル一覧を取得する', async () => {
      const mockChannels: Channel[] = [
        {
          id: 'channel1',
          name: 'general',
          display_name: 'General',
          type: 'O',
          team_id: 'team-id',
          creator_id: 'user-id',
          header: '',
          purpose: '',
          last_post_at: Date.now(),
          total_msg_count: 0,
          extra_update_at: 0,
          create_at: Date.now(),
          update_at: Date.now(),
          delete_at: 0,
        },
      ];

      mockAxiosInstance.get.mockResolvedValue({ data: mockChannels });

      const result = await client.getChannelsForTeam('team-id');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/teams/team-id/channels');
      expect(result).toEqual(mockChannels);
    });

    it('フォールバック処理でチャンネルを取得する', async () => {
      const mockChannels: Channel[] = [
        {
          id: 'channel1',
          name: 'general',
          display_name: 'General',
          type: 'O',
          team_id: 'team-id',
          creator_id: 'user-id',
          header: '',
          purpose: '',
          last_post_at: Date.now(),
          total_msg_count: 0,
          extra_update_at: 0,
          create_at: Date.now(),
          update_at: Date.now(),
          delete_at: 0,
        },
        {
          id: 'channel2',
          name: 'random',
          display_name: 'Random',
          type: 'O',
          team_id: 'other-team-id',
          creator_id: 'user-id',
          header: '',
          purpose: '',
          last_post_at: Date.now(),
          total_msg_count: 0,
          extra_update_at: 0,
          create_at: Date.now(),
          update_at: Date.now(),
          delete_at: 0,
        },
      ];

      // 最初のAPIコールは失敗
      mockAxiosInstance.get
        .mockRejectedValueOnce(new Error('API Error'))
        // フォールバックAPIコールは成功
        .mockResolvedValueOnce({ data: mockChannels });

      const result = await client.getChannelsForTeam('team-id');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/teams/team-id/channels');
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/channels');
      expect(result).toEqual([mockChannels[0]]); // team-idに一致するもののみ
    });
  });

  describe('createPost', () => {
    it('投稿を作成する', async () => {
      const mockPost: Post = {
        id: 'post-id',
        create_at: Date.now(),
        update_at: Date.now(),
        edit_at: 0,
        delete_at: 0,
        is_pinned: false,
        user_id: 'user-id',
        channel_id: 'channel-id',
        root_id: '',
        parent_id: '',
        original_id: '',
        message: 'Test message',
        type: '',
        props: {},
        hashtags: '',
        pending_post_id: '',
        reply_count: 0,
        last_reply_at: 0,
        participants: null,
        metadata: {},
      };

      mockAxiosInstance.post.mockResolvedValue({ data: mockPost });

      const postData = {
        channel_id: 'channel-id',
        message: 'Test message',
      };

      const result = await client.createPost(postData);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/posts', postData);
      expect(result).toEqual(mockPost);
    });
  });

  describe('WebSocket関連', () => {
    it('WebSocket接続状態を確認できる', () => {
      // 初期状態では未接続
      expect(client.isWebSocketConnected()).toBe(false);

      // WebSocketをモック
      (client as any).websocket = mockWebSocket;
      expect(client.isWebSocketConnected()).toBe(true);
    });

    it('WebSocket状態の詳細を取得できる', () => {
      const status = client.getWebSocketStatus();
      
      expect(status).toEqual({
        connected: false,
        readyState: null,
        readyStateText: 'NO_WEBSOCKET',
        url: null,
        hasToken: false,
        tokenType: 'none',
        reconnectionAttempts: 0,
      });
    });

    it('WebSocketイベントハンドラーを登録・削除できる', () => {
      const mockHandler = jest.fn();

      client.onWebSocketEvent('test_event', mockHandler);
      
      // イベントハンドラーの内部状態を確認
      const eventHandlers = (client as any).eventHandlers;
      expect(eventHandlers.get('test_event')).toContain(mockHandler);

      client.offWebSocketEvent('test_event', mockHandler);
      expect(eventHandlers.get('test_event')).not.toContain(mockHandler);
    });
  });

  describe('ユーティリティメソッド', () => {
    it('認証状態を正しく判定する', () => {
      // 初期状態では未認証
      expect(client.isAuthenticated()).toBe(false);

      // トークンを設定
      (client as any).token = 'test-token';
      expect(client.isAuthenticated()).toBe(true);

      // セッションベース認証
      (client as any).token = 'session-based';
      expect(client.isAuthenticated()).toBe(true);
    });

    it('トークンを正しく取得する', () => {
      expect(client.getToken()).toBeNull();

      (client as any).token = 'test-token';
      expect(client.getToken()).toBe('test-token');
    });
  });

  describe('uploadFile', () => {
    it('ファイルをアップロードする', async () => {
      const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
      const mockResponse = {
        file_infos: [{ id: 'file-id', name: 'test.txt' }],
      };

      mockAxiosInstance.post.mockResolvedValue({ data: mockResponse });

      const result = await client.uploadFile(mockFile, 'channel-id');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/files',
        expect.any(FormData),
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      expect(result).toEqual(mockResponse);
    });
  });
});