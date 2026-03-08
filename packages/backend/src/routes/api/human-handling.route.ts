import type { FastifyInstance } from 'fastify';
import { listHumanHandling } from '../../services/human-handling.service.js';

export async function humanHandlingRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/human-handling', async (req, reply) => {
    const { source, limit, offset } = req.query as {
      source?: string;
      limit?: string;
      offset?: string;
    };

    const result = await listHumanHandling({
      source,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });

    return reply.send(result);
  });
}
