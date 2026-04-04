import prisma from './src/config/database.js';

async function check() {
  try {
    console.log('Checking database...');
    const areas = await prisma.learningArea.findMany({ take: 5 });
    console.log('Learning Areas (first 5):', areas.length);
    areas.forEach(a => console.log('-', a.name, a.gradeLevel));

    const courses = await prisma.lMSCourse.findMany({ take: 5 });
    console.log('LMS Courses (first 5):', courses.length);
    courses.forEach(c => console.log('-', c.title, c.subject, c.grade));

    console.log('Grades array:', ['PLAYGROUP', 'PP1', 'PP2', 'GRADE_1', 'GRADE_2', 'GRADE_3', 'GRADE_4', 'GRADE_5', 'GRADE_6', 'GRADE_7', 'GRADE_8', 'GRADE_9']);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

check();