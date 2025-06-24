/**
 * SQL経由でチャンネルメンバーを追加
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// ユーザーID
const ADMIN_ID = 'yugxppbkoib7mxdqdnzw431zgh';
const TARGET_USER_ID = '1e3r9j1qsfbz8ndartptwmtb5w'; // sho1

// チーム情報
const TEAMS = [
  { id: '51ug8r6idtrkzf8ortj1xaso3e', name: 'Pacific Glory' },
  { id: 'p1g6ni5thtboxyntatuh9uczjh', name: 'Ocean Dream' },
  { id: 'rckku9qykbr85ycmu6g3hwx48c', name: 'Grain Master' },
  { id: 'dtrxczo4dfbgtdg18p5y6yd8kh', name: 'Star Carrier' },
  { id: 'r7a1ppzpxjgufr7j5jjd1mbizy', name: 'Blue Horizon' }
];

async function addChannelMembers() {
  console.log('👥 SQL経由でチャンネルメンバー追加...\n');

  for (const team of TEAMS) {
    console.log(`\n--- ${team.name} ---`);
    
    const channelNames = [
      `${team.name.toLowerCase().replace(/\s+/g, '-')}-general`,
      `${team.name.toLowerCase().replace(/\s+/g, '-')}-operations`,
      `${team.name.toLowerCase().replace(/\s+/g, '-')}-maintenance`
    ];

    for (const channelName of channelNames) {
      try {
        // チャンネルIDを取得
        const getChannelSQL = `SELECT id FROM channels WHERE teamid='${team.id}' AND name='${channelName}';`;
        const { stdout: channelResult } = await execAsync(
          `docker exec mattermost-de-chat-room-postgres-1 psql -U mmuser -d mattermost -t -c "${getChannelSQL}"`
        );
        
        const channelId = channelResult.trim();
        if (!channelId) {
          console.log(`❌ チャンネル ${channelName} が見つかりません`);
          continue;
        }

        // 各ユーザーをチャンネルに追加
        for (const userId of [ADMIN_ID, TARGET_USER_ID]) {
          const userName = userId === ADMIN_ID ? '管理者' : 'sho1';
          
          // 既にメンバーか確認
          const checkSQL = `SELECT COUNT(*) FROM channelmembers WHERE channelid='${channelId}' AND userid='${userId}';`;
          const { stdout: countResult } = await execAsync(
            `docker exec mattermost-de-chat-room-postgres-1 psql -U mmuser -d mattermost -t -c "${checkSQL}"`
          );
          
          const count = parseInt(countResult.trim());
          if (count > 0) {
            console.log(`ℹ️  ${userName}は既に ${channelName} のメンバー`);
            continue;
          }

          // メンバー追加
          const now = Date.now();
          const addMemberSQL = `
            INSERT INTO channelmembers (
              channelid, userid, roles, lastviewedat, msgcount, 
              mentioncount, mentioncountroot, notifyprops, lastupdateat, 
              msgcountroot, urgentmentioncount
            ) VALUES (
              '${channelId}', '${userId}', '', ${now}, 0,
              0, 0, '{\\"desktop\\":\\"default\\",\\"mobile\\":\\"default\\",\\"mark_unread\\":\\"all\\",\\"ignore_channel_mentions\\":\\"default\\"}'::jsonb, ${now},
              0, 0
            );
          `;
          
          await execAsync(
            `docker exec mattermost-de-chat-room-postgres-1 psql -U mmuser -d mattermost -c "${addMemberSQL}"`
          );
          console.log(`✅ ${userName}を ${channelName} に追加`);
        }
      } catch (error) {
        console.error(`❌ エラー: ${channelName}`, error.message);
      }
    }
  }

  console.log('\n✅ チャンネルメンバー追加完了！');
  console.log('\n💡 Mattermostを再起動して変更を反映させることをお勧めします:');
  console.log('   docker-compose restart mattermost');
}

// 実行
addChannelMembers().catch(console.error);