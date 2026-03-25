/**
 * check_playgroup_in_db.js
 * Cross-checks the 19 Playgroup students from the CSV against the production DB.
 * Reports: correct grade, wrong grade, not found.
 *
 * Run from the /server directory:
 *   node check_playgroup_in_db.js
 */

require('dotenv').config({ path: '.env.production' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const playgroupStudents = [
  { admNo: '1410', csvName: 'IMRAAN ABDULLAHI SALESA' },
  { admNo: '1412', csvName: 'MISKY ISSACK' },
  { admNo: '1416', csvName: 'FARDOSA SOMO' },
  { admNo: '1417', csvName: 'NOORDIN ISMAIL ABDULLAHI' },
  { admNo: '1425', csvName: 'MAHIR HUSSEIN' },
  { admNo: '1426', csvName: 'MUKSIN ALI YUSSUF' },
  { admNo: '1443', csvName: 'HAMZA MOHAMED AHMED' },
  { admNo: '1447', csvName: 'ARAFAT ABDINASSIR' },
  { admNo: '1449', csvName: 'SALADHO YUHIS ABDI' },
  { admNo: '1450', csvName: 'ILHAN IDRIS' },
  { admNo: '1451', csvName: 'SAAD HASSAN IBRAHIM' },
  { admNo: '1452', csvName: 'GALGALO LIBAN GURICHA' },
  { admNo: '1453', csvName: 'LIBAN ROBA' },
  { admNo: '1454', csvName: 'AYUB SAMO' },
  { admNo: '1455', csvName: 'HASHIM ABDISALAT' },
  { admNo: '1456', csvName: 'ETHAN BARAKO' },
  { admNo: '1457', csvName: 'HANAN IDOW' },
  { admNo: '1461', csvName: 'AYAN MUSA' },
  { admNo: '1466', csvName: 'MAHADH MOHAMED DIIS' },
];

async function main() {
  const admNos = playgroupStudents.map(s => s.admNo);

  const dbRecords = await prisma.learner.findMany({
    where: {
      admissionNumber: { in: admNos },
      archived: false,
    },
    select: {
      admissionNumber: true,
      firstName: true,
      middleName: true,
      lastName: true,
      grade: true,
      status: true,
    },
  });

  const dbMap = {};
  for (const r of dbRecords) dbMap[r.admissionNumber] = r;

  const correct  = [];
  const wrong    = [];
  const notFound = [];

  for (const student of playgroupStudents) {
    const db = dbMap[student.admNo];
    if (!db) {
      notFound.push(student);
    } else {
      const dbName = [db.firstName, db.middleName, db.lastName].filter(Boolean).join(' ');
      const entry = { ...student, dbName, dbGrade: db.grade, status: db.status };
      db.grade === 'PLAYGROUP' ? correct.push(entry) : wrong.push(entry);
    }
  }

  console.log('\n========================================');
  console.log(` PLAYGROUP CSV vs DATABASE CROSS-CHECK`);
  console.log(`========================================`);
  console.log(` Total in CSV: ${playgroupStudents.length}\n`);

  console.log(`✅ CORRECT GRADE (PLAYGROUP) IN DB: ${correct.length}`);
  for (const s of correct) {
    console.log(`   Adm ${s.admNo} | ${s.dbName} | ${s.dbGrade} | ${s.status}`);
  }

  console.log(`\n⚠️  IN DB BUT WRONG GRADE: ${wrong.length}`);
  if (wrong.length === 0) {
    console.log('   None — all found records have the correct grade.');
  }
  for (const s of wrong) {
    console.log(`   Adm ${s.admNo} | CSV: "${s.csvName}" | DB: "${s.dbName}" | DB Grade: ${s.dbGrade} | Status: ${s.status}`);
  }

  console.log(`\n❌ NOT FOUND IN DB AT ALL: ${notFound.length}`);
  if (notFound.length === 0) {
    console.log('   All students were found in the database.');
  }
  for (const s of notFound) {
    console.log(`   Adm ${s.admNo} | ${s.csvName}`);
  }

  console.log('\n');

  // If there are wrong grades, output a fix summary
  if (wrong.length > 0) {
    console.log('--- FIX REQUIRED ---');
    console.log('The following learners need their grade updated to PLAYGROUP:\n');
    for (const s of wrong) {
      console.log(`  UPDATE learners SET grade = 'PLAYGROUP' WHERE "admissionNumber" = '${s.admNo}'; -- ${s.dbName} (currently ${s.dbGrade})`);
    }
    console.log('');
  }
}

main()
  .catch(e => { console.error('Error:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
