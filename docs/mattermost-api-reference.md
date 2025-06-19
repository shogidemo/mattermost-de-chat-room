# Mattermost Setup via API

**Use ultrathink mode to implement Mattermost setup programmatically via API instead of GUI**

## Context
Setting up Mattermost accounts, teams, and permissions should be done via API calls, not through GUI automation. This approach is more reliable, faster, and scriptable.

## Requirements

### Output Language
- **All outputs must be in Japanese (日本語で出力)**

### Objective
Create a script or set of functions to:
1. Create regular user accounts
2. Create administrator accounts
3. Create teams
4. Add users to teams

## API Endpoints and Methods

### 1. Create User Account
```bash
POST /api/v4/users
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "Password123!",
  "first_name": "FirstName",
  "last_name": "LastName"
}
```

**No authentication required** if open registration is enabled.

### 2. Create Administrator Account

**Step 1: Create user (same as above)**

**Step 2: Update user roles**
```bash
PUT /api/v4/users/{user_id}/roles
Authorization: Bearer {admin_token}
```

**Request Body:**
```json
{
  "roles": "system_user system_admin"
}
```

### 3. Login to Get Token
```bash
POST /api/v4/users/login
```

**Request Body:**
```json
{
  "login_id": "username",
  "password": "password"
}
```

**Response:** Token in header

### 4. Create Team
```bash
POST /api/v4/teams
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "name": "team-name",
  "display_name": "Team Display Name",
  "type": "O",
  "description": "Team description"
}
```

### 5. Add User to Team
```bash
POST /api/v4/teams/{team_id}/members
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "team_id": "{team_id}",
  "user_id": "{user_id}"
}
```

## Implementation Examples

### Using fetch in JavaScript
```javascript
// Helper function for API calls
async function mattermostAPI(endpoint, method = 'GET', body = null, token = null) {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const options = {
    method,
    headers
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(`http://localhost:8065/api/v4${endpoint}`, options);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`API Error: ${error.message || response.statusText}`);
  }
  
  // Get token from login response
  if (endpoint === '/users/login') {
    const token = response.headers.get('Token');
    return { data: await response.json(), token };
  }
  
  return response.json();
}

// Create user function
async function createUser(userData) {
  console.log(`Creating user: ${userData.username}`);
  return await mattermostAPI('/users', 'POST', userData);
}

