// ユーザー情報を表す型
export interface User {
  id: string;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  nickname?: string;
  locale?: string;
  create_at: number;
  update_at: number;
  delete_at: number;
  roles?: string;
  auth_service?: string;
  timezone?: Record<string, any>;
}

// チーム情報を表す型
export interface Team {
  id: string;
  create_at: number;
  update_at: number;
  delete_at: number;
  display_name: string;
  name: string;
  description?: string;
  email?: string;
  type: 'O' | 'I'; // Open or Invite
  company_name?: string;
  allowed_domains?: string;
  invite_id?: string;
  allow_open_invite?: boolean;
  scheme_id?: string | null;
}

// チャンネル情報を表す型
export interface Channel {
  id: string;
  create_at: number;
  update_at: number;
  delete_at: number;
  team_id: string;
  type: 'O' | 'P' | 'D' | 'G'; // Open, Private, Direct, Group
  display_name: string;
  name: string;
  header?: string;
  purpose?: string;
  last_post_at: number;
  total_msg_count: number;
  extra_update_at: number;
  creator_id?: string;
  scheme_id?: string | null;
}

// 最新メッセージプレビュー付きチャンネル情報
export interface ChannelWithPreview extends Channel {
  lastMessage?: {
    content: string;
    timestamp: number;
    userId: string;
    userName?: string;
  };
  unreadCount?: number;
}

// 投稿（メッセージ）情報を表す型
export interface Post {
  id: string;
  create_at: number;
  update_at: number;
  edit_at: number;
  delete_at: number;
  is_pinned: boolean;
  user_id: string;
  channel_id: string;
  root_id?: string; // スレッドのルート投稿ID
  parent_id?: string; // 直前の親投稿ID
  original_id?: string;
  message: string;
  type?: string;
  props?: Record<string, any>;
  hashtags?: string;
  pending_post_id?: string;
  reply_count?: number;
  last_reply_at?: number;
  participants?: string[];
  metadata?: PostMetadata;
}

// 投稿のメタデータ
export interface PostMetadata {
  embeds?: PostEmbed[];
  emojis?: Emoji[];
  files?: FileInfo[];
  images?: Record<string, PostImage>;
  reactions?: Reaction[];
}

// 投稿の埋め込み情報
export interface PostEmbed {
  type: string;
  url: string;
  data?: Record<string, any>;
}

// 投稿の画像情報
export interface PostImage {
  height: number;
  width: number;
}

// ファイル情報
export interface FileInfo {
  id: string;
  user_id: string;
  post_id: string;
  create_at: number;
  update_at: number;
  delete_at: number;
  name: string;
  extension: string;
  size: number;
  mime_type: string;
  width?: number;
  height?: number;
  has_preview_image?: boolean;
}

// 絵文字情報
export interface Emoji {
  id: string;
  create_at: number;
  update_at: number;
  delete_at: number;
  creator_id: string;
  name: string;
}

// リアクション情報
export interface Reaction {
  user_id: string;
  post_id: string;
  emoji_name: string;
  create_at: number;
}

// WebSocketイベント
export interface WebSocketEvent {
  event: string;
  data: Record<string, any>;
  broadcast: {
    omit_users?: Record<string, boolean>;
    user_id?: string;
    channel_id?: string;
    team_id?: string;
  };
  seq: number;
}

// ログイン認証情報
export interface LoginCredentials {
  login_id: string; // username or email
  password: string;
}

// ログインレスポンス
export interface LoginResponse {
  token: string;
  user: User;
}

// API エラーレスポンス
export interface APIError {
  id: string;
  message: string;
  detailed_error?: string;
  request_id?: string;
  status_code: number;
}

// チャンネルメンバー情報
export interface ChannelMember {
  channel_id: string;
  user_id: string;
  roles: string;
  last_viewed_at: number;
  msg_count: number;
  mention_count: number;
  notify_props: {
    desktop?: string;
    email?: string;
    mark_unread?: string;
    push?: string;
    ignore_channel_mentions?: string;
  };
  last_update_at: number;
  scheme_guest?: boolean;
  scheme_user?: boolean;
  scheme_admin?: boolean;
  explicit_roles?: string;
}

// チームメンバー情報
export interface TeamMember {
  team_id: string;
  user_id: string;
  roles: string;
  delete_at: number;
  scheme_guest?: boolean;
  scheme_user?: boolean;
  scheme_admin?: boolean;
  explicit_roles?: string;
}

// アプリケーション状態
export interface AppState {
  user: User | null;
  currentTeam: Team | null;
  currentChannel: Channel | null;
  channels: Channel[];
  posts: Record<string, Post[]>; // channel_id -> posts
  users: Record<string, User>; // user_id -> user info (キャッシュ)
  lastReadPosts: Record<string, string>; // channel_id -> last_read_post_id (未読管理)
  isLoading: boolean;
  error: string | null;
  isConnected: boolean; // WebSocket接続状態
}

// チャンネル作成リクエスト
export interface CreateChannelRequest {
  team_id: string;
  name: string;
  display_name: string;
  purpose?: string;
  header?: string;
  type: 'O' | 'P';
}

// 投稿作成リクエスト
export interface CreatePostRequest {
  channel_id: string;
  message: string;
  root_id?: string; // スレッド返信の場合
  file_ids?: string[];
  props?: Record<string, any>;
}