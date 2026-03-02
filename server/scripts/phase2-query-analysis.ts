/**
 * Phase 2: Database Query Analysis
 * 
 * Analyzes slow queries and database performance
 * 
 * Usage:
 *   npx ts-node scripts/phase2-query-analysis.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function analyzeQueries() {
  console.log('[PHASE 2] Database Query Performance Analysis');
  console.log('==============================================');
  console.log('');

  try {
    // Manual query analysis
    console.log('[*] Manual Query Analysis:');
    console.log('==========================');
    console.log('');

    // Test user lookup (used in login)
    console.log('[*] Testing: User lookup by email (login endpoint)');
    const userStart = Date.now();
    const user = await prisma.user.findUnique({
      where: { email: 'test@example.com' },
      select: {
        id: true,
        email: true,
        password: true,
        school: { select: { id: true, name: true } },
        role: true,
      },
    });
    const userTime = Date.now() - userStart;

    console.log(`   Query Time: ${userTime}ms`);
    if (user) {
      console.log(`   Result: User found (ID: ${user.id})`);
    } else {
      console.log('   Result: User not found');
    }
    console.log('');

    // Test school list
    console.log('[*] Testing: Schools listing (common query)');
    const schoolStart = Date.now();
    const schools = await prisma.school.findMany({
      take: 10,
      select: { id: true, name: true, _count: { select: { users: true, learners: true } } },
    });
    const schoolTime = Date.now() - schoolStart;

    console.log(`   Query Time: ${schoolTime}ms`);
    console.log(`   Result: ${schools.length} schools returned`);
    console.log('');

    // Check indexes
    console.log('[*] Database Indexes on User table:');
    console.log('===================================');
    const indexes = await prisma.$queryRaw<any[]>`
      SELECT 
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE tablename = 'User'
      ORDER BY indexname;
    `;

    (indexes as any[]).forEach((idx) => {
      const hasPK = idx.indexname.includes('pkey');
      const isUnique = idx.indexdef.includes('UNIQUE');
      const marker = hasPK ? '[PK]' : isUnique ? '[UK]' : '[IDX]';
      console.log('');
      console.log(`${marker} ${idx.indexname}`);
      console.log(`   Definition: ${idx.indexdef.substring(0, 100)}...`);
    });

    console.log('');
    console.log('[*] Recommendations:');
    console.log('====================');
    console.log('');
    console.log(`1. User lookup by email (${userTime}ms):`);
    console.log(`   ${userTime > 50 ? '[WARN] Slow query - Add indexes or caching' : '[OK] Acceptable performance'}`);
    console.log('');
    console.log('2. Next Steps:');
    console.log('   - Run EXPLAIN ANALYZE on slow queries');
    console.log('   - Add composite indexes if needed');
    console.log('   - Enable Prisma query logging');
    console.log('   - Consider Redis caching for hot queries');
    console.log('');
    console.log('3. APM Profiling:');
    console.log('   clinic doctor -- npm run dev');
    console.log('   Then run your load test while clinic is profiling.');
    console.log('');
  } catch (error) {
    console.log('[ERROR] Database analysis failed:');
    console.log(error);
  }

  await prisma.$disconnect();
}

analyzeQueries();