// Full setup example
async function setupMattermost() {
  try {
    // 1. Create users
    const user1 = await createUser({
      email: 'tanaka@example.com',
      username: 'tanaka',
      password: 'Tanaka123!',
      first_name: '太郎',
      last_name: '田中'
    });
    console.log('✅ User created:', user1.username);

    // 2. Create admin user
    const adminUser = await createUser({
      email: 'admin@example.com',
      username: 'admin-sato',
      password: 'Admin123!',
      first_name: '管理者',
      last_name: '佐藤'
    });
    console.log('✅ Admin user created:', adminUser.username);

    // 3. Login as existing admin to get token
    // (You need at least one admin account already existing)
    const { token } = await mattermostAPI('/users/login', 'POST', {
      login_id: 'existing-admin',
      password: 'existing-password'
    });
    console.log('✅ Logged in successfully');

    // 4. Grant admin role
    await mattermostAPI(`/users/${adminUser.id}/roles`, 'PUT', {
      roles: 'system_user system_admin'
    }, token);
    console.log('✅ Admin role granted');

    // 5. Create team
    const team = await mattermostAPI('/teams', 'POST', {
      name: 'grain-import',
      display_name: '穀物輸入チーム',
      type: 'O',
      description: '穀物輸入管理システム用のチーム'
    }, token);
    console.log('✅ Team created:', team.display_name);

    // 6. Add users to team
    await mattermostAPI(`/teams/${team.id}/members`, 'POST', {
      team_id: team.id,
      user_id: user1.id
    }, token);
    console.log('✅ User added to team');

    await mattermostAPI(`/teams/${team.id}/members`, 'POST', {
      team_id: team.id,
      user_id: adminUser.id
    }, token);
    console.log('✅ Admin added to team');

    console.log('\n🎉 Mattermost setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  }
}
```

### Using axios/Node.js
```javascript
const axios = require('axios');

class MattermostAPI {
  constructor(baseURL = 'http://localhost:8065') {
    this.client = axios.create({
      baseURL: `${baseURL}/api/v4`,
      headers: { 'Content-Type': 'application/json' }
    });
    this.token = null;
  }

  async login(username, password) {
    const response = await this.client.post('/users/login', {
      login_id: username,
      password
    });
    this.token = response.headers.token;
    this.client.defaults.headers.Authorization = `Bearer ${this.token}`;
    return response.data;
  }

  async createUser(userData) {
    const response = await this.client.post('/users', userData);
    return response.data;
  }

  async grantAdminRole(userId) {
    const response = await this.client.put(`/users/${userId}/roles`, {
      roles: 'system_user system_admin'
    });
    return response.data;
  }

  async createTeam(teamData) {
    const response = await this.client.post('/teams', teamData);
    return response.data;
  }

  async addTeamMember(teamId, userId) {
    const response = await this.client.post(`/teams/${teamId}/members`, {
      team_id: teamId,
      user_id: userId
    });
    return response.data;
  }
}
```

## Error Handling

Common errors and solutions:

1. **401 Unauthorized**
   - Ensure token is valid
   - Check if user has required permissions

2. **400 Bad Request**
   - Validate email format
   - Check password meets requirements
   - Ensure username is unique

3. **Connection Refused**
   - Verify Mattermost is running
   - Check URL and port

## Testing the Setup

```javascript
// Test created accounts
async function testSetup() {
  // Login as created user
  const { token } = await mattermostAPI('/users/login', 'POST', {
    login_id: 'tanaka',
    password: 'Tanaka123!'
  });
  
  console.log('✅ User login successful');
  
  // Get user's teams
  const teams = await mattermostAPI('/users/me/teams', 'GET', null, token);
  console.log('User teams:', teams.map(t => t.display_name));
}
```

## Additional Useful APIs

### Channel Operations

**Create Channel**
```bash
POST /api/v4/channels
Authorization: Bearer {token}
```
```json
{
  "team_id": "{team_id}",
  "name": "grain-import-tokyo",
  "display_name": "穀物輸入-東京",
  "type": "O",  // O=public, P=private
  "purpose": "東京港の穀物輸入管理",
  "header": "重要な連絡はメンションを使用してください"
}
```

**Add User to Channel**
```bash
POST /api/v4/channels/{channel_id}/members
Authorization: Bearer {token}
```
```json
{
  "user_id": "{user_id}"
}
```

**Get Channel by Name**
```bash
GET /api/v4/teams/{team_id}/channels/name/{channel_name}
Authorization: Bearer {token}
```

### Message Operations

**Post Message**
```bash
POST /api/v4/posts
Authorization: Bearer {token}
```
```json
{
  "channel_id": "{channel_id}",
  "message": "新しい穀物の見積もりが届きました",
  "props": {
    "attachments": [{
      "text": "見積もり詳細",
      "color": "#FF8800"
    }]
  }
}
```

**Get Posts in Channel**
```bash
GET /api/v4/channels/{channel_id}/posts?page=0&per_page=60
Authorization: Bearer {token}
```

**Update Post**
```bash
PUT /api/v4/posts/{post_id}
Authorization: Bearer {token}
```
```json
{
  "id": "{post_id}",
  "message": "編集されたメッセージ"
}
```

**Search Posts**
```bash
POST /api/v4/posts/search
Authorization: Bearer {token}
```
```json
{
  "terms": "穀物 AND 見積もり",
  "is_or_search": false,
  "include_deleted_channels": false,
  "page": 0,
  "per_page": 60
}
```

### File Operations

**Upload File**
```javascript
// FormData example
const formData = new FormData();
formData.append('files', fileBlob, 'grain-invoice.pdf');
formData.append('channel_id', channelId);

fetch('http://localhost:8065/api/v4/files', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

**Get File**
```bash
GET /api/v4/files/{file_id}
Authorization: Bearer {token}
```

### User Status and Preferences

**Update User Status**
```bash
PUT /api/v4/users/{user_id}/status
Authorization: Bearer {token}
```
```json
{
  "user_id": "{user_id}",
  "status": "online",  // online, away, dnd, offline
  "manual": true
}
```

**Update User Preferences**
```bash
PUT /api/v4/users/{user_id}/preferences
Authorization: Bearer {token}
```
```json
[{
  "user_id": "{user_id}",
  "category": "notifications",
  "name": "email",
  "value": "false"
}]
```

### Webhook Operations

**Create Incoming Webhook**
```bash
POST /api/v4/hooks/incoming
Authorization: Bearer {token}
```
```json
{
  "channel_id": "{channel_id}",
  "display_name": "穀物価格通知",
  "description": "毎日の穀物価格を通知",
  "username": "price-bot"
}
```

**Use Webhook to Post**
```bash
POST {webhook_url}
```
```json
{
  "text": "本日の小麦価格: ¥45,000/トン",
  "username": "price-bot",
  "icon_emoji": ":wheat:"
}
```

### Direct Messages

**Create Direct Channel**
```bash
POST /api/v4/channels/direct
Authorization: Bearer {token}
```
```json
["{user_id_1}", "{user_id_2}"]
```

**Create Group Channel**
```bash
POST /api/v4/channels/group
Authorization: Bearer {token}
```
```json
["{user_id_1}", "{user_id_2}", "{user_id_3}"]
```

### Useful Utility Functions

```javascript
// Complete setup with channels and initial messages
async function completeSetup() {
  const api = new MattermostAPI();
  
  // Login
  await api.login('admin', 'password');
  
  // Create channels
  const channels = [
    { name: 'grain-tokyo', display_name: '穀物輸入-東京' },
    { name: 'grain-osaka', display_name: '穀物輸入-大阪' },
    { name: 'grain-nagoya', display_name: '穀物輸入-名古屋' }
  ];
  
  for (const channelData of channels) {
    const channel = await api.createChannel({
      team_id: teamId,
      ...channelData,
      type: 'O'
    });
    
    // Post welcome message
    await api.postMessage({
      channel_id: channel.id,
      message: `${channelData.display_name}チャンネルへようこそ！`
    });
  }
  
  // Create webhook for automated notifications
  const webhook = await api.createWebhook({
    channel_id: channels[0].id,
    display_name: '価格通知Bot'
  });
  
  console.log('Webhook URL:', webhook.url);
}

// Search for users with specific criteria
async function findUsers(searchTerm) {
  const response = await mattermostAPI('/users/search', 'POST', {
    term: searchTerm,
    team_id: teamId,
    not_in_channel_id: '',
    limit: 100
  }, token);
  
  return response;
}

// Bulk invite users to channel
async function bulkInviteToChannel(channelId, userEmails) {
  for (const email of userEmails) {
    const users = await findUsers(email);
    if (users.length > 0) {
      await api.addChannelMember(channelId, users[0].id);
    }
  }
}
```

## Important Notes

1. **Initial Admin Account**
   - First admin must be created via environment variables or CLI
   - Subsequent admins can be created via API

2. **Password Requirements**
   - Default: minimum 5 characters
   - Can be configured in system console

3. **Team Types**
   - "O": Open (anyone can join)
   - "I": Invite only

4. **Channel Types**
   - "O": Public channel
   - "P": Private channel
   - "D": Direct message
   - "G": Group message

5. **Rate Limiting**
   - API has rate limits
   - Add delays between bulk operations if needed

6. **File Size Limits**
   - Default max file size: 50MB
   - Can be configured in system console

Please implement this API-based approach instead of GUI automation. Start by creating the necessary functions, then execute them in sequence to set up Mattermost programmatically.