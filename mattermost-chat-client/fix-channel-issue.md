# Channel Creation Issue - Workaround

## Issue
The Mattermost server (v9.11) is experiencing a database schema issue that prevents channel creation and listing via the API. The error is:
```
missing destination name bannerinfo in *model.ChannelList
```

## Root Cause
This appears to be a database schema mismatch where the `bannerinfo` field is expected but not present in the channel-related database tables.

## Temporary Workarounds

### Option 1: Restart Mattermost with Fresh Database
1. Stop the containers: `docker-compose down`
2. Remove volumes to start fresh: `docker-compose down -v`
3. Start containers: `docker-compose up -d`
4. Re-run setup script: `node setup-vessel-teams.js`

### Option 2: Manual Channel Creation via UI
1. Log in to Mattermost as admin at http://localhost:8065
2. For each vessel team, manually create these channels:
   - `{vessel-name}-general` (一般)
   - `{vessel-name}-operations` (運航管理)
   - `{vessel-name}-maintenance` (メンテナンス)

### Option 3: Database Migration Fix
If you need to preserve existing data, you may need to manually add the missing column:
```sql
-- Connect to PostgreSQL
docker exec -it mattermost-de-chat-room-postgres-1 psql -U mmuser -d mattermost

-- Add missing column (if it doesn't exist)
ALTER TABLE channels ADD COLUMN IF NOT EXISTS bannerinfo JSONB DEFAULT '{}';
```

## Long-term Solution
Consider downgrading to a stable version of Mattermost or waiting for a patch that fixes this schema issue.