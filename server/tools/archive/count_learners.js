const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLearners() {
    try {
        const learners = await prisma.learner.findMany({
            select: { grade: true, stream: true, status: true }
        });
        
        console.log('--- LEARNER AUDIT ---');
        console.log('Total Learners:', learners.length);
        
        const byGrade = learners.reduce((acc, l) => {
            acc[l.grade] = (acc[l.grade] || 0) + 1;
            return acc;
        }, {});
        
        console.log('By Grade:', byGrade);
        
        const byStatus = learners.reduce((acc, l) => {
            acc[l.status] = (acc[l.status] || 0) + 1;
            return acc;
        }, {});
        
        console.log('By Status:', byStatus);
        
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

checkLearners();
