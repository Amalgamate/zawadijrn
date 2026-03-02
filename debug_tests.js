
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const tests = await prisma.summativeTest.findMany({
        where: {
            archived: false,
        },
        select: {
            id: true,
            title: true,
            grade: true,
            term: true,
            academicYear: true,
            testType: true,
        }
    });

    console.log('--- ALL SUMMATIVE TESTS ---');
    console.log(JSON.stringify(tests, null, 2));

    const grade2Tests = await prisma.summativeTest.findMany({
        where: {
            grade: 'GRADE_2',
            archived: false
        }
    });
    console.log('--- GRADE 2 TESTS ---');
    console.log(JSON.stringify(grade2Tests, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
