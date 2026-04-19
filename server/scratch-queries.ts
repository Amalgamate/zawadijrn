import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const customStringifier = (key: string, value: any) =>
    typeof value === 'bigint' ? value.toString() : value;

  console.log('\n--- STEP 1: Table Sizes ---');
  const tables = await prisma.$queryRawUnsafe(`
    SELECT
        schemaname,
        relname AS table_name,
        n_live_tup AS row_count
    FROM pg_stat_user_tables
    ORDER BY n_live_tup DESC;
  `);
  console.log(JSON.stringify(tables, customStringifier, 2));

  console.log('\n--- STEP 2: Indexes ---');
  const indexes = await prisma.$queryRawUnsafe(`
    SELECT
        tablename,
        indexname,
        indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    ORDER BY tablename;
  `);
  console.log(JSON.stringify(indexes, customStringifier, 2));

  console.log('\n--- STEP 3: Slow Queries ---');
  try {
    const slowQueries = await prisma.$queryRawUnsafe(`
      SELECT
          query,
          calls,
          total_exec_time,
          mean_exec_time
      FROM pg_stat_statements
      ORDER BY total_exec_time DESC
      LIMIT 10;
    `);
    console.log(JSON.stringify(slowQueries, customStringifier, 2));
  } catch (e: any) {
    if (e.message && e.message.includes('pg_stat_statements')) {
        console.log('pg_stat_statements not enabled');
    } else {
        console.log('Error executing STEP 3:', e.message);
    }
  }

  console.log('\n--- STEP 4: Table Index Health ---');
  const indexHealth = await prisma.$queryRawUnsafe(`
    SELECT
        relname AS table_name,
        seq_scan,
        idx_scan
    FROM pg_stat_user_tables
    ORDER BY seq_scan DESC;
  `);
  console.log(JSON.stringify(indexHealth, customStringifier, 2));
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
