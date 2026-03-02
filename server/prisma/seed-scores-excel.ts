
import { PrismaClient, Grade, Term, SummativeGrade, TestStatus } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();

// Configuration
const ACADEMIC_YEAR = 2026;
const TERM: Term = 'TERM_1';
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const TEST_TYPE = 'OPENER';

// Grading Scale Helper
function calculateGrade(marks: number): SummativeGrade {
    if (marks >= 80) return 'A';
    if (marks >= 60) return 'B';
    if (marks >= 50) return 'C';
    if (marks >= 40) return 'D';
    return 'E';
}

function calculateStatus(marks: number): TestStatus {
    return marks >= 40 ? 'PASS' : 'FAIL';
}

async function main() {
    console.log('🌱 Starting SCORE import from Excel...');

    // 1. Get School
    let school = await prisma.school.findFirst({
        where: { name: 'ZAWADI JUNIOR ACADEMY' }
    });

    if (!school) {
        console.log('⚠️ School not found, trying EDucore Template...');
        school = await prisma.school.findFirst({ where: { name: 'EDucore Template' } });
    }

    if (!school) {
        console.error('❌ No valid school found.');
        return;
    }

    // 2. Define Mapping (Using PRE_PRIMARY_LEARNING_AREAS names)
    // Excel Header: Math, Language, Reading, Enviromental, C/A
    const subjectMapping: Record<string, string> = {
        'Math': 'Mathematical Activities',
        'Mathematical Activities': 'Mathematical Activities',
        'Language': 'Language Activities',
        'Language Activities': 'Language Activities',
        'Reading': 'Literacy & Reading',
        'Literacy': 'Literacy & Reading',
        'Literacy & Reading': 'Literacy & Reading',
        'Enviromental': 'Environmental Activities',
        'Environmental Activities': 'Environmental Activities',
        'C/A': 'Creative Activities',
        'Creative': 'Creative Activities',
        'Creative Activities': 'Creative Activities'
    };

    const filesToProcess = [
        { filename: 'PP1_student_grades.xlsx', grade: Grade.PP1 },
        { filename: 'PP2_student_grades-PP2.xlsx', grade: Grade.PP2 }
    ];

    for (const fileInfo of filesToProcess) {
        const filePath = path.join(DATA_DIR, fileInfo.filename);
        if (!fs.existsSync(filePath)) continue;

        console.log(`\n📂 Processing SCORES for ${fileInfo.filename} (${fileInfo.grade})`);

        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

        // Find Header Row
        let headerRowIndex = -1;
        for (let i = 0; i < rows.length; i++) {
            if (rows[i] && rows[i].includes('No.') && rows[i].includes('Math')) {
                headerRowIndex = i;
                break;
            }
        }

        if (headerRowIndex === -1) {
            console.error('   ❌ Header not found.');
            continue;
        }

        const headers = rows[headerRowIndex];
        const dataStartIndex = headerRowIndex + 1;

        // 3. Create Tests for this Grade
        // We need to map Column Index -> Subject Name -> Test ID
        const columnMap: Record<number, string> = {}; // colIndex -> TestId

        for (let c = 0; c < headers.length; c++) {
            const header = headers[c]?.toString().trim();
            if (subjectMapping[header]) {
                const subjectName = subjectMapping[header];

                // Find or Create Test
                // We assume one Opener Test per subject per term per grade
                const testTitle = `Opener Exam - ${subjectName}`;

                let test = await prisma.summativeTest.findFirst({
                    where: {
                        schoolId: school.id,
                        grade: fileInfo.grade,
                        term: TERM,
                        academicYear: ACADEMIC_YEAR,
                        learningArea: subjectName,
                        testType: TEST_TYPE
                    }
                });

                if (!test) {
                    // Create Test
                    // Need a creator... using first admin or similar?
                    // For seed, we can stick a dummy creator ID if foreign key requires it.
                    // Assuming seed script has a user. Let's fetch one.
                    const admin = await prisma.user.findFirst({ where: { schoolId: school.id } });
                    if (!admin) { console.error('No user found to be creator'); return; }

                    test = await prisma.summativeTest.create({
                        data: {
                            title: testTitle,
                            learningArea: subjectName,
                            testType: TEST_TYPE,
                            term: TERM,
                            academicYear: ACADEMIC_YEAR,
                            grade: fileInfo.grade,
                            testDate: new Date(),
                            totalMarks: 100, // Assumption
                            passMarks: 40,
                            schoolId: school.id,
                            createdBy: admin.id,
                            active: true,
                            status: 'PUBLISHED'
                        }
                    });
                    console.log(`   ✅ Created Test: ${testTitle}`);
                } else {
                    // console.log(`   ℹ️  Found Test: ${testTitle}`);
                }

                columnMap[c] = test.id;
            }
        }

        // 4. Process Rows and Insert Results
        for (let i = dataStartIndex; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length === 0) continue;

            const no = parseInt(row[0]);
            if (isNaN(no)) continue;

            // Construct Admission Number
            const admissionNumber = `ADM-${fileInfo.grade}-${no.toString().padStart(3, '0')}`;

            // Find Learner
            const learner = await prisma.learner.findFirst({
                where: { schoolId: school.id, admissionNumber: admissionNumber }
            });

            if (!learner) {
                console.warn(`   ⚠️ Learner not found: ${admissionNumber} (${no})`);
                continue;
            }

            // Iterate columns
            for (const [colIndex, testId] of Object.entries(columnMap)) {
                const scoreRaw = row[parseInt(colIndex)];
                const score = parseInt(scoreRaw);

                if (!isNaN(score)) {
                    // Upsert Result
                    await prisma.summativeResult.upsert({
                        where: {
                            testId_learnerId: {
                                testId: testId,
                                learnerId: learner.id
                            }
                        },
                        update: {
                            marksObtained: score,
                            percentage: score, // valid for 100 marks
                            grade: calculateGrade(score),
                            status: calculateStatus(score),
                            recordedBy: (await prisma.user.findFirst({ where: { schoolId: school.id } }))!.id // Using admin again
                        },
                        create: {
                            testId: testId,
                            learnerId: learner.id,
                            marksObtained: score,
                            percentage: score,
                            grade: calculateGrade(score),
                            status: calculateStatus(score),
                            schoolId: school.id,
                            recordedBy: (await prisma.user.findFirst({ where: { schoolId: school.id } }))!.id
                        }
                    });
                }
            }
            process.stdout.write('.');
        }
        console.log(`\n   ✅ Scores processed for ${fileInfo.grade}`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
