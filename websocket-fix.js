#!/usr/bin/env node

// WebSocket設定を修正するスクリプト
const fs = require('fs');

console.log('Mattermost WebSocket設定を修正中...');

try {
  // 設定ファイルを読み込み
  const configPath = '/mattermost/config/config.json';
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  
  // WebSocket設定を更新
  config.ServiceSettings.WebsocketPort = 8065;
  config.ServiceSettings.WebsocketSecurePort = 8065;
  config.ServiceSettings.EnableAPIv4 = true;
  config.ServiceSettings.EnableInactiveUsers = true;
  config.ServiceSettings.EnableBotAccountCreation = true;
  config.ServiceSettings.EnableMultifactorAuthentication = false;
  config.ServiceSettings.EnableOAuthServiceProvider = true;
  
  // CORS設定も更新
  config.ServiceSettings.AllowCorsFrom = "http://localhost:5173 http://localhost:5174";
  config.ServiceSettings.CorsAllowCredentials = true;
  config.ServiceSettings.CorsDebug = true;
  
  // WebSocket用の追加設定
  config.ServiceSettings.WebsocketURL = "";
  config.ServiceSettings.ListenAddress = ":8065";
  
  // 設定ファイルを書き戻し
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  
  console.log('✅ WebSocket設定の更新完了');
  console.log('- WebsocketPort: 8065');
  console.log('- WebsocketSecurePort: 8065');
  console.log('- CORS設定更新済み');
  
} catch (error) {
  console.error('❌ 設定更新エラー:', error.message);
  process.exit(1);
}