import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AppProvider, useApp } from '../AppContext';
import MattermostClient from '../../api/mattermost';
import type { User, Team, Channel } from '../../types/mattermost';

// MattermostClient をモック
jest.mock('../../api/mattermost');

const MockedMattermostClient = MattermostClient as jest.MockedClass<typeof MattermostClient>;

// ロケールストレージモック（既に test-setup.ts でモック済み）

// テスト用コンポーネント
const TestComponent: React.FC = () => {
  const { state, login, logout, selectTeam, selectChannel } = useApp();
  
  return (
    <div>
      <div data-testid="user">{state.user?.username || 'No user'}</div>
      <div data-testid="loading">{state.isLoading ? 'Loading' : 'Not loading'}</div>
      <div data-testid="error">{state.error || 'No error'}</div>
      <div data-testid="connected">{state.isConnected ? 'Connected' : 'Not connected'}</div>
      <div data-testid="team">{state.currentTeam?.name || 'No team'}</div>
      <div data-testid="channel">{state.currentChannel?.name || 'No channel'}</div>
      <div data-testid="channels-count">{state.channels.length}</div>
      
      <button 
        onClick={() => login('testuser', 'testpass')}
        data-testid="login-button"
      >
        Login
      </button>
      <button 
        onClick={() => logout()}
        data-testid="logout-button"
      >
        Logout
      </button>
    </div>
  );
};

const renderWithProvider = () => {
  return render(
    <AppProvider>
      <TestComponent />
    </AppProvider>
  );
};

