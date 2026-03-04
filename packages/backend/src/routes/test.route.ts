/**
 * Manual test route — process the latest inbox email without needing Pub/Sub.
 * Usage: POST /test/process-latest
 */
import type { FastifyInstance } from 'fastify';
import { google } from 'googleapis';
import { env } from '../config/env.js';
import { parseGmailMessage, getSelfEmail } from '../services/gmail.service.js';
import { handleNewEmail } from '../processors/wismo.processor.js';
import { handleOpenSession } from '../processors/open-session.processor.js';
import { getSessionByThreadId } from '../services/session.service.js';
import { logEmail } from '../services/email-log.service.js';
import { isBlacklisted } from '../services/blacklist.service.js';

function createGmailClient() {
  const auth = new google.auth.OAuth2(env.GMAIL_CLIENT_ID, env.GMAIL_CLIENT_SECRET);
  auth.setCredentials({ refresh_token: env.GMAIL_REFRESH_TOKEN });
  return google.gmail({ version: 'v1', auth });
}

export async function testRoutes(app: FastifyInstance): Promise<void> {
  app.post('/test/process-latest', async (_req, reply) => {
    const gmail = createGmailClient();

    // 1. Get latest inbox message
    const listRes = await gmail.users.messages.list({
      userId: 'me',
      labelIds: ['INBOX'],
      maxResults: 1,
    });

    const msgId = listRes.data.messages?.[0]?.id;
    if (!msgId) {
      return reply.send({ ok: false, error: 'No messages in inbox' });
    }

    // 2. Fetch full message
    const msgRes = await gmail.users.messages.get({
      userId: 'me',
      id: msgId,
      format: 'full',
    });

    const rawMessage = msgRes.data;

    // 3. Parse it
    const email = parseGmailMessage(rawMessage);

    // 4. Self-email check
    const gmailSelf = await getSelfEmail();
    const selfEmails = [env.EMAIL_PROD, env.EMAIL_TEST, env.EMAIL_NISSAN, gmailSelf]
      .filter((e): e is string => Boolean(e))
      .map((e) => e.toLowerCase());

    if (selfEmails.includes(email.senderEmail.toLowerCase())) {
      return reply.send({
        ok: false,
        error: 'Latest email is from the bot itself — send from a different email address',
        sender: email.senderEmail,
      });
    }

    // 5. Blacklist check
    if (isBlacklisted(email.senderEmail, email.senderDomain)) {
      return reply.send({ ok: false, error: 'Sender is blacklisted', sender: email.senderEmail });
    }

    // 6. Check for open session
    const session = await getSessionByThreadId(email.threadId).catch(() => null);

    // 7. Route
    try {
      if (session && session.status !== 'close') {
        await handleOpenSession(email, session);
      } else {
        await handleNewEmail(email);
      }
    } catch (err) {
      await logEmail({
        thread_id: email.threadId,
        sender_email: email.senderEmail,
        subject: email.subject,
        error: String(err),
      });
      return reply.send({ ok: false, error: String(err) });
    }

    return reply.send({
      ok: true,
      processed: {
        messageId: email.messageId,
        from: email.senderEmail,
        subject: email.subject,
        content_preview: email.cleanContent.slice(0, 200),
      },
    });
  });
}
