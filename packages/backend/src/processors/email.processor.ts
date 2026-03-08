/**
 * Main email processing orchestrator.
 * Called from the Gmail webhook route.
 */
import {
  getNewMessageFromPush,
  parseGmailMessage,
  getSelfEmail,
} from '../services/gmail.service.js';
import { isBlacklisted } from '../services/blacklist.service.js';
import { getSessionByThreadId } from '../services/session.service.js';
import { logEmail } from '../services/email-log.service.js';
import { storageClaim } from '../services/storage.service.js';
import { handleNewEmail } from './wismo.processor.js';
import { handleOpenSession } from './open-session.processor.js';
import { env } from '../config/env.js';

export interface PushPayload {
  message: {
    data: string;
    messageId: string;
    publishTime: string;
  };
  subscription: string;
}

export async function processGmailPush(pushHistoryId: string): Promise<void> {
  // 1. Fetch the email from Gmail (with history bug fix + retries)
  const rawMessage = await getNewMessageFromPush(pushHistoryId);
  if (!rawMessage) {
    console.log(`[email.processor] No new message found for historyId ${pushHistoryId}`);
    return;
  }

  // 2. Parse the raw Gmail message
  const email = parseGmailMessage(rawMessage);

  // 3. Deduplicate: atomically claim this messageId — skip if already claimed
  const claimed = await storageClaim(`processed_msg:${email.messageId}`);
  if (!claimed) {
    console.log(`[email.processor] Skipping duplicate message ${email.messageId}`);
    return;
  }

  // 4. Self-email filter: ignore emails sent by the bot itself
  // Uses both env vars AND the Gmail account's actual email (fetched from API)
  const gmailSelf = await getSelfEmail();
  const selfEmails = [env.EMAIL_PROD, env.EMAIL_TEST, env.EMAIL_NISSAN, gmailSelf]
    .filter((e): e is string => Boolean(e))
    .map((e) => e.toLowerCase());
  if (selfEmails.includes(email.senderEmail.toLowerCase())) {
    console.log(`[email.processor] Ignoring own email from ${email.senderEmail}`);
    return;
  }

  // 4b. Extra safety: skip messages with SENT label but no INBOX label
  // (catches edge cases where Gmail's "From" header doesn't match expected addresses)
  if (rawMessage.labelIds?.includes('SENT') && !rawMessage.labelIds?.includes('INBOX')) {
    console.log(`[email.processor] Ignoring SENT-only message ${email.messageId}`);
    return;
  }

  // 5. Blacklist check
  if (await isBlacklisted(email.senderEmail, email.senderDomain)) {
    console.log(`[email.processor] Blocked email from ${email.senderEmail}`);
    await logEmail({
      thread_id: email.threadId,
      sender_email: email.senderEmail,
      subject: email.subject,
      route_taken: 'blacklisted',
    });
    return;
  }

  // 6. Check for open session
  let session;
  try {
    session = await getSessionByThreadId(email.threadId);
  } catch (err) {
    console.error('[email.processor] Failed to query session:', err);
    session = null;
  }

  // 7. Route to the correct processor
  try {
    if (session && session.status !== 'close') {
      await handleOpenSession(email, session);
    } else {
      await handleNewEmail(email);
    }
  } catch (err) {
    console.error('[email.processor] Unhandled processor error:', err);
    await logEmail({
      thread_id: email.threadId,
      sender_email: email.senderEmail,
      subject: email.subject,
      error: String(err),
    });
  }
}
