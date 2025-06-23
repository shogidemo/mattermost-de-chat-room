# システムアーキテクチャ概要

## 概要

このドキュメントは、Mattermost + React チャットアプリケーションの全体的なアーキテクチャを説明します。本システムは、既存のMattermostサーバーをバックエンドとして活用し、React SPAでモダンなチャットUIを提供するプロトタイプです。

## システム構成

### 3層アーキテクチャ

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (React SPA)                    │
│                   http://localhost:5173                   │
│  ┌─────────────┐ ┌──────────────┐ ┌──────────────────┐ │
│  │ Components  │ │ State Mgmt   │ │ API Client       │ │
│  │ (React/MUI) │ │ (Context API)│ │ (Axios)          │ │
│  └─────────────┘ └──────────────┘ └──────────────────┘ │
└─────────────────────────────────────────────────────────┘
                              │
                    HTTP/WebSocket
                              │
┌─────────────────────────────────────────────────────────┐
│                  Backend (Mattermost)                     │
│                  http://localhost:8065                    │
│  ┌─────────────┐ ┌──────────────┐ ┌──────────────────┐ │
│  │ REST API    │ │ WebSocket    │ │ Authentication   │ │
│  │ (v4 API)    │ │ (Real-time)  │ │ (JWT Tokens)     │ │
│  └─────────────┘ └──────────────┘ └──────────────────┘ │
└─────────────────────────────────────────────────────────┘
                              │
                          PostgreSQL
                              │
┌─────────────────────────────────────────────────────────┐
│                    Database (PostgreSQL)                  │
│  ┌─────────────┐ ┌──────────────┐ ┌──────────────────┐ │
│  │ Users       │ │ Channels     │ │ Posts            │ │
│  │ Teams       │ │ Members      │ │ Files            │ │
│  └─────────────┘ └──────────────┘ └──────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## 主要コンポーネント

### 1. Frontend層

#### UI Components
- **Material-UI (MUI)** ベースのコンポーネント群
- レスポンシブデザイン対応
- フローティングチャットパネル（ドラッグ可能）

#### State Management
- **React Context API + useReducer** による集中状態管理
- グローバル状態: ユーザー、チーム、チャンネル、メッセージ
- ローカル状態: UI状態、一時的なデータ

#### API Client
- **Axios** ベースのHTTPクライアント
- 自動トークン付与（Interceptor）
- エラーハンドリングの統一

### 2. Backend層（Mattermost）

#### REST API
- Mattermost v4 API
- 認証、チャンネル管理、メッセージ投稿
- CORS対応（開発環境）

#### WebSocket
- リアルタイムメッセージ配信
- イベントベースの更新通知
- 自動再接続機能

### 3. データ永続化

#### ローカルストレージ
- 認証トークン
- ユーザー情報
- セッション状態

#### PostgreSQL（Mattermost側）
- すべての永続的データ
- Mattermostが管理

## データフロー

### 1. 認証フロー
```
ユーザー入力 → LoginForm → API Client → Mattermost API
                                ↓
LocalStorage ← AppContext ← 認証トークン
```

### 2. メッセージ送信フロー
```
メッセージ入力 → MessageInput → AppContext → API Client → Mattermost API
                                                    ↓
                                              PostgreSQL
                                                    ↓
WebSocket ← 全クライアントへ配信 ← Mattermost
```

### 3. リアルタイム更新フロー
```
WebSocket Event → AppContext (Reducer) → UI更新
                        ↓
                  State更新
```

## 特徴的な設計

### デュアルモードチャンネルシステム

本システムの特徴的な設計として、実Mattermostチャンネルとモック（デモ）チャンネルの両方をサポートしています。

```javascript
// チャンネル判定ロジック
const isRealMattermostChannel = (channelId) => channelId.length > 10;
```

詳細は [dual-mode-channels.md](./dual-mode-channels.md) を参照。

### 開発環境最適化

- **ブラウザ自動起動の無効化**: VSCode内での開発を考慮
- **Viteプロキシ設定**: CORS問題の回避
- **ホットリロード**: 開発効率の向上

## セキュリティ考慮事項

### 開発環境
- HTTPでの動作（localhost only）
- CORSの緩和設定
- デバッグ情報の出力

### 本番環境（想定）
- HTTPS必須
- 適切なCORS設定
- 環境変数による設定管理
- セキュアなトークン管理

## スケーラビリティ

### 現在の制限
- 単一Mattermostサーバーへの依存
- クライアント側でのメッセージキャッシュ
- ページネーションの未実装

### 将来の拡張性
- マイクロサービス化の可能性
- 独自バックエンドの追加
- キャッシュ層の導入（Redis等）

## 関連ドキュメント

- [状態管理設計](./state-management.md)
- [デュアルモードチャンネルシステム](./dual-mode-channels.md) 
- [WebSocket統合設計](./websocket-integration.md)
- [CLAUDE.md](../../CLAUDE.md) - 開発者向けクイックリファレンス

---

作成日: 2025-01-21  
最終更新: 2025-01-21