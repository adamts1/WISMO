import type { FastifyInstance } from 'fastify';
import {
  listBlacklistEntries,
  addBlacklistEntry,
  removeBlacklistEntry,
} from '../../services/blacklist.service.js';

export async function blacklistRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/blacklist', async (req, reply) => {
    const { type, limit, offset } = req.query as {
      type?: string;
      limit?: string;
      offset?: string;
    };

    const result = await listBlacklistEntries({
      type,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });

    return reply.send(result);
  });

  app.post('/api/blacklist', async (req, reply) => {
    const { type, value, reason } = req.body as {
      type?: string;
      value?: string;
      reason?: string;
    };

    if (!type || !value) {
      return reply.status(400).send({ error: 'Missing "type" and "value"' });
    }

    if (type !== 'email' && type !== 'domain') {
      return reply.status(400).send({ error: '"type" must be "email" or "domain"' });
    }

    try {
      const entry = await addBlacklistEntry(type, value.trim(), reason?.trim());
      return reply.status(201).send(entry);
    } catch (err) {
      return reply.status(409).send({ error: String(err) });
    }
  });

  app.delete('/api/blacklist/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    await removeBlacklistEntry(parseInt(id, 10));
    return reply.send({ ok: true });
  });
}
