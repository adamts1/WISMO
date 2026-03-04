import type { FastifyInstance } from 'fastify';
import {
  getOrdersByName,
  getOrdersByEmail,
  withShopifyRetry,
} from '../../services/shopify.service.js';

export async function ordersRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/orders/lookup', async (req, reply) => {
    const { q, type } = req.query as { q?: string; type?: 'name' | 'email' };

    if (!q) {
      return reply.status(400).send({ error: 'Missing query parameter "q"' });
    }

    try {
      const orders =
        type === 'email'
          ? await withShopifyRetry(() => getOrdersByEmail(q))
          : await withShopifyRetry(() => getOrdersByName(q));

      return reply.send({ orders });
    } catch (err) {
      return reply.status(502).send({ error: 'Shopify lookup failed', detail: String(err) });
    }
  });
}
