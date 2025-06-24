# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Mattermost + React チャットアプリケーション プロトタイプ

## プロジェクト概要

このプロジェクトは、Mattermostをバックエンドとして使用したReactチャットアプリケーションのプロトタイプです。リアルタイムメッセージング、チャンネル管理、およびスレッド機能を提供します。

## 必須開発コマンド

### 初期セットアップ
```bash
# 1. Mattermostサーバー起動（ルートディレクトリで実行）
docker-compose up -d

# 2. フロントエンド依存関係インストール
cd mattermost-chat-client
npm install
```

### 日常開発コマンド
```bash
# 開発サーバー起動（ブラウザ自動起動なし）
npm run dev

# Windows環境での開発サーバー起動
npm run dev:windows

# TypeScript型チェック（コンパイルなし）
npm run typecheck

# ビルド（TypeScript + Vite）
npm run build

# コード品質チェック
npm run lint

# プロダクションプレビュー
npm run preview
```

### テストコマンド
```bash
# 単体テスト実行（Jest）
npm run test

# 単体テスト（ウォッチモード）
npm run test:watch

# テストカバレッジレポート生成
npm run test:coverage

# E2Eテスト実行
npm run test:e2e

# UIモードでテスト（デバッグ用）
npm run test:e2e:ui

# ブラウザ表示付きテスト
npm run test:e2e:headed

# デバッグモードでE2Eテスト
npm run test:e2e:debug

# 単一テストファイル実行
npx playwright test tests/e2e/chat.spec.ts

# 特定のテスト実行（テスト名で絞り込み）
npx playwright test -g "should send message"
```

### AIアシスタント連携（MCP）
```bash
# Playwright MCPサーバー起動（ブラウザ自動化）
npm run mcp:start

# ヘッドレスモード
npm run mcp:headless
```

## 技術スタック

### バックエンド
- **Mattermost Team Edition**: オープンソースのチームコラボレーションプラットフォーム
- **PostgreSQL**: データベース
- **Docker & Docker Compose**: コンテナ化

### フロントエンド
- **React 18**: UIライブラリ
- **TypeScript**: 型安全性
- **Vite**: 開発・ビルドツール
- **Material-UI (MUI)**: UIコンポーネントライブラリ
- **Axios**: HTTP通信
- **WebSocket**: リアルタイム通信

### テスト・自動化
- **Jest**: 単体テストフレームワーク
- **Playwright**: E2Eテストフレームワーク
- **Playwright MCP**: AIアシスタント連携によるブラウザ自動化
- **ESLint**: コード品質チェック

## 高レベルアーキテクチャ

