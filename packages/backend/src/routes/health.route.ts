import type { FastifyInstance } from 'fastify';
import { pool } from '../db/postgres.js';
import { storageGet } from '../services/storage.service.js';

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/health', async (_req, reply) => {
    const checks = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      postgres: 'unknown',
      last_history_id: 'unknown',
    };

    try {
      await pool.query('SELECT 1');
      checks.postgres = 'ok';
    } catch {
      checks.postgres = 'error';
      checks.status = 'degraded';
    }

    try {
      const histId = await storageGet('gmail_last_history_id');
      checks.last_history_id = histId ?? 'not_set';
    } catch {
      checks.last_history_id = 'error';
    }

    return reply.status(checks.status === 'ok' ? 200 : 503).send(checks);
  });
}
