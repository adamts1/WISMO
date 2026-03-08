import { google } from 'googleapis';
import type { gmail_v1 } from 'googleapis';
import { env } from '../config/env.js';
import { storageGet, storageSet } from './storage.service.js';
import {
  extractEmail,
  stripThreadHistory,
  extractPlainTextBody,
  type ParsedEmail,
} from '@oytiot/shared';

const HISTORY_ID_KEY = 'gmail_last_history_id';
const MAX_RETRIES = 4;
const RETRY_DELAY_MS = 2_000;

/**
 * Cached Gmail profile email — resolved once on first use.
 * Used to reliably detect self-sent emails regardless of env var config.
 */
let _selfEmail: string | null = null;

export async function getSelfEmail(): Promise<string> {
  if (_selfEmail) return _selfEmail;
  const profile = await gmail.users.getProfile({ userId: 'me' });
  _selfEmail = (profile.data.emailAddress ?? '').toLowerCase();
  return _selfEmail;
}

function createGmailClient(): gmail_v1.Gmail {
  const auth = new google.auth.OAuth2(
    env.GMAIL_CLIENT_ID,
    env.GMAIL_CLIENT_SECRET,
  );
  auth.setCredentials({ refresh_token: env.GMAIL_REFRESH_TOKEN });
  return google.gmail({ version: 'v1', auth });
}

const gmail = createGmailClient();

/**
 * Decode a Gmail Pub/Sub push notification payload.
 */
export function decodePushPayload(data: string): { emailAddress: string; historyId: string } {
  const decoded = Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
  return JSON.parse(decoded) as { emailAddress: string; historyId: string };
}

/**
 * Core Gmail history bug fix:
 * - Query history using the STORED ID (not the push ID)
 * - Retry up to MAX_RETRIES times if history is empty (timing race)
 * - Update the stored ID to pushHistoryId AFTER processing
 */
export async function getNewMessageFromPush(
  pushHistoryId: string,
): Promise<gmail_v1.Schema$Message | null> {
  const stored = await storageGet(HISTORY_ID_KEY);

  // If never initialized, use pushHistoryId - 1 so we get at least the current message
  const startId =
    !stored || stored === '0'
      ? String(BigInt(pushHistoryId) - 1n)
      : stored;

  let messageId: string | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const historyRes = await gmail.users.history.list({
        userId: 'me',
        startHistoryId: startId,
        historyTypes: ['messageAdded'],
        labelId: 'INBOX',
      });

      const history = historyRes.data.history ?? [];
      if (history.length > 0) {
        // Walk history in reverse to find the latest INCOMING message
        // (skip messages that are SENT-only — these are our own replies)
        for (let i = history.length - 1; i >= 0; i--) {
          const entry = history[i];
          const added = entry.messagesAdded ?? [];
          for (const a of added) {
            const labels = a.message?.labelIds ?? [];
            const isInbox = labels.includes('INBOX');
            const isSentOnly = labels.includes('SENT') && !isInbox;
            if (isSentOnly) {
              console.log(`[gmail] Skipping SENT-only message ${a.message?.id}`);
              continue;
            }
            if (a.message?.id) {
              messageId = a.message.id;
              break;
            }
          }
          if (messageId) break;
        }
      }

      if (messageId) break;
    } catch (err) {
      console.error(`Gmail history.list attempt ${attempt + 1} failed:`, err);
    }

    if (attempt < MAX_RETRIES - 1) {
      await sleep(RETRY_DELAY_MS * (attempt + 1));
    }
  }

  // Always update the stored ID regardless of whether we found a message
  await storageSet(HISTORY_ID_KEY, pushHistoryId);

  if (!messageId) return null;

  const msgRes = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'full',
  });
  return msgRes.data;
}

/**
 * Parse a raw Gmail message into a structured ParsedEmail.
 */
export function parseGmailMessage(message: gmail_v1.Schema$Message): ParsedEmail {
  const payload = message.payload ?? {};
  const headers = payload.headers ?? [];

  const getHeader = (name: string): string =>
    headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? '';

  const rawFrom = getHeader('From');
  const subject = getHeader('Subject');
  const receivedAt = getHeader('Date');

  const senderEmail = extractEmail(rawFrom);
  const senderDomain = senderEmail.split('@')[1] ?? '';

  // Extract plain text body
  let content = '';
  if (payload.parts) {
    content = extractPlainTextBody(payload as Parameters<typeof extractPlainTextBody>[0]);
  } else if (payload.body?.data) {
    content = extractPlainTextBody(payload as Parameters<typeof extractPlainTextBody>[0]);
  }

  const cleanContent = stripThreadHistory(content);
  const isReply = subject.toLowerCase().startsWith('re:');

  // Detect auto-reply / out-of-office emails via standard headers
  const autoSubmitted = getHeader('Auto-Submitted').toLowerCase();
  const precedence = getHeader('Precedence').toLowerCase();
  const xAutoReply = getHeader('X-Autoreply').toLowerCase();
  const xAutoResponseSuppress = getHeader('X-Auto-Response-Suppress');
  const isAutoReply =
    (autoSubmitted !== '' && autoSubmitted !== 'no') ||
    precedence === 'auto_reply' ||
    precedence === 'bulk' ||
    precedence === 'junk' ||
    xAutoReply === 'yes' ||
    xAutoResponseSuppress !== '';

  return {
    messageId: message.id ?? '',
    threadId: message.threadId ?? '',
    sender: rawFrom,
    senderEmail,
    senderDomain,
    subject,
    content,
    cleanContent,
    receivedAt,
    isReply,
    isAutoReply,
  };
}

/**
 * Reply to an email thread.
 */
export async function replyToThread(
  threadId: string,
  body: string,
  isHtml = false,
): Promise<void> {
  await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      threadId,
      raw: encodeEmailToBase64({
        to: '',  // Gmail sets reply-to automatically when using threadId
        body,
        isHtml,
      }),
    },
  });
}

/**
 * Reply to a thread using the Gmail reply API (preserves thread).
 */
export async function replyToMessage(params: {
  threadId: string;
  to?: string;
  subject?: string;
  body: string;
  isHtml?: boolean;
}): Promise<void> {
  const { threadId, body, isHtml = false, to, subject } = params;

  // Build the raw MIME message for reply
  const contentType = isHtml ? 'text/html' : 'text/plain';
  const lines = [
    `To: ${to ?? ''}`,
    ...(subject ? [`Subject: ${subject}`] : []),
    'Content-Type: ' + contentType + '; charset=utf-8',
    'MIME-Version: 1.0',
    '',
    body,
  ];
  const raw = Buffer.from(lines.join('\r\n'))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: { threadId, raw },
  });
}

function encodeEmailToBase64(params: { to: string; body: string; isHtml: boolean }): string {
  const contentType = params.isHtml ? 'text/html' : 'text/plain';
  const lines = [
    `To: ${params.to}`,
    `Content-Type: ${contentType}; charset=utf-8`,
    'MIME-Version: 1.0',
    '',
    params.body,
  ];
  return Buffer.from(lines.join('\r\n'))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
