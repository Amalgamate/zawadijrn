import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
  try {
    // Check User counts by role
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    const superAdminCount = await prisma.user.count({ where: { role: 'SUPER_ADMIN' } });
    const teacherCount = await prisma.user.count({ where: { role: 'TEACHER' } });
    const parentCount = await prisma.user.count({ where: { role: 'PARENT' } });
    const headTeacherCount = await prisma.user.count({ where: { role: 'HEAD_TEACHER' } });
    const headOfCurriculumCount = await prisma.user.count({ where: { role: 'HEAD_OF_CURRICULUM' } });
    
    // Check Learner counts
    const learnerCount = await prisma.learner.count();
    
    // Check Class counts
    const classCount = await prisma.class.count();
    
    // Check School counts
    const schoolCount = await prisma.school.count();

    console.log('=== DATABASE SUMMARY ===\n');
    console.log('Schools:', schoolCount);
    console.log('Classes:', classCount);
    console.log('\nUsers by Role:');
    console.log('  Super Admins:', superAdminCount);
    console.log('  Admins:', adminCount);
    console.log('  Teachers:', teacherCount);
    console.log('  Head Teachers:', headTeacherCount);
    console.log('  Head of Curriculum:', headOfCurriculumCount);
    console.log('  Parents:', parentCount);
    console.log('\nLearners (Students):', learnerCount);
    
    // Get sample data if exists
    if (learnerCount > 0) {
      const sampleLearners = await prisma.learner.findMany({ take: 3 });
      console.log('\nSample Learners:');
      sampleLearners.forEach((l) => {
        console.log('  -', l.firstName, l.lastName, '(ID:', l.id.slice(0, 8) + ')');
      });
    }
    
    if (teacherCount > 0) {
      const sampleTeachers = await prisma.user.findMany({ 
        where: { role: 'TEACHER' }, 
        take: 3 
      });
      console.log('\nSample Teachers:');
      sampleTeachers.forEach((t) => {
        console.log('  -', t.firstName, t.lastName, '(', t.email, ')');
      });
    }
    
    if (parentCount > 0) {
      const sampleParents = await prisma.user.findMany({ 
        where: { role: 'PARENT' }, 
        take: 3 
      });
      console.log('\nSample Parents:');
      sampleParents.forEach((p) => {
        console.log('  -', p.firstName, p.lastName, '(', p.email, ')');
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
