import prisma from '../src/config/database';

async function main() {
  const tableArg = process.argv[2];
  if (!tableArg) {
    console.error('Usage: npx tsx tools/inspect-table.ts <table_name>');
    process.exit(1);
  }

  const table = String(tableArg).trim();

  const [existsRow] = await prisma.$queryRawUnsafe<any[]>(
    `SELECT to_regclass($1)::text AS regclass`,
    `public.${table}`
  );

  if (!existsRow?.regclass) {
    console.error(`Table not found: public.${table}`);
    process.exit(2);
  }

  const columns = await prisma.$queryRawUnsafe<any[]>(
    `
    SELECT
      c.ordinal_position,
      c.column_name,
      c.data_type,
      c.is_nullable,
      c.column_default
    FROM information_schema.columns c
    WHERE c.table_schema = 'public' AND c.table_name = $1
    ORDER BY c.ordinal_position
    `,
    table
  );

  const indexes = await prisma.$queryRawUnsafe<any[]>(
    `
    SELECT
      i.relname AS index_name,
      ix.indisprimary AS is_primary,
      ix.indisunique AS is_unique,
      pg_get_indexdef(ix.indexrelid) AS definition
    FROM pg_class t
    JOIN pg_index ix ON t.oid = ix.indrelid
    JOIN pg_class i ON i.oid = ix.indexrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public' AND t.relname = $1
    ORDER BY ix.indisprimary DESC, ix.indisunique DESC, i.relname ASC
    `,
    table
  );

  const [{ count }] = await prisma.$queryRawUnsafe<any[]>(
    `SELECT COUNT(*)::bigint AS count FROM public."${table}"`
  );

  console.log(`\nTable: public.${table}`);
  console.log(`Rows: ${count}`);
  console.log('\nColumns:');
  columns.forEach((col) => {
    console.log(
      `  ${String(col.ordinal_position).padStart(2, ' ')}. ${col.column_name} | ${col.data_type} | nullable=${col.is_nullable} | default=${col.column_default ?? 'null'}`
    );
  });

  console.log('\nIndexes:');
  indexes.forEach((idx) => {
    console.log(
      `  - ${idx.index_name} | primary=${idx.is_primary} | unique=${idx.is_unique}`
    );
    console.log(`    ${idx.definition}`);
  });
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
