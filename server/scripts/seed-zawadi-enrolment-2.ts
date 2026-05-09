import 'dotenv/config';
import bcrypt from 'bcrypt';
import prisma from '../src/config/database';

type Row = {
  admissionNumber: string;
  learnerName: string;
  gradeRaw: string;
  genderRaw: 'M' | 'F';
  religion: string;
  parentName: string;
  parentPhone: string;
};

const rows: Row[] = [
  { admissionNumber: '1468', learnerName: 'OLIVIA ADHIAMBO OUKO', gradeRaw: 'PG',  genderRaw: 'F', religion: 'CHRISTIAN', parentName: 'ROBERT OUKO',       parentPhone: '0703729934' },
  { admissionNumber: '1469', learnerName: 'BETTY VERONICA',       gradeRaw: 'PP2', genderRaw: 'F', religion: 'CHRISTIAN', parentName: 'MARTHA JUMA',      parentPhone: '0799182932' },
  { admissionNumber: '1470', learnerName: 'QEYO ADAN ABDI',       gradeRaw: 'PG',  genderRaw: 'F', religion: 'ISLAM',     parentName: 'SABRIA ADAN',      parentPhone: '0717711045' },
  { admissionNumber: '1471', learnerName: 'ZAKIR NURA SORA',      gradeRaw: '5',   genderRaw: 'M', religion: 'ISLAM',     parentName: 'FARIDA MOHAMED',   parentPhone: '0721333447' },
  { admissionNumber: '1472', learnerName: 'MARIAM DEKOW',         gradeRaw: 'PP1', genderRaw: 'F', religion: 'ISLAM',     parentName: 'HAWA JILLO',       parentPhone: '0712636210' },
  { admissionNumber: '1473', learnerName: 'HUDHEYFA SHAABAN',     gradeRaw: '5',   genderRaw: 'M', religion: 'ISLAM',     parentName: 'RAHMA SOMO',       parentPhone: '0704975594' },
  { admissionNumber: '1474', learnerName: 'ALI HASSAN',           gradeRaw: '5',   genderRaw: 'M', religion: 'ISLAM',     parentName: 'LAYO GOLO',        parentPhone: '0713074801' },
  { admissionNumber: '1475', learnerName: 'MUNIR HASSAN',         gradeRaw: '1',   genderRaw: 'M', religion: 'ISLAM',     parentName: 'LAYO GOLO',        parentPhone: '0713074801' },
  { admissionNumber: '1476', learnerName: 'AMIR HASSAN',          gradeRaw: '1',   genderRaw: 'M', religion: 'ISLAM',     parentName: 'LAYO GOLO',        parentPhone: '0713074801' },
  { admissionNumber: '1477', learnerName: 'HAMZA AYUB ABDI',      gradeRaw: '5',   genderRaw: 'M', religion: 'ISLAM',     parentName: 'MALITI ROBA',      parentPhone: '0714190612' },
  { admissionNumber: '1478', learnerName: 'ALIYA SALAD',          gradeRaw: 'PP1', genderRaw: 'F', religion: 'ISLAM',     parentName: 'SALAD',            parentPhone: '0725734100' },
  { admissionNumber: '1479', learnerName: 'ADNAN ABDI AHMED',     gradeRaw: 'PP2', genderRaw: 'M', religion: 'ISLAM',     parentName: 'ABDI AHMED',       parentPhone: '0729876301' },
  { admissionNumber: '1480', learnerName: 'ILHAN KALLA IBRAHIM',  gradeRaw: '3',   genderRaw: 'F', religion: 'ISLAM',     parentName: 'KALLA IBRAHIM',    parentPhone: '0705224980' },
  { admissionNumber: '1481', learnerName: 'DYLAN MUTUMA',         gradeRaw: '1',   genderRaw: 'M', religion: 'CHRISTIAN', parentName: 'CHRISTINE KAGENDO', parentPhone: '0790513344' },
];

const gradeMap: Record<string, string> = {
  PG: 'PLAYGROUP',
  PP1: 'PP1',
  PP2: 'PP2',
  '1': 'GRADE_1',
  '2': 'GRADE_2',
  '3': 'GRADE_3',
  '4': 'GRADE_4',
  '5': 'GRADE_5',
  '6': 'GRADE_6',
  '7': 'GRADE_7',
  '8': 'GRADE_8',
  '9': 'GRADE_9',
};

