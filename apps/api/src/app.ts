import fastify, { FastifyInstance } from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyCookie from '@fastify/cookie';
import fastifyRateLimit from '@fastify/rate-limit';
import errorHandlerPlugin from './core/plugins/error-handler';
import authPlugin from './core/plugins/auth';
import { env } from './core/config/env';
import { db } from './core/database';
import { sql } from 'drizzle-orm';
import { storageProvider } from './core/storage';

// Módulos
import { authRoutes } from './modules/auth';
import { tripsRoutes } from './modules/trips';
import { destinationsRoutes } from './modules/destinations';
import { entriesRoutes } from './modules/entries';
import { mediaRoutes } from './modules/media';

export function buildApp(): FastifyInstance {
  const app = fastify({
    logger: {
      level: env.NODE_ENV === 'test' ? 'silent' : 'info',
      redact: ['req.headers.authorization', 'req.headers.cookie', 'body.password'],
    },
    disableRequestLogging: env.NODE_ENV === 'test',
  });

  // Plugins globais
  app.register(fastifyCors, {
    origin: env.NODE_ENV === 'production' ? env.CORS_ORIGIN : true,
    credentials: true,
  });

  app.register(fastifyCookie);

  app.register(fastifyRateLimit, {
    max: 200,
    timeWindow: '1 minute',
  });

  app.register(errorHandlerPlugin);
  app.register(authPlugin);

  // Probes de Infraestrutura
  app.get('/health', async (_req, reply) => {
    return reply.status(200).send({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/ready', async (_req, reply) => {
    try {
      // Checa banco de dados
      await db.execute(sql`SELECT 1`);
      
      const memUsage = process.memoryUsage();
      return reply.status(200).send({
        status: 'ready',
        checks: {
          database: 'UP',
          storage: 'UP',
        },
        memory: {
          rssMb: Math.round(memUsage.rss / 1024 / 1024),
          heapUsedMb: Math.round(memUsage.heapUsed / 1024 / 1024),
        },
      });
    } catch (err: any) {
      return reply.status(503).send({
        status: 'down',
        error: err.message,
      });
    }
  });

  // Rotas da API v1
  app.register(async (v1) => {
    v1.register(authRoutes, { prefix: '/auth' });
    v1.register(tripsRoutes, { prefix: '/trips' });
    v1.register(destinationsRoutes);
    v1.register(entriesRoutes);
    v1.register(mediaRoutes, { prefix: '/media' });
  }, { prefix: '/api/v1' });

  return app;
}
