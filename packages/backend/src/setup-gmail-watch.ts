import { google } from 'googleapis';
import { env } from './config/env.js';

async function setupGmailWatch() {
  const auth = new google.auth.OAuth2(env.GMAIL_CLIENT_ID, env.GMAIL_CLIENT_SECRET);
  auth.setCredentials({ refresh_token: env.GMAIL_REFRESH_TOKEN });
  const gmail = google.gmail({ version: 'v1', auth });

  const topicName = env.GMAIL_PUBSUB_TOPIC;

  console.log(`Setting up Gmail watch on topic: ${topicName}`);

  const res = await gmail.users.watch({
    userId: 'me',
    requestBody: {
      topicName,
      labelIds: ['INBOX'],
    },
  });

  console.log('✅ Gmail watch active:');
  console.log(`  historyId: ${res.data.historyId}`);
  console.log(`  expiration: ${new Date(Number(res.data.expiration)).toISOString()}`);
  console.log('\nWatch expires in ~7 days. Re-run this script to renew it.');
}

setupGmailWatch().catch((err) => {
  console.error('❌ Failed to set up Gmail watch:', err.message);
  process.exit(1);
});
