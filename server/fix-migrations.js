const { PrismaClient } = require('@prisma/client');

// Use the production DB URL from environment
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://postgres.jpngcprtuqfrjjqgoyvq:gtICRvWBoOQb95a5@aws-1-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require"
    }
  }
});

async function main() {
  try {
    console.log("Checking if library tables exist...");
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'book_loans'
    `;

    if (tables.length === 0) {
      console.log("⚠️ Table 'book_loans' is missing. Clearing migration record...");
      
      const res = await prisma.$executeRaw`
        DELETE FROM "_prisma_migrations" 
        WHERE "migration_name" = '20260404104631_add_library_accounting_sync_v2'
      `;
      
      console.log(`✅ Deleted migration record. Prisma will now re-apply it. Status: ${res}`);
    } else {
      console.log("✅ 'book_loans' already exists. No action needed.");
    }
  } catch (e) {
    console.error("❌ Failed to fix migrations:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
