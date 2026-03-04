/**
 * Run this script to get a Gmail OAuth2 refresh token for a new account.
 *
 * Usage:
 *   npx tsx scripts/get-gmail-token.ts
 *
 * It starts a local server, opens a browser for OAuth consent,
 * and automatically captures the authorization code.
 */

import { google } from 'googleapis';
import http from 'http';

const CLIENT_ID = process.env.GMAIL_CLIENT_ID || '<paste-your-client-id>';
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET || '<paste-your-client-secret>';

const PORT = 3333;
const REDIRECT_URI = `http://localhost:${PORT}`;

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: [
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.send',
  ],
});

// Start a temporary local server to catch the OAuth callback
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url!, `http://localhost:${PORT}`);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<h1>Error: ${error}</h1><p>You can close this tab.</p>`);
    server.close();
    process.exit(1);
  }

  if (!code) {
    res.writeHead(400, { 'Content-Type': 'text/html' });
    res.end('<h1>No code received</h1>');
    return;
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h1>Success! You can close this tab.</h1><p>Check your terminal for the refresh token.</p>');

    console.log('\n--- Your new tokens ---');
    console.log('GMAIL_REFRESH_TOKEN=' + tokens.refresh_token);
    console.log('\nUpdate this value in your packages/backend/.env file.');
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/html' });
    res.end(`<h1>Error exchanging code</h1><pre>${err}</pre>`);
    console.error('Error exchanging code for tokens:', err);
  }

  server.close();
  process.exit(0);
});

server.listen(PORT, () => {
  console.log(`\nLocal server listening on http://localhost:${PORT}`);
  console.log('\nOpen this URL in a browser (logged in as tsityat.ai.agency@gmail.com):\n');
  console.log(authUrl);
  console.log('\nWaiting for OAuth callback...\n');
});