const genderMap = { M: 'MALE', F: 'FEMALE' } as const;

const cleanPhone = (v: string) => (v || '').replace(/[^\d+]/g, '').trim();

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  const firstName = parts[0] || 'Unknown';
  const lastName = parts.length > 1 ? parts[parts.length - 1] : 'Unknown';
  const middleName = parts.length > 2 ? parts.slice(1, -1).join(' ') : null;
  return { firstName, lastName, middleName };
}

function defaultDobForGrade(grade: string): Date {
  const year = new Date().getFullYear();
  if (grade === 'PLAYGROUP') return new Date(`${year - 4}-01-01T00:00:00.000Z`);
  if (grade === 'PP1') return new Date(`${year - 5}-01-01T00:00:00.000Z`);
  if (grade === 'PP2') return new Date(`${year - 6}-01-01T00:00:00.000Z`);
  const match = grade.match(/^GRADE_(\d+)$/);
  const n = match ? Number(match[1]) : 1;
  return new Date(`${year - (6 + n)}-01-01T00:00:00.000Z`);
}

async function ensureSeedAdmin() {
  const email = process.env.SUPER_ADMIN_EMAIL || 'admin@trendscore.app';
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;

  const password = await bcrypt.hash('Admin@123!', 10);
  return prisma.user.create({
    data: {
      email,
      password,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    },
  });
}

async function ensureParent(parentName: string, parentPhoneRaw: string) {
  const parentPhone = cleanPhone(parentPhoneRaw);
  const byPhone = await prisma.user.findFirst({
    where: {
      role: 'PARENT',
      phone: parentPhone,
      archived: false,
    },
  });
  if (byPhone) return byPhone;

  const { firstName, lastName } = splitName(parentName);
  const emailBase = `${firstName}.${lastName}`.toLowerCase().replace(/[^a-z0-9.]/g, '');
  const email = `${emailBase}.${parentPhone.slice(-4) || '0000'}@zawadi.local`;

  const byEmail = await prisma.user.findUnique({ where: { email } });
  if (byEmail) return byEmail;

  const password = await bcrypt.hash('Parent@123!', 10);
  return prisma.user.create({
    data: {
      email,
      password,
      firstName,
      lastName,
      phone: parentPhone || null,
      role: 'PARENT',
      status: 'ACTIVE',
      emailVerified: false,
    },
  });
}

async function main() {
  const admin = await ensureSeedAdmin();
  const createdLearners: string[] = [];
  const skippedLearners: string[] = [];
  const createdParents = new Set<string>();

  for (const row of rows) {
    const existingLearner = await prisma.learner.findUnique({
      where: { admissionNumber: row.admissionNumber },
      select: { id: true, admissionNumber: true },
    });

    if (existingLearner) {
      skippedLearners.push(row.admissionNumber);
      continue;
    }

    const parent = await ensureParent(row.parentName, row.parentPhone);
    createdParents.add(parent.id);

    const { firstName, lastName, middleName } = splitName(row.learnerName);
    const grade = gradeMap[row.gradeRaw] || row.gradeRaw;
    const gender = genderMap[row.genderRaw];

    await prisma.learner.create({
      data: {
        admissionNumber: row.admissionNumber,
        firstName,
        lastName,
        middleName,
        dateOfBirth: defaultDobForGrade(grade),
        gender: gender as any,
        grade,
        stream: 'A',
        parentId: parent.id,
        guardianName: row.parentName,
        guardianPhone: cleanPhone(row.parentPhone),
        religion: row.religion,
        status: 'ACTIVE',
        createdBy: admin.id,
      },
    });

    createdLearners.push(row.admissionNumber);
  }

  console.log(JSON.stringify({
    totalInput: rows.length,
    createdLearners: createdLearners.length,
    skippedExistingLearners: skippedLearners.length,
    createdAdmissionNumbers: createdLearners,
    skippedAdmissionNumbers: skippedLearners,
    parentRecordsTouched: createdParents.size,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

