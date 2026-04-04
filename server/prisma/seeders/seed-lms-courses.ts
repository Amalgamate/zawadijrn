import { PrismaClient, CourseStatus, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function seedLMSCourses() {
  console.log('🌱 Seeding LMS courses...');

  const teacherEmail = 'teacher@local.test';

  const teacher = await prisma.user.upsert({
    where: { email: teacherEmail },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000002',
      email: teacherEmail,
      password: await bcrypt.hash('Teacher123!', 10),
      firstName: 'Seed',
      lastName: 'Teacher',
      phone: '+254712345010',
      role: UserRole.TEACHER,
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  const courses = [
    {
      title: 'Mathematics Basics',
      description: 'Foundations of mathematics for Grade 10 learners.',
      subject: 'Mathematics',
      grade: 'GRADE_10',
      category: 'Core Subject',
      status: CourseStatus.PUBLISHED,
    },
    {
      title: 'English Language Skills',
      description: 'Develop reading, writing, and communication skills.',
      subject: 'English',
      grade: 'GRADE_10',
      category: 'Core Subject',
      status: CourseStatus.PUBLISHED,
    },
    {
      title: 'Biology Explorations',
      description: 'Introduction to biology concepts for Grade 11 learners.',
      subject: 'Biology',
      grade: 'GRADE_11',
      category: 'Science',
      status: CourseStatus.DRAFT,
    },
    {
      title: 'Business Studies Intro',
      description: 'Overview of business concepts and enterprise skills.',
      subject: 'Business Studies',
      grade: 'GRADE_11',
      category: 'Elective',
      status: CourseStatus.PUBLISHED,
    },
    {
      title: 'Computer Studies Foundations',
      description: 'Basic computer studies concepts for Grade 12 learners.',
      subject: 'Computer Studies',
      grade: 'GRADE_12',
      category: 'Elective',
      status: CourseStatus.PUBLISHED,
    },
  ];

  for (const course of courses) {
    const existingCourse = await prisma.lMSCourse.findFirst({
      where: {
        title: course.title,
        createdById: teacher.id,
      },
    });

    if (existingCourse) {
      console.log(`   ⏭️  LMS course already exists: ${course.title}`);
      continue;
    }

    await prisma.lMSCourse.create({
      data: {
        ...course,
        createdById: teacher.id,
      },
    });

    console.log(`   ✅ Seeded LMS course: ${course.title}`);
  }

  console.log('✨ LMS course seeding complete!');
}

if (require.main === module) {
  seedLMSCourses()
    .catch((error) => {
      console.error('❌ LMS course seed error:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
