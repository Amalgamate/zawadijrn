
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const grade3Tests = await prisma.summativeTest.findMany({
        where: {
            grade: 'GRADE_3',
            archived: false
        }
    });
    console.log('--- GRADE 3 TESTS ---');
    console.log(JSON.stringify(grade3Tests, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
