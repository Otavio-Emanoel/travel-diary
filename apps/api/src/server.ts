import { buildApp } from './app';
import { env } from './core/config/env';
import { storageProvider } from './core/storage';
import { queryClient } from './core/database';

async function start() {
  const app = buildApp();

  try {
    // Garante que o bucket do storage esteja criado
    await storageProvider.ensureBucketExists();

    await app.listen({
      port: env.PORT,
      host: env.HOST,
    });

    console.log(`🚀 Servidor Fastify rodando em http://${env.HOST}:${env.PORT}`);
    console.log(`📡 Health probe disponível em http://${env.HOST}:${env.PORT}/health`);
    console.log(`📡 Readiness probe disponível em http://${env.HOST}:${env.PORT}/ready`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }

  // Graceful shutdown
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  for (const signal of signals) {
    process.on(signal, async () => {
      console.log(`Recebido sinal ${signal}. Encerrando servidor graciosamente...`);
      await app.close();
      await queryClient.end();
      process.exit(0);
    });
  }
}

start();
