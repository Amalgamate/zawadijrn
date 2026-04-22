import prisma from './src/config/database';

async function check() {
  try {
    const courses = await prisma.lMSCourse.findMany({
      select: { id: true, title: true, subject: true, grade: true, status: true, createdAt: true }
    });
    console.log('Total LMS Courses:', courses.length);
    if (courses.length > 0) {
      console.log('\nCourses:');
      courses.forEach(c => console.log(`- ${c.title} | Subject: ${c.subject} | Grade: ${c.grade} | Status: ${c.status}`));
    } else {
      console.log('No courses found in database');
    }
  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
