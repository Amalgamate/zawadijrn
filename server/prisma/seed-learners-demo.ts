import { PrismaClient, Gender, LearnerStatus, Term } from '@prisma/client';

const prisma = new PrismaClient();

const PRIMARY_GRADES = [
  'PLAYGROUP',
  'PP1',
  'PP2',
  'GRADE_1',
  'GRADE_2',
  'GRADE_3',
  'GRADE_4',
  'GRADE_5',
  'GRADE_6',
  'GRADE_7',
  'GRADE_8',
  'GRADE_9',
] as const;

const SECONDARY_GRADES = ['GRADE10', 'GRADE11', 'GRADE12'] as const;

type InstitutionType = 'PRIMARY_CBC' | 'SECONDARY';

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: readonly T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

function dobForGrade(grade: string) {
  // Rough ages: keep realistic enough for demo data.
  const today = new Date();
  const year = today.getFullYear();

  const age =
    grade === 'PLAYGROUP' ? randInt(3, 4) :
    grade === 'PP1' ? randInt(4, 5) :
    grade === 'PP2' ? randInt(5, 6) :
    grade.startsWith('GRADE_') ? (6 + Number(grade.replace('GRADE_', '')) + randInt(-1, 1)) :
    grade === 'GRADE10' ? randInt(14, 16) :
    grade === 'GRADE11' ? randInt(15, 17) :
    grade === 'GRADE12' ? randInt(16, 18) :
    randInt(7, 16);

  const dob = new Date(today);
  dob.setFullYear(year - age);
  dob.setMonth(randInt(0, 11));
  dob.setDate(randInt(1, 28));
  return dob;
}

function admissionPrefix(institutionType: InstitutionType) {
  return institutionType === 'SECONDARY' ? 'SS' : 'JS';
}

async function ensureEnrollments({
  learnerId,
  institutionType,
  grade,
  stream,
  academicYear,
  term,
}: {
  learnerId: string;
  institutionType: InstitutionType;
  grade: string;
  stream: string;
  academicYear: number;
  term: Term;
}) {
  const cls = await prisma.class.findFirst({
    where: { institutionType, grade, stream, academicYear, term, archived: false },
    orderBy: { createdAt: 'desc' },
  });
  if (!cls) return false;

  await prisma.classEnrollment.upsert({
    where: { classId_learnerId: { classId: cls.id, learnerId } },
    update: { active: true, archived: false },
    create: { classId: cls.id, learnerId, active: true, archived: false },
  });
  return true;
}

async function seedInstitution({
  institutionType,
  grades,
  perGrade,
  mode,
  academicYear,
  term,
  stream,
}: {
  institutionType: InstitutionType;
  grades: readonly string[];
  perGrade: number;
  mode: 'topup' | 'add';
  academicYear: number;
  term: Term;
  stream: string;
}) {
  const FIRST_NAMES = [
    'Aisha', 'Brian', 'Cynthia', 'David', 'Esther', 'Farah', 'George', 'Hassan', 'Ivy', 'James',
    'Kevin', 'Linet', 'Mary', 'Noah', 'Olivia', 'Paul', 'Ruth', 'Samuel', 'Tanya', 'Victor',
  ] as const;
  const LAST_NAMES = [
    'Otieno', 'Wanjiku', 'Kiptoo', 'Njeri', 'Mutiso', 'Mwangi', 'Kamau', 'Achieng', 'Chebet', 'Kariuki',
  ] as const;

  let created = 0;
  let skipped = 0;
  let enrolled = 0;

  for (const grade of grades) {
    const existingCount = await prisma.learner.count({
      where: { institutionType, grade, archived: false },
    });

    const toCreate = mode === 'add' ? perGrade : Math.max(perGrade - existingCount, 0);
    if (toCreate === 0) {
      skipped += perGrade;
      continue;
    }

    for (let i = 0; i < toCreate; i++) {
      const firstName = pick(FIRST_NAMES);
      const lastName = pick(LAST_NAMES);
      const gender = Math.random() < 0.5 ? Gender.MALE : Gender.FEMALE;

      // Keep admission numbers predictable, unique, and sortable.
      const suffix = String(Date.now()).slice(-6) + String(randInt(100, 999));
      const admissionNumber = `${admissionPrefix(institutionType)}-${grade}-${suffix}`;

      const learner = await prisma.learner.create({
        data: {
          admissionNumber,
          firstName,
          lastName,
          dateOfBirth: dobForGrade(grade),
          gender,
          grade,
          institutionType,
          stream,
          status: LearnerStatus.ACTIVE,
        },
        select: { id: true },
      });

      created++;

      const didEnroll = await ensureEnrollments({
        learnerId: learner.id,
        institutionType,
        grade,
        stream,
        academicYear,
        term,
      });
      if (didEnroll) enrolled++;
    }
  }

  return { created, skipped, enrolled };
}

async function main() {
  const PER_GRADE = Number(process.env.PER_GRADE || 10);
  const MODE = String(process.env.MODE || 'topup').toLowerCase(); // "topup" ensures at least PER_GRADE per grade; "add" always adds PER_GRADE per grade
  const ACADEMIC_YEAR = Number(process.env.ACADEMIC_YEAR || new Date().getFullYear());
  // Windows often has a global TERM env var (e.g. "dumb"), which is not a Prisma Term.
  const TERM = (process.env.SEED_TERM || 'TERM_1') as Term;
  const STREAM = String(process.env.STREAM || 'A');

  console.log('🌱 Seeding demo learners...');
  console.log(`   mode=${MODE} perGrade=${PER_GRADE} year=${ACADEMIC_YEAR} term=${TERM} stream=${STREAM}`);

  const primary = await seedInstitution({
    institutionType: 'PRIMARY_CBC',
    grades: PRIMARY_GRADES,
    perGrade: PER_GRADE,
    mode: MODE === 'add' ? 'add' : 'topup',
    academicYear: ACADEMIC_YEAR,
    term: TERM,
    stream: STREAM,
  });

  const secondary = await seedInstitution({
    institutionType: 'SECONDARY',
    grades: SECONDARY_GRADES,
    perGrade: PER_GRADE,
    mode: MODE === 'add' ? 'add' : 'topup',
    academicYear: ACADEMIC_YEAR,
    term: TERM,
    stream: STREAM,
  });

  console.log('✅ Done.');
  console.log('━'.repeat(60));
  console.log(`PRIMARY_CBC: created=${primary.created} enrolled=${primary.enrolled}`);
  console.log(`SECONDARY  : created=${secondary.created} enrolled=${secondary.enrolled}`);
  console.log('━'.repeat(60));
  console.log('Tip: run classes first so enrollments can be created.');
  console.log('   npm run seed:classes');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