### システム構成
- **フロントエンド**: React SPA (http://localhost:5173)
- **バックエンド**: Mattermost Server (http://localhost:8065)
- **データベース**: PostgreSQL (Docker内)

### 主要なデータフロー
1. **認証**: フロント → Mattermost API → トークン取得 → ローカルストレージ保存
2. **リアルタイム通信**: WebSocket接続 → イベント受信 → React状態更新
3. **チャンネル判定**: チャンネルID長で実チャンネル/モックチャンネルを自動判別
4. **船舶チーム機能**: 船舶名/IDベースの動的チャンネル管理

### 状態管理アーキテクチャ
- **AppContext**: グローバル状態管理（useReducer + Context API）
  - ユーザー認証状態
  - チーム・チャンネル情報
  - メッセージ（posts）
  - WebSocket接続状態
- **ローカル状態**: 各コンポーネント内でuseStateで管理
- **永続化**: 重要データはlocalStorageに保存（セッション復元用）

### 重要：デュアルモードチャンネルシステム
このアプリは実Mattermostチャンネルとモックチャンネルの両方をサポートします：

```javascript
// チャンネル判定ロジック（ChatMiniView.tsxより）
const isRealMattermostChannel = (channelId: string) => channelId.length > 10;

// 実チャンネル例: "8xk5j3ngibyqmcwswx8s5r3w1a" (26文字)
// モックチャンネル例: "team1", "dev-team" (10文字以下)
```

**動作の違い:**
- **実チャンネル**: Mattermost API経由でメッセージ送受信、WebSocket更新
- **モックチャンネル**: ローカルステートでメッセージ管理、デモ用途

## ディレクトリ構造

```
mattermost-de-chat-room/
├── docker-compose.yml                 # Mattermost + PostgreSQL設定
├── CLAUDE.md                         # このドキュメント
├── DEVELOPMENT.md                    # 開発環境ガイド
├── WEBSOCKET_SETUP.md               # WebSocket設定ガイド
├── designdoc/                        # 設計ドキュメント
└── mattermost-chat-client/           # Reactクライアント
    ├── src/
    │   ├── api/
    │   │   └── mattermost.ts         # Mattermost APIクライアント
    │   ├── types/
    │   │   └── mattermost.ts         # TypeScript型定義
    │   ├── contexts/
    │   │   └── AppContext.tsx        # アプリケーション状態管理
    │   ├── components/
    │   │   ├── debug/               # デバッグコンポーネント
    │   │   ├── screens/             # 画面コンポーネント
    │   │   │   ├── LoginScreen.tsx  # ログイン画面
    │   │   │   ├── ChatScreen.tsx   # チャット画面
    │   │   │   └── VesselSelectionScreen.tsx # 船舶選択画面
    │   │   └── ui/                  # UIコンポーネント
    │   │       ├── channels/        # チャンネル関連
    │   │       ├── chat/           # チャット関連
    │   │       └── common/         # 共通コンポーネント
    │   ├── utils/                   # ユーティリティ関数
    │   └── App.tsx                  # メインアプリケーション
    ├── test-scripts/               # 自動テストスクリプト
    ├── CREDENTIALS.md              # 開発用認証情報
    ├── VESSEL-TEAMS-STATUS.md      # 船舶チーム実装状況
    ├── tests/e2e/                  # E2Eテスト
    ├── scripts/
    │   └── start-playwright-mcp.sh  # Playwright MCP起動スクリプト
    ├── docs/
    │   └── PLAYWRIGHT_MCP.md       # Playwright MCP統合ガイド
    ├── playwright-mcp-config.json  # MCP設定ファイル
    ├── playwright.config.ts        # Playwrightテスト設定
    ├── package.json
    └── vite.config.ts
```

## セットアップ手順

### 1. 前提条件

- Docker & Docker Compose
- Node.js 18+ & npm
- Git

### 2. リポジトリのクローン

```bash
git clone https://github.com/shogidemo/mattermost-de-chat-room.git
cd mattermost-de-chat-room
```

### 3. Mattermostサーバーの起動

```bash
# Mattermost + PostgreSQLコンテナを起動
docker-compose up -d

# ログの確認
docker-compose logs -f mattermost
```

### 4. Mattermostの初期設定

1. ブラウザで http://localhost:8065 にアクセス
2. 管理者アカウントを作成
3. チームを作成
4. **推奨チャンネル作成（統合テスト用）**:
   - 営業チーム (パブリックチャンネル)
   - 開発チーム (パブリックチャンネル)
   - 品質管理 (パブリックチャンネル)
   - 一般 (デフォルトで存在)

### 5. Reactクライアントの起動

```bash
cd mattermost-chat-client
npm install
npm run dev
```

ブラウザで http://localhost:5173 にアクセス

### 6. 開発用認証情報

開発環境では以下の認証情報を使用：
- **管理者アカウント**: admin / Admin123456!
- 詳細は `mattermost-chat-client/CREDENTIALS.md` を参照

## 機能一覧

### 実装済み機能

#### 認証・セッション管理
- ✅ ユーザー名/パスワードログイン
- ✅ 自動セッション復元
- ✅ ログアウト機能

#### チャンネル管理
- ✅ チーム一覧取得
- ✅ チャンネル一覧表示
- ✅ チャンネル選択・切り替え
- ✅ チャンネルタイプ別表示（パブリック、プライベート、DM、グループDM）
- ✅ **実チャンネルとモックチャンネルの統合表示**
- ✅ **セッション復元時の自動チャンネル読み込み**
- ✅ **船舶チーム機能（船舶ごとの専用チャンネル）**

#### メッセージング
- ✅ メッセージ送信
- ✅ メッセージ一覧表示
- ✅ リアルタイムメッセージ受信（WebSocket）
- ✅ メッセージの時刻表示
- ✅ ユーザー別メッセージグループ化
- ✅ **実際のMattermost APIとの統合完了**
- ✅ **WebSocketリアルタイム更新対応**
- ✅ **メッセージ永続化（ローカルストレージ）**

#### UI/UX
- ✅ Material-UI デザインシステム
- ✅ レスポンシブレイアウト
- ✅ ローディング状態表示
- ✅ エラーハンドリング
- ✅ 接続状態表示

#### テスト・自動化
- ✅ Playwright E2Eテスト設定
- ✅ Playwright MCP サーバー統合
- ✅ AIアシスタント連携ブラウザ自動化
- ✅ スクリーンショット・トレース機能

### 今後の拡張可能な機能

#### メッセージ機能
- 🔄 メッセージ編集・削除
- 🔄 スレッド返信機能
- 🔄 ファイル添付
- 🔄 絵文字リアクション
- 🔄 メンション機能
- 🔄 メッセージ検索

#### チャンネル管理
- 🔄 チャンネル作成・編集
- 🔄 チャンネル参加・退室
- 🔄 プライベートメッセージ
- 🔄 グループチャット作成

#### 通知・設定
- 🔄 デスクトップ通知
- 🔄 サウンド通知
- 🔄 ユーザー設定
- 🔄 テーマ切り替え

## 重要なコードパターン

### API通信パターン
```typescript
// src/api/mattermost.ts - シングルトンパターンで実装
const mattermostClient = new MattermostClient();

// トークン自動付与（Axiosインターセプター使用）
this.axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('mmAuthToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

### WebSocketイベント処理
```typescript
// AppContext.tsx - WebSocketイベントの統一処理
case 'posted':
  const newPost = JSON.parse(data.post);
  dispatch({
    type: 'ADD_POST',
    payload: { channelId: newPost.channel_id, post: newPost }
  });
  break;
```

### エラーハンドリング
```typescript
// 統一エラー処理パターン
try {
  const response = await mattermostClient.someApiCall();
  // 成功処理
} catch (error) {
  console.error('Error:', error);
  dispatch({ type: 'SET_ERROR', payload: error.message });
}
```

## 開発ガイド

### 開発環境での動作確認

このプロジェクトは外部ブラウザを開かない設定になっています。
以下の方法でVSCode内で動作確認ができます：

#### VSCode Simple Browserを使用

1. `Ctrl+Shift+P` (Mac: `Cmd+Shift+P`) でコマンドパレットを開く
2. "Simple Browser: Show" を実行
3. URLに `http://localhost:5173` を入力

#### ターミナルでの確認

開発サーバーが起動したら、ターミナルに表示される以下のメッセージを確認：
- "Local: http://localhost:5173/"
- "Network: use --host to expose"

### 新機能の追加

1. 型定義を `src/types/mattermost.ts` に追加
2. APIクライアントに必要なメソッドを追加
3. 状態管理にアクションとリデューサーを追加
4. UIコンポーネントを実装

### デバッグ

#### Mattermostサーバーの確認
```bash
# コンテナ状態確認
docker-compose ps

# ログ確認
docker-compose logs mattermost

# PostgreSQL接続確認
docker-compose exec postgres psql -U mmuser -d mattermost
```

#### フロントエンドのデバッグ
- ブラウザ開発者ツールのConsoleタブでログ確認
- Networkタブで API リクエスト/レスポンス確認
- WebSocket通信はApplicationタブで確認

## 重要なファイルの場所

### 新機能追加時に修正が必要なファイル
- **新コンポーネント追加**: `src/components/` に作成
- **API呼び出し追加**: `src/api/mattermost.ts` にメソッド追加
- **型定義追加**: `src/types/mattermost.ts` に型追加
- **グローバル状態追加**: `src/contexts/AppContext.tsx` のreducerに追加

### よく変更されるファイル
- **画面コンポーネント**: 
  - `src/components/screens/ChatScreen.tsx` - メインチャット画面
  - `src/components/screens/VesselSelectionScreen.tsx` - 船舶選択画面
  - `src/components/screens/LoginScreen.tsx` - ログイン画面
- **チャット関連**: 
  - `src/components/ui/chat/ChatView.tsx` - チャット表示の中核
  - `src/components/ui/chat/MessageList.tsx` - メッセージ一覧
  - `src/components/ui/chat/MessageInput.tsx` - メッセージ入力
- **チャンネル関連**: 
  - `src/components/ui/channels/ChannelList.tsx` - チャンネル一覧
  - `src/components/ui/channels/ChannelListItem.tsx` - チャンネル項目

## 設計ドキュメント (designdoc)

### 概要
このプロジェクトでは、設計の意図と決定理由を明確にするため、`designdoc/`フォルダに設計ドキュメントを管理しています。

### ドキュメント構成
- **architecture/**: システムアーキテクチャ設計
  - [overview.md](./designdoc/architecture/overview.md) - システム全体像
  - [state-management.md](./designdoc/architecture/state-management.md) - 状態管理設計
  - [dual-mode-channels.md](./designdoc/architecture/dual-mode-channels.md) - デュアルモードチャンネルシステム
  - [websocket-integration.md](./designdoc/architecture/websocket-integration.md) - WebSocket統合設計
- **features/**: 機能別設計書
  - [channel-filtering.md](./designdoc/features/channel-filtering.md) - チャンネルフィルタ機能
  - [mention-system.md](./designdoc/features/mention-system.md) - メンション機能
  - [chat-panel.md](./designdoc/features/chat-panel.md) - チャットパネルUI
- **decisions/**: 設計決定記録（ADR形式）
- **work-logs/**: 実装作業ログ

### ドキュメント参照ガイドライン
- **新機能追加時**: まず関連する設計ドキュメントを確認
- **実装で迷った時**: decisions/フォルダで過去の設計決定を確認
- **バグ修正時**: architecture/で全体の設計意図を理解してから修正

### 追加ドキュメント
- **DEVELOPMENT.md**: VSCode開発環境の設定、Windows環境対応
- **WEBSOCKET_SETUP.md**: WebSocket接続の詳細設定
- **test-scripts/README.md**: 自動テストスクリプトの使い方

### パフォーマンス最適化

- React.memo でコンポーネントの不要な再レンダリング防止
- useMemo、useCallback でパフォーマンス向上
- 仮想スクロールで大量メッセージの表示最適化
- メッセージのページング実装

## テスト

### E2Eテスト（Playwright）

基本的なユーザーフローのテスト：

```bash
# E2Eテストの実行
npm run test:e2e

# UIモードでテスト実行
npm run test:e2e:ui

# ヘッド付きモードでテスト実行
npm run test:e2e:headed
```

### Playwright MCP サーバー

AIアシスタント連携によるブラウザ自動化：

```bash
# MCP サーバーの起動
npm run mcp:start

# ヘッドレスモードで起動
npm run mcp:headless

# カスタム設定で起動
npm run mcp:server
```

**MCP サーバー機能：**
- Claude等のAIがブラウザを直接操作
- 自動テスト実行・バグ再現
- スクリーンショット・トレース記録
- リアルタイム動作確認

**詳細ガイド：** `docs/PLAYWRIGHT_MCP.md` を参照

テストシナリオ：
- ログイン・ログアウト
- チャンネル選択
- メッセージ送信・受信
- WebSocket接続確認
- レスポンシブデザイン検証

## Playwright MCP サーバー

AIアシスタントがブラウザを操作できるようにするツール。詳細は `docs/PLAYWRIGHT_MCP.md` を参照。

### 基本的な使い方
```bash
# MCPサーバー起動（AIアシスタントがブラウザ操作可能に）
npm run mcp:start

# 設定ファイル: playwright-mcp-config.json
# 出力先: ./test-results/
```

## セキュリティ考慮事項

### 開発環境
- CORS設定によりlocalhost:5173からのアクセスを許可
- HTTPSは本番環境でのみ必須

### 本番環境
- HTTPS必須
- CSRFトークンの実装
- 適切な認証トークン管理
- 環境変数による機密情報管理

## Mattermost API統合完了事項

### **Phase 1: 実データ統合** ✅
- 営業チームチャンネル（実チャンネル）での実際のMattermost APIデータ使用
- AppContextとChatMiniViewの統合によるシームレスなデータ管理
- 実チャンネル・モックチャンネルの自動判定と処理分岐

### **Phase 2: チャンネルリスト統合** ✅  
- 実際のMattermostチャンネルリストとモックチャンネルの統合表示
- セッション復元時の自動チーム・チャンネル読み込み
- 重複チャンネルの自動除外とマージ機能

### **Phase 3: WebSocketリアルタイム統合** ✅
- WebSocketイベントの詳細ログ出力と監視
- リアルタイムメッセージ受信の完全対応
- 投稿・更新・削除イベントの統合処理

### **統合アーキテクチャ**
```javascript
// チャンネル種別自動判定
const isRealMattermostChannel = (channelId) => channelId.length > 10;

// データソース統合
const messages = isRealMattermostChannel(channelId) 
  ? state.posts[channelId]     // 実データ (API + WebSocket)
  : localMessages;             // モックデータ

// 送信処理統合  
const send = isRealMattermostChannel(channelId)
  ? appSendMessage()           // Mattermost API
  : setLocalMessages();        // ローカル状態
```

## 既知の問題・制限事項

1. **ユーザー情報のキャッシュ**: 現在はユーザーIDのみでユーザー名を表示
2. **ファイルアップロード**: UIは実装済みだが、アップロード処理は未実装  
3. **絵文字機能**: アイコンのみで実際の絵文字ピッカーは未実装
4. **スレッド機能**: 基本構造は実装済みだが、UI上でのスレッド表示は未完成



## 船舶チーム機能

### 概要
船舶ごとに専用のチームとチャンネルを動的に管理する特別な機能。船舶選択画面から船舶を選択すると、その船舶専用のチャンネルにアクセスできます。

### 実装状況
- 詳細は `mattermost-chat-client/VESSEL-TEAMS-STATUS.md` を参照
- 船舶チーム管理APIは `/api/vessel-teams` エンドポイントで実装

### 関連ファイル
- `src/components/screens/VesselSelectionScreen.tsx` - 船舶選択画面
- `test-scripts/vessel/` - 船舶チーム関連のテストスクリプト

## 関連リンク

- [Mattermost API Documentation](https://api.mattermost.com/)
- [Material-UI Documentation](https://mui.com/)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)

## 開発ワークフロー

### 重要な教訓：実動作確認の必須化（2025年6月24日追加）

#### 問題事例
船舶チーム切り替え機能の修正時に、コードを修正してコミットしたが実際の動作確認を行わず、結果として問題が解決していない状態でPRに含まれてしまった。

#### 必須の開発フロー
```bash
1. コード修正
2. npm run dev でローカル環境起動
3. ブラウザで実際に機能を操作して動作確認
4. ブラウザコンソールでエラーがないことを確認
5. 期待する動作になっていることを確認
6. テストコマンド実行（npm run typecheck, npm run lint）
7. 上記すべて完了後にコミット
```

#### エラーハンドリングの原則
```javascript
// ❌ 悪い例：エラーを隠蔽
try {
  await someFunction();
} catch (error) {
  console.error('エラー:', error);
  // 処理を続行（問題が見えなくなる）
}

// ✅ 良い例：エラーを可視化
try {
  await someFunction();
} catch (error) {
  console.error('エラー:', error);
  alert(`処理に失敗しました: ${error.message}`);
  throw error; // 必要に応じて再スロー
}
```

#### コミット前チェックリスト
- [ ] `npm run dev` で動作確認した
- [ ] ブラウザコンソールにエラーがない
- [ ] 期待する画面・動作になっている
- [ ] エラー時の挙動も確認した
- [ ] `npm run typecheck` が通る
- [ ] `npm run lint` が通る（または既知の問題のみ）

### 作業完了後のプルリクエスト作成

Claude Codeは機能実装や修正作業を完了した後、必ず以下の手順でプルリクエストを作成し、レビューを求めます：

1. **ブランチの作成と作業**
   - 新機能や修正は必ず専用のfeatureブランチで作業
   - ブランチ名は `feature/機能名` または `fix/修正内容` の形式

2. **コミットとプッシュ**
   - 変更内容を明確に記述したコミットメッセージ
   - リモートリポジトリへのプッシュ

3. **プルリクエストの作成**
   ```bash
   gh pr create --title "タイトル" --body "詳細な説明"
   ```
   
   PRには以下を含める：
   - 実装内容の概要
   - 主な変更ファイル
   - テスト結果
   - スクリーンショット（UI変更の場合）
   - レビューポイント

4. **レビュー依頼**
   - PR作成後、必ずユーザーにレビューを依頼
   - PR URLを提示してフィードバックを求める

この手順により、コードの品質を保ち、変更内容の透明性を確保します。

### 作業実行の原則（2025年6月24日追加）

#### 重要：Claude Codeは可能な限り自力で作業を実行する

**実行する作業の例：**
- コード修正・実装
- テストコマンドの実行（npm test, npm run lint等）
- セットアップスクリプトの実行
- デバッグスクリプトの実行
- ドキュメント作成・更新
- git操作（コミット、プッシュ、PR作成）

**ユーザーに依頼する必要がある作業：**
- 管理者権限が必要な作業（例：Mattermost管理画面での設定）
- ローカル環境固有の認証情報設定（例：パスワード入力）
- 手動でのブラウザ操作が必要な確認（例：UI動作確認）
- 外部サービスへのアクセス権限設定

**作業を依頼する際の原則：**
1. まず自力で実行を試みる
2. 実行できない場合は、理由を明確に説明する
3. 代替手段があれば提案する
4. どうしても無理な場合のみ、具体的な手順と共に依頼する

---

**作成日**: 2025-06-17  
**最終更新**: 2025-06-24  
**作成者**: Claude Code
