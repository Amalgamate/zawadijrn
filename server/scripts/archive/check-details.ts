import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Real Row Counts ---');
    const counts = await Promise.all([
        prisma.user.count(),
        prisma.learner.count(),
        prisma.feeInvoice.count(),
        prisma.feePayment.count(),
        prisma.attendance.count(),
        prisma.formativeAssessment.count(),
        prisma.summativeResult.count(),
        prisma.class.count(),
    ]);

    const tables = ['users', 'learners', 'fee_invoices', 'fee_payments', 'attendances', 'formative_assessments', 'summative_results', 'classes'];
    tables.forEach((t, i) => console.log(`${t}: ${counts[i]}`));

    console.log('\n--- Specific Index Check ---');
    const indexDetails = await prisma.$queryRawUnsafe(`
        SELECT
            tablename,
            indexname,
            indexdef
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename IN ('learners', 'fee_invoices', 'users', 'attendances', 'formative_assessments', 'summative_results')
        ORDER BY tablename, indexname;
    `);
    console.log(JSON.stringify(indexDetails, null, 2));
}

main().finally(() => prisma.$disconnect());