describe('AppContext', () => {
  let mockClient: jest.Mocked<MattermostClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    
    // MattermostClient のモックインスタンスを作成
    mockClient = {
      restoreSession: jest.fn(),
      login: jest.fn(),
      logout: jest.fn(),
      getTeamsForUser: jest.fn(),
      getMyChannelsForTeam: jest.fn(),
      getPostsForChannel: jest.fn(),
      createPost: jest.fn(),
      connectWebSocket: jest.fn(),
      disconnectWebSocket: jest.fn(),
      isWebSocketConnected: jest.fn(),
      onWebSocketEvent: jest.fn(),
      isAuthenticated: jest.fn(),
      getToken: jest.fn(),
      clearSession: jest.fn(),
      getCurrentUser: jest.fn(),
      getUserById: jest.fn(),
      getLatestPostForChannel: jest.fn(),
    } as any;

    MockedMattermostClient.mockImplementation(() => mockClient);
  });

  describe('初期化', () => {
    it('デフォルト状態で初期化される', () => {
      mockClient.restoreSession.mockReturnValue(null);
      
      renderWithProvider();
      
      expect(screen.getByTestId('user')).toHaveTextContent('No user');
      expect(screen.getByTestId('loading')).toHaveTextContent('Not loading');
      expect(screen.getByTestId('error')).toHaveTextContent('No error');
      expect(screen.getByTestId('connected')).toHaveTextContent('Not connected');
      expect(screen.getByTestId('team')).toHaveTextContent('No team');
      expect(screen.getByTestId('channel')).toHaveTextContent('No channel');
      expect(screen.getByTestId('channels-count')).toHaveTextContent('0');
    });

    it('localStorage からセッションを復元する', () => {
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

      mockClient.restoreSession.mockReturnValue(mockUser);
      mockClient.getCurrentUser.mockResolvedValue(mockUser);
      mockClient.getTeamsForUser.mockResolvedValue([]);

      renderWithProvider();

      expect(screen.getByTestId('user')).toHaveTextContent('testuser');
    });
  });

  describe('ログイン機能', () => {
    it('正常にログインできる', async () => {
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

      const mockTeam: Team = {
        id: 'team-id',
        name: 'test-team',
        display_name: 'Test Team',
        type: 'O',
        email: 'team@example.com',
        company_name: '',
        allowed_domains: '',
        invite_id: '',
        allow_open_invite: true,
        create_at: Date.now(),
        update_at: Date.now(),
        delete_at: 0,
        description: '',
        scheme_id: null,
        group_constrained: false,
        policy_id: null,
      };

      mockClient.restoreSession.mockReturnValue(null);
      mockClient.login.mockResolvedValue({ token: 'test-token', user: mockUser });
      mockClient.getTeamsForUser.mockResolvedValue([mockTeam]);
      mockClient.getMyChannelsForTeam.mockResolvedValue([]);
      mockClient.connectWebSocket.mockResolvedValue();

      renderWithProvider();

      expect(screen.getByTestId('user')).toHaveTextContent('No user');

      act(() => {
        screen.getByTestId('login-button').click();
      });

      // ローディング状態の確認
      expect(screen.getByTestId('loading')).toHaveTextContent('Loading');

      // ログイン完了まで待機
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('testuser');
      });

      expect(screen.getByTestId('loading')).toHaveTextContent('Not loading');
      expect(mockClient.login).toHaveBeenCalledWith({
        login_id: 'testuser',
        password: 'testpass',
      });
    });

    it('ログインエラーが適切に処理される', async () => {
      mockClient.restoreSession.mockReturnValue(null);
      mockClient.login.mockRejectedValue(new Error('Invalid credentials'));

      renderWithProvider();

      act(() => {
        screen.getByTestId('login-button').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Invalid credentials');
      });

      expect(screen.getByTestId('loading')).toHaveTextContent('Not loading');
      expect(screen.getByTestId('user')).toHaveTextContent('No user');
    });
  });

  describe('ログアウト機能', () => {
    it('正常にログアウトできる', async () => {
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

      mockClient.restoreSession.mockReturnValue(mockUser);
      mockClient.logout.mockResolvedValue();
      mockClient.disconnectWebSocket.mockImplementation(() => {});

      renderWithProvider();

      // ユーザーがログイン状態であることを確認
      expect(screen.getByTestId('user')).toHaveTextContent('testuser');

      act(() => {
        screen.getByTestId('logout-button').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('No user');
      });

      expect(screen.getByTestId('team')).toHaveTextContent('No team');
      expect(screen.getByTestId('channel')).toHaveTextContent('No channel');
      expect(mockClient.logout).toHaveBeenCalled();
    });
  });

  describe('useApp フック', () => {
    it('AppProvider外で使用するとエラーになる', () => {
      const TestComponentOutsideProvider = () => {
        const { state } = useApp();
        return <div>{state.user?.username}</div>;
      };

      // エラーのログを抑制
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        render(<TestComponentOutsideProvider />);
      }).toThrow('useApp は AppProvider 内で使用する必要があります');

      consoleSpy.mockRestore();
    });
  });

  describe('エラーハンドリング', () => {
    it('ローディング状態が適切に管理される', async () => {
      mockClient.restoreSession.mockReturnValue(null);
      
      // 遅延を伴うログインをモック
      let resolveLogin: (value: any) => void;
      const loginPromise = new Promise((resolve) => {
        resolveLogin = resolve;
      });
      mockClient.login.mockReturnValue(loginPromise as any);

      renderWithProvider();

      act(() => {
        screen.getByTestId('login-button').click();
      });

      // ローディング状態であることを確認
      expect(screen.getByTestId('loading')).toHaveTextContent('Loading');

      // ログインを完了
      act(() => {
        resolveLogin!({
          token: 'test-token',
          user: {
            id: 'user-id',
            username: 'testuser',
            email: 'test@example.com',
          },
        });
      });

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not loading');
      });
    });
  });

  describe('状態の永続化', () => {
    it('localStorage からデータが正しく復元される', () => {
      const mockTeam = { id: 'team-id', name: 'test-team' };
      const mockChannel = { id: 'channel-id', name: 'general' };
      const mockChannels = [mockChannel];

      localStorage.setItem('mattermost_current_team', JSON.stringify(mockTeam));
      localStorage.setItem('mattermost_current_channel', JSON.stringify(mockChannel));
      localStorage.setItem('mattermost_channels', JSON.stringify(mockChannels));

      mockClient.restoreSession.mockReturnValue(null);

      renderWithProvider();

      expect(screen.getByTestId('team')).toHaveTextContent('test-team');
      expect(screen.getByTestId('channel')).toHaveTextContent('general');
      expect(screen.getByTestId('channels-count')).toHaveTextContent('1');
    });

    it('不正な localStorage データを適切に処理する', () => {
      localStorage.setItem('mattermost_current_team', 'invalid-json');
      localStorage.setItem('mattermost_channels', '[invalid json}');

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockClient.restoreSession.mockReturnValue(null);

      renderWithProvider();

      // エラーがログに出力されることを確認
      expect(consoleSpy).toHaveBeenCalled();

      // デフォルト状態になることを確認
      expect(screen.getByTestId('team')).toHaveTextContent('No team');
      expect(screen.getByTestId('channels-count')).toHaveTextContent('0');

      consoleSpy.mockRestore();
    });
  });
});