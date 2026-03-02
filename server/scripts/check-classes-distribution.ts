import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const classes = await prisma.class.findMany({
        select: {
            id: true,
            grade: true,
            term: true,
            academicYear: true,
            active: true
        }
    });

    console.log('Total classes in database:', classes.length);
    console.log('Classes Distribution:');
    console.table(classes);

    const activeTermConfig = await prisma.termConfig.findFirst({
        where: { isActive: true }
    });

    console.log('Active Term Config:', activeTermConfig);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
