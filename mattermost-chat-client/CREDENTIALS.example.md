# Development Credentials Example

This file provides an example of how to structure your credentials for development.
**DO NOT commit actual credentials to the repository.**

## Setup Instructions

1. Copy this file to `CREDENTIALS.md`:
   ```bash
   cp CREDENTIALS.example.md CREDENTIALS.md
   ```

2. Update the values in `CREDENTIALS.md` with your actual credentials

3. The `CREDENTIALS.md` file is already in `.gitignore` and will not be committed

## Mattermost Admin Account

- **Username**: `your_admin_username`
- **Password**: `your_secure_password`
- **Email**: `admin@yourdomain.com`

## Test Users

### User 1
- **Username**: `testuser1`
- **Password**: `your_test_password`
- **Email**: `testuser1@example.com`

### User 2
- **Username**: `testuser2`
- **Password**: `your_test_password`
- **Email**: `testuser2@example.com`

## Environment Variables

For production or CI/CD environments, use environment variables instead:

```bash
export MATTERMOST_ADMIN_USER="your_admin_username"
export MATTERMOST_ADMIN_PASS="your_secure_password"
export MATTERMOST_TEST_USER="testuser1"
export MATTERMOST_TEST_PASS="your_test_password"
```

## Security Notes

- Never commit real passwords to version control
- Use strong, unique passwords for each environment
- Rotate credentials regularly
- Consider using a password manager or secrets management tool