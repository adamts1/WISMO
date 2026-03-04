import type { FastifyInstance } from 'fastify';
import { decodePushPayload, getSelfEmail } from '../services/gmail.service.js';
import { processGmailPush } from '../processors/email.processor.js';

// In-memory guard: ignore duplicate historyIds within a 30-second window
const recentHistoryIds = new Set<string>();

export async function webhookRoutes(app: FastifyInstance): Promise<void> {
  /**
   * POST /webhook/gmail
   * Receives Google Cloud Pub/Sub push notifications for Gmail.
   * Must return 200 quickly to acknowledge receipt.
   */
  app.post('/webhook/gmail', async (req, reply) => {
    // Acknowledge immediately — process async
    reply.status(200).send({ ok: true });

    try {
      const body = req.body as {
        message?: { data?: string };
      };

      const data = body?.message?.data;
      if (!data) {
        console.warn('[webhook] Received push with no message.data');
        return;
      }

      const { emailAddress, historyId } = decodePushPayload(data);
      if (!historyId) {
        console.warn('[webhook] Push payload missing historyId');
        return;
      }

      // Ignore pushes from other Gmail accounts (e.g. old watch still active)
      const myEmail = await getSelfEmail();
      if (emailAddress && emailAddress.toLowerCase() !== myEmail) {
        console.log(`[webhook] Ignoring push from ${emailAddress} (expected ${myEmail})`);
        return;
      }

      // Drop duplicate historyId pushes (Pub/Sub sometimes sends the same one twice)
      if (recentHistoryIds.has(historyId)) {
        console.log(`[webhook] Duplicate historyId ${historyId}, skipping`);
        return;
      }
      recentHistoryIds.add(historyId);
      setTimeout(() => recentHistoryIds.delete(historyId), 30_000);

      // Process asynchronously (don't block the webhook response)
      setImmediate(() => {
        processGmailPush(historyId).catch((err) => {
          console.error('[webhook] processGmailPush error:', err);
        });
      });
    } catch (err) {
      console.error('[webhook] Failed to handle Gmail push:', err);
    }
  });
}
