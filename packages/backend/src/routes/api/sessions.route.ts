import type { FastifyInstance } from 'fastify';
import { listSessions, closeSession } from '../../services/session.service.js';

export async function sessionsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/sessions', async (req, reply) => {
    const { status, limit, offset } = req.query as {
      status?: string;
      limit?: string;
      offset?: string;
    };

    const result = await listSessions({
      status,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });

    return reply.send(result);
  });

  app.patch('/api/sessions/:threadId/close', async (req, reply) => {
    const { threadId } = req.params as { threadId: string };
    await closeSession(decodeURIComponent(threadId));
    return reply.send({ ok: true });
  });
}
