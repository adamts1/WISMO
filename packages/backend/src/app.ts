import Fastify from 'fastify';
import cors from '@fastify/cors';
import { webhookRoutes } from './routes/webhook.route.js';
import { healthRoutes } from './routes/health.route.js';
import { sessionsRoutes } from './routes/api/sessions.route.js';
import { emailsRoutes } from './routes/api/emails.route.js';
import { ordersRoutes } from './routes/api/orders.route.js';
import { blacklistRoutes } from './routes/api/blacklist.route.js';
import { humanHandlingRoutes } from './routes/api/human-handling.route.js';
import { testRoutes } from './routes/test.route.js';

export function buildApp() {
  const app = Fastify({ logger: false });

  app.register(cors, {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  });

  app.register(healthRoutes);
  app.register(webhookRoutes);
  app.register(sessionsRoutes);
  app.register(emailsRoutes);
  app.register(ordersRoutes);
  app.register(blacklistRoutes);
  app.register(humanHandlingRoutes);
  app.register(testRoutes);

  return app;
}
