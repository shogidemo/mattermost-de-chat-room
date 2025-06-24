/**
 * Test credentials helper
 * Loads test credentials from environment variables or .env.test file
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

export const testCredentials = {
  admin: {
    username: process.env.TEST_ADMIN_USERNAME || 'admin',
    password: process.env.TEST_ADMIN_PASSWORD || 'Admin123456!'
  },
  user1: {
    username: process.env.TEST_USER1_USERNAME || 'testuser1',
    password: process.env.TEST_USER1_PASSWORD || 'TestPassword123!'
  },
  user2: {
    username: process.env.TEST_USER2_USERNAME || 'testuser2',
    password: process.env.TEST_USER2_PASSWORD || 'TestPassword123!'
  },
  vesselUser1: {
    username: process.env.TEST_VESSEL_USER1 || 'sho1',
    password: process.env.TEST_VESSEL_PASS1 || 'sho12345'
  },
  vesselUser2: {
    username: process.env.TEST_VESSEL_USER2 || 'sho2',
    password: process.env.TEST_VESSEL_PASS2 || 'sho12345'
  }
};

export const testConfig = {
  mattermostUrl: process.env.VITE_MATTERMOST_URL || 'http://localhost:8065',
  headless: process.env.PLAYWRIGHT_HEADLESS === 'true',
  slowMo: parseInt(process.env.PLAYWRIGHT_SLOW_MO || '0', 10)
};