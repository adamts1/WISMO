import { google } from 'googleapis';
import { env } from './config/env.js';

const auth = new google.auth.OAuth2(env.GMAIL_CLIENT_ID, env.GMAIL_CLIENT_SECRET);
auth.setCredentials({ refresh_token: env.GMAIL_REFRESH_TOKEN });
const gmail = google.gmail({ version: 'v1', auth });

async function main() {
  const profile = await gmail.users.getProfile({ userId: 'me' });
  console.log('Account:', profile.data.emailAddress);
  console.log('Total messages:', profile.data.messagesTotal);

  // List recent messages (any label)
  const res = await gmail.users.messages.list({ userId: 'me', maxResults: 5 });
  const messages = res.data.messages ?? [];
  console.log('\nRecent messages:', messages.length);

  for (const m of messages) {
    const id = m.id as string;
    const msg = await gmail.users.messages.get({
      userId: 'me',
      id,
      format: 'metadata',
      metadataHeaders: ['From', 'Subject', 'Date'],
    });
    const headers = msg.data.payload?.headers ?? [];
    const get = (n: string) => headers.find((h) => h.name === n)?.value ?? '';
    console.log(`  - ${get('Date')} | ${get('From')} | ${get('Subject')} | Labels: ${msg.data.labelIds?.join(',')}`);
  }
}

main().catch(console.error);
