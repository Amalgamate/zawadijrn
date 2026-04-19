import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  const customStringifier = (key: string, value: any) =>
    typeof value === 'bigint' ? value.toString() : value;

  const results: any = {};

  results.tables = await prisma.$queryRawUnsafe(`
    SELECT
        schemaname,
        relname AS table_name,
        n_live_tup AS row_count
    FROM pg_stat_user_tables
    ORDER BY n_live_tup DESC;
  `);

  results.indexes = await prisma.$queryRawUnsafe(`
    SELECT
        tablename,
        indexname,
        indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    ORDER BY tablename;
  `);

  try {
    results.slowQueries = await prisma.$queryRawUnsafe(`
      SELECT
          query,
          calls,
          total_exec_time,
          mean_exec_time
      FROM pg_stat_statements
      ORDER BY total_exec_time DESC
      LIMIT 10;
    `);
  } catch (e: any) {
    if (e.message && e.message.includes('pg_stat_statements')) {
        results.slowQueries = 'pg_stat_statements not enabled';
    } else {
        results.slowQueries = 'Error executing STEP 3: ' + e.message;
    }
  }

  results.indexHealth = await prisma.$queryRawUnsafe(`
    SELECT
        relname AS table_name,
        seq_scan,
        idx_scan
    FROM pg_stat_user_tables
    ORDER BY seq_scan DESC;
  `);

  fs.writeFileSync('scratch-results.json', JSON.stringify(results, customStringifier, 2), 'utf-8');
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
