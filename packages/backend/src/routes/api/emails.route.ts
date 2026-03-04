import type { FastifyInstance } from 'fastify';
import { listEmailLogs, getDashboardStats } from '../../services/email-log.service.js';
import { storageGet } from '../../services/storage.service.js';

export async function emailsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/emails', async (req, reply) => {
    const { limit, offset } = req.query as { limit?: string; offset?: string };

    const result = await listEmailLogs({
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });

    return reply.send(result);
  });

  app.get('/api/dashboard', async (_req, reply) => {
    const [stats, lastHistoryId] = await Promise.all([
      getDashboardStats(),
      storageGet('gmail_last_history_id'),
    ]);

    return reply.send({
      ...stats,
      last_history_id: lastHistoryId ?? 'not_set',
    });
  });
}
