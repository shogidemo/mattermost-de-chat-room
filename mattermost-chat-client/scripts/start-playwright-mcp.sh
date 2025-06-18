#!/bin/bash

# Playwright MCP サーバー起動スクリプト

echo "🚀 Playwright MCP サーバーを起動します..."

# 設定ファイルのパス
CONFIG_FILE="playwright-mcp-config.json"

# Playwright MCP サーバーを起動
npx @playwright/mcp \
  --config "$CONFIG_FILE" \
  --headless false \
  --browser chromium \
  --viewport-size "1280,720" \
  --save-trace \
  --output-dir "./test-results" \
  --caps "tabs,pdf,history,wait,files" \
  --image-responses "auto" \
  --port 3001 \
  --host "localhost"

echo "📄 Playwright MCP サーバーが http://localhost:3001 で起動しました"
echo "🔍 テスト結果は ./test-results に保存されます"