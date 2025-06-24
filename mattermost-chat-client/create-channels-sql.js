/**
 * SQL-based channel creation script
 * Bypasses the Mattermost API to create channels directly in the database
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Generate a Mattermost-style ID (26 characters, alphanumeric)
function generateId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 26; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

// SQL command to create a channel
function getCreateChannelSQL(teamId, channelData) {
  const id = generateId();
  const now = Date.now();
  
  return `
    INSERT INTO channels (
      id, createat, updateat, deleteat, teamid, type, 
      displayname, name, header, purpose, 
      creatorid, schemeid, groupconstrained, shared,
      totalmsgcount, totalmsgcountroot, extraupdateat, 
      lastpostat, lastrootpostat, bannerinfo
    ) VALUES (
      '${id}', ${now}, ${now}, 0, '${teamId}', '${channelData.type}',
      '${channelData.display_name}', '${channelData.name}', 
      '${channelData.header || ''}', '${channelData.purpose || ''}',
      'yugxppbkoib7mxdqdnzw431zgh', NULL, false, false,
      0, 0, 0, 0, 0, '{}'::jsonb
    );
  `;
}

// Teams and their IDs (from previous runs)
const TEAMS = [
  { id: '51ug8r6idtrkzf8ortj1xaso3e', name: 'Pacific Glory' },
  { id: 'p1g6ni5thtboxyntatuh9uczjh', name: 'Ocean Dream' },
  { id: 'rckku9qykbr85ycmu6g3hwx48c', name: 'Grain Master' },
  { id: 'dtrxczo4dfbgtdg18p5y6yd8kh', name: 'Star Carrier' },
  { id: 'r7a1ppzpxjgufr7j5jjd1mbizy', name: 'Blue Horizon' }
];

// Channel templates
function getChannels(vesselName) {
  const prefix = vesselName.toLowerCase().replace(/\s+/g, '-');
  return [
    {
      name: `${prefix}-general`,
      display_name: '一般',
      purpose: `${vesselName}の一般的な連絡事項`,
      header: `${vesselName}チームの一般チャンネル`,
      type: 'O'
    },
    {
      name: `${prefix}-operations`,
      display_name: '運航管理',
      purpose: `${vesselName}の運航状況・管理情報`,
      header: `${vesselName}の運航管理専用チャンネル`,
      type: 'O'
    },
    {
      name: `${prefix}-maintenance`,
      display_name: 'メンテナンス',
      purpose: `${vesselName}のメンテナンス・保守情報`,
      header: `${vesselName}のメンテナンス情報専用チャンネル`,
      type: 'O'
    }
  ];
}

async function createChannelsViaSQL() {
  console.log('🔧 SQL経由でチャンネル作成...\n');

  for (const team of TEAMS) {
    console.log(`\n--- ${team.name} ---`);
    const channels = getChannels(team.name);
    
    for (const channel of channels) {
      try {
        // Check if channel already exists
        const checkSQL = `SELECT COUNT(*) FROM channels WHERE teamid='${team.id}' AND name='${channel.name}';`;
        const { stdout: countResult } = await execAsync(
          `docker exec mattermost-de-chat-room-postgres-1 psql -U mmuser -d mattermost -t -c "${checkSQL}"`
        );
        
        const count = parseInt(countResult.trim());
        if (count > 0) {
          console.log(`ℹ️  チャンネル既存: ${channel.display_name}`);
          continue;
        }

        // Create channel
        const createSQL = getCreateChannelSQL(team.id, channel);
        await execAsync(
          `docker exec mattermost-de-chat-room-postgres-1 psql -U mmuser -d mattermost -c "${createSQL}"`
        );
        console.log(`✅ チャンネル作成: ${channel.display_name}`);
      } catch (error) {
        console.error(`❌ エラー: ${channel.display_name}`, error.message);
      }
    }
  }

  console.log('\n✅ SQL経由でのチャンネル作成完了！');
}

// 実行
createChannelsViaSQL().catch(console.error);