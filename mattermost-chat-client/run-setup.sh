#!/bin/bash

echo "🚢 船舶チームセットアップスクリプト"
echo "===================================="
echo ""
echo "このスクリプトは以下を実行します:"
echo "- 5つの船舶チームを作成"
echo "- 各チームに3つのデフォルトチャンネルを作成"
echo "- sho1ユーザーを全チームに追加"
echo ""
echo "⚠️  前提条件:"
echo "1. Mattermostサーバーが http://localhost:8065 で起動している"
echo "2. 管理者アカウントの認証情報が正しい"
echo ""
echo "📝 管理者認証情報の設定:"
echo "setup-vessel-teams.js の以下の行を編集してください:"
echo "  const ADMIN_USERNAME = 'admin';"
echo "  const ADMIN_PASSWORD = 'Admin123!';"
echo ""
read -p "続行しますか？ (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "セットアップを開始します..."
    echo ""
    node setup-vessel-teams.js
else
    echo "キャンセルしました。"
fi