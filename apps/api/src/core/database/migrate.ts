import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db, queryClient } from './index';
import path from 'path';

export async function runMigrations() {
  console.log('🔄 Executando migrações do banco de dados...');
  const migrationsFolder = path.resolve(__dirname, '../../../drizzle');
  await migrate(db, { migrationsFolder });
  console.log('✅ Migrações aplicadas com sucesso!');
}

if (require.main === module) {
  runMigrations()
    .then(async () => {
      await queryClient.end();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('❌ Falha ao aplicar migrações:', err);
      await queryClient.end();
      process.exit(1);
    });
}
