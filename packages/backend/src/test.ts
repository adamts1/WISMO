import { query } from './db/postgres.js';
import { createClient } from '@supabase/supabase-js';
import { google } from 'googleapis';
import { env } from './config/env.js';

async function runTests() {
  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`✅ ${name}`);
      passed++;
    } catch (err: any) {
      console.log(`❌ ${name}: ${err.message}`);
      failed++;
    }
  }

  console.log('\n--- Running connection tests ---\n');

  await test('PostgreSQL connection', async () => {
    await query('SELECT 1');
  });

  await test('Supabase connection', async () => {
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
    const { error } = await supabase.from('app_kv').select('key').limit(1);
    if (error) throw new Error(error.message);
  });

  await test('Gmail OAuth', async () => {
    const auth = new google.auth.OAuth2(env.GMAIL_CLIENT_ID, env.GMAIL_CLIENT_SECRET);
    auth.setCredentials({ refresh_token: env.GMAIL_REFRESH_TOKEN });
    const gmail = google.gmail({ version: 'v1', auth });
    await gmail.users.getProfile({ userId: 'me' });
  });

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
