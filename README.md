# Mattermost デモチャットルーム

船舶運航管理システム向けのMattermost統合チャットアプリケーション

## 概要

本プロジェクトは、船舶運航管理システムにリアルタイムチャット機能を統合するためのReact + TypeScriptアプリケーションです。Mattermost APIとWebSocketを使用してリアルタイム通信を実現しています。

## 主な機能

- 🚢 船舶選択からチャット画面への統合フロー
- 💬 Mattermostとのリアルタイム双方向通信
- 🔍 チャンネルフィルタリング・検索機能
- 📱 ドラッグ可能なフローティングチャットUI
- 🔄 WebSocketによる自動更新
- 👥 @メンション機能

## アーキテクチャ

- **フロントエンド**: React 18 + TypeScript + Material-UI
- **状態管理**: React Context API + useReducer
- **リアルタイム通信**: Mattermost WebSocket API
- **テスト**: Jest + React Testing Library + Playwright

## セットアップ・開発

詳細なセットアップ手順とドキュメントは以下を参照してください：

### 📚 ドキュメント

- [セットアップガイド](./mattermost-chat-client/docs/SETUP_GUIDE.md)
- [設計アーキテクチャ](./mattermost-chat-client/docs/architecture/)
- [機能仕様書](./mattermost-chat-client/docs/features/)
- [テストガイド](./mattermost-chat-client/docs/TEST_CHECKLIST.md)

### 🚀 クイックスタート

```bash
cd mattermost-chat-client
npm install
npm run dev
```

### 🧪 テスト実行

```bash
# ユニットテスト
npm test

# E2Eテスト
npm run test:e2e
```

## プロジェクト構成

```
mattermost-chat-client/
├── src/
│   ├── components/
│   │   ├── screens/          # 画面コンポーネント
│   │   ├── ui/               # UIコンポーネント
│   │   └── debug/            # デバッグ用コンポーネント
│   ├── contexts/             # React Context
│   ├── api/                  # Mattermost API
│   ├── types/                # TypeScript型定義
│   └── utils/                # ユーティリティ
├── docs/                     # 設計・仕様書
├── tests/                    # テストファイル
└── screenshots/              # テスト証跡
```

## 開発状況

- ✅ 基本チャット機能実装完了
- ✅ WebSocketリアルタイム通信
- ✅ ユニットテスト整備
- ✅ フォルダ構造最適化
- 🔄 ドキュメント整理中

## ライセンス

MIT License