const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const schedules = await prisma.classSchedule.findMany({
      where: { classId: "non-existent" },
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true } },
        learningArea: { select: { id: true, name: true, shortName: true } }
      },
      take: 1
    });
    console.log('SUCCESS:', schedules);
  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}
main();
