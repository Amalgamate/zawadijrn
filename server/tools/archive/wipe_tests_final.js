const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function wipeAllAssessments() {
  try {
    console.log('Starting full assessment cleanup...');
    
    // Cleanup Summative
    const srh = await prisma.summativeResultHistory.deleteMany();
    console.log(`Deleted ${srh.count} summative result history records`);
    
    const sr = await prisma.summativeResult.deleteMany();
    console.log(`Deleted ${sr.count} summative results`);
    
    const st = await prisma.summativeTest.deleteMany();
    console.log(`Deleted ${st.count} summative tests`);
    
    // Cleanup Formative
    const fa = await prisma.formativeAssessment.deleteMany();
    console.log(`Deleted ${fa.count} formative assessments`);

    // Cleanup Audits
    const sa = await prisma.assessmentSmsAudit.deleteMany();
    console.log(`Deleted ${sa.count} assessment SMS audits`);
    
    console.log('Assessment cleanup complete.');
  } catch (err) {
    console.error('Error during cleanup:', err);
  } finally {
    await prisma.$disconnect();
  }
}

wipeAllAssessments();
