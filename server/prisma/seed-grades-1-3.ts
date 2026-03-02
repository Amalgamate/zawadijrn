import { PrismaClient, Term, Grade, SummativeGrade, TestStatus, AssessmentStatus } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

const prisma = new PrismaClient();

const SCHOOL_ID = 'cd01e480-117b-48ca-9b16-3c829f0337ff';
const BRANCH_ID = '729dce71-511a-413e-b7f1-087c14cddf2a';
const ADMIN_ID = 'fe17b364-9d7f-4f4f-bb4f-c9b7f557a97c';
const SCALE_GROUP_ID = '981d0c48-843f-44eb-b2e9-baa867cb8c29';
const ACADEMIC_YEAR = 2026;
const TERM = Term.TERM_1;

const SUBJECT_MAPPING = [
    { excel: ['Mathematics', 'Mathe', 'Mathematic Activities'], db: 'Mathematical Activities' },
    { excel: ['English', 'Eng'], db: 'English Language Activities' },
    { excel: ['Kiswahili', 'Kisw'], db: 'Kiswahili Language Activities' },
    { excel: ['Environmental Activities', 'Envi'], db: 'Environmental Activities' },
    { excel: ['Religious \nEducation', 'Religious Education', 'Cre'], db: 'Religious Education' },
    { excel: ['Creative Activities', 'Crea'], db: 'Movement and Creative Activities' }
];

function calculateGrade(score: number): SummativeGrade {
    if (score >= 80) return SummativeGrade.A;
    if (score >= 70) return SummativeGrade.B;
    if (score >= 60) return SummativeGrade.C;
    if (score >= 50) return SummativeGrade.D;
    return SummativeGrade.E;
}

function calculateStatus(score: number): TestStatus {
    return score >= 50 ? TestStatus.PASS : TestStatus.FAIL;
}

function normalizeName(name: string): string {
    return name?.toLowerCase().replace(/[^a-z]/g, '') || '';
}

async function loadParentData() {
    console.log('📖 Loading parent data from Students Database.csv...');
    const csvPath = path.join(__dirname, '..', '..', 'templates', 'Students Database.csv');
    const workbook = XLSX.readFile(csvPath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet) as any[];

    const parentMap: Record<string, any> = {};
    data.forEach(row => {
        const nameKey = normalizeName(row['Leaner Name'] || '');
        if (nameKey) {
            parentMap[nameKey] = {
                admNo: row['Adm No']?.toString(),
                guardianName: row['Parent/Guardian'],
                phone1: row['Phone 1']?.toString(),
                phone2: row['Phone 2']?.toString()
            };
        }
    });

    console.log(`✅ Loaded ${Object.keys(parentMap).length} parent records.`);
    return parentMap;
}

async function seedGrade(fileName: string, gradeEnum: Grade, parentMap: Record<string, any>) {
    console.log(`🌱 Seeding ${fileName} for ${gradeEnum}...`);
    const filePath = path.join(__dirname, '..', '..', 'data', fileName);
    if (!fs.existsSync(filePath)) {
        console.warn(`⚠️ File not found: ${filePath}`);
        return;
    }

    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

    const headers = rows[0].map(h => h?.toString().trim());
    const dataRows = rows.slice(1);

    // 1. Identify which columns map to which DB subjects
    const colToSubject: Record<number, string> = {};
    SUBJECT_MAPPING.forEach(mapping => {
        const colIdx = headers.findIndex(h => mapping.excel.some(ex => h?.includes(ex) || ex.includes(h)));
        if (colIdx !== -1) {
            colToSubject[colIdx] = mapping.db;
        }
    });

    console.log(`   Detected subjects: ${Object.values(colToSubject).join(', ')}`);

    // 2. Process Students
    const firstNameIdx = headers.findIndex(h => h === 'First Name');
    const lastNameIdx = headers.findIndex(h => h === 'Second Name' || h === 'Last Name');
    const fullNameIdx = headers.findIndex(h => h?.includes('Name') && h !== 'First Name' && h !== 'Second Name');

    for (const row of dataRows) {
        let firstName = '';
        let lastName = '';

        if (firstNameIdx !== -1 && lastNameIdx !== -1) {
            firstName = row[firstNameIdx]?.toString().trim() || '';
            lastName = row[lastNameIdx]?.toString().trim() || '';
        } else if (fullNameIdx !== -1) {
            const parts = row[fullNameIdx]?.toString().trim().split(' ') || [];
            firstName = parts[0] || '';
            lastName = parts.slice(1).join(' ') || '';
        }

        if (!firstName) continue;

        const nameKey = normalizeName(`${firstName} ${lastName}`);
        const parentInfo = parentMap[nameKey] || {};

        // 2a. Create/Update Parent User if phone exists
        let parentId = null;
        if (parentInfo.phone1) {
            const parentUser = await prisma.user.upsert({
                where: { email: `${parentInfo.phone1}@educore.com` },
                update: {
                    firstName: parentInfo.guardianName?.split(' ')[0] || 'Parent',
                    lastName: parentInfo.guardianName?.split(' ').slice(1).join(' ') || 'User',
                    phone: parentInfo.phone1,
                    role: 'PARENT',
                    status: 'ACTIVE'
                },
                create: {
                    email: `${parentInfo.phone1}@educore.com`,
                    password: '$2a$10$7/O6jMvA1m98v0tYI8E/8u9z6n5z6n5z6n5z6n5z6n5z6n5z6n5z', // dummy hash for 'password123'
                    firstName: parentInfo.guardianName?.split(' ')[0] || 'Parent',
                    lastName: parentInfo.guardianName?.split(' ').slice(1).join(' ') || 'User',
                    phone: parentInfo.phone1,
                    role: 'PARENT',
                    status: 'ACTIVE',
                    schoolId: SCHOOL_ID,
                    branchId: BRANCH_ID
                }
            });
            parentId = parentUser.id;
        }

        // 2b. Upsert Learner
        const learner = await prisma.learner.upsert({
            where: {
                schoolId_admissionNumber: {
                    schoolId: SCHOOL_ID,
                    admissionNumber: parentInfo.admNo || `TEMP-${gradeEnum}-${nameKey.slice(0, 10)}`
                }
            },
            update: {
                firstName,
                lastName,
                grade: gradeEnum,
                guardianName: parentInfo.guardianName,
                guardianPhone: parentInfo.phone1,
                emergencyPhone: parentInfo.phone2,
                parentId: parentId,
                status: 'ACTIVE' as any
            },
            create: {
                firstName,
                lastName,
                grade: gradeEnum,
                schoolId: SCHOOL_ID,
                branchId: BRANCH_ID,
                admissionNumber: parentInfo.admNo || `TEMP-${gradeEnum}-${nameKey.slice(0, 10)}`,
                guardianName: parentInfo.guardianName,
                guardianPhone: parentInfo.phone1,
                emergencyPhone: parentInfo.phone2,
                parentId: parentId,
                status: 'ACTIVE' as any,
                gender: 'OTHER' as any,
                dateOfBirth: new Date('2018-01-01')
            }
        });

        // 3. Process Scores
        for (const [colIdx, subjectName] of Object.entries(colToSubject)) {
            const score = parseInt(row[parseInt(colIdx)]?.toString() || '0');
            if (isNaN(score)) continue;

            const testTitle = `${subjectName} - Term 1 ${ACADEMIC_YEAR}`;

            // Ensure Grading System exists (copied logic from seed-grade2)
            let gradingSystem = await prisma.gradingSystem.findFirst({
                where: { schoolId: SCHOOL_ID, learningArea: subjectName, grade: gradeEnum, archived: false }
            });

            if (!gradingSystem) {
                gradingSystem = await prisma.gradingSystem.create({
                    data: {
                        name: `${gradeEnum} - ${subjectName}`,
                        scaleGroupId: SCALE_GROUP_ID,
                        learningArea: subjectName,
                        grade: gradeEnum,
                        schoolId: SCHOOL_ID,
                        active: true,
                        type: 'SUMMATIVE',
                        ranges: {
                            create: [
                                { label: 'Exceeding Expectation', minPercentage: 80, maxPercentage: 100, points: 4 },
                                { label: 'Meeting Expectation', minPercentage: 60, maxPercentage: 79, points: 3 },
                                { label: 'Approaching Expectation', minPercentage: 40, maxPercentage: 59, points: 2 },
                                { label: 'Below Expectation', minPercentage: 0, maxPercentage: 39, points: 1 }
                            ]
                        }
                    }
                });
            }

            // Manual Upsert for Test since @@unique is missing for the composite key
            let test = await prisma.summativeTest.findFirst({
                where: {
                    schoolId: SCHOOL_ID,
                    title: testTitle,
                    grade: gradeEnum,
                    term: TERM,
                    academicYear: ACADEMIC_YEAR
                }
            });

            if (!test) {
                test = await prisma.summativeTest.create({
                    data: {
                        title: testTitle,
                        learningArea: subjectName,
                        grade: gradeEnum,
                        term: TERM,
                        academicYear: ACADEMIC_YEAR,
                        testDate: new Date('2026-02-01'),
                        totalMarks: 100,
                        passMarks: 50,
                        scaleId: gradingSystem.id,
                        createdBy: ADMIN_ID,
                        schoolId: SCHOOL_ID,
                        active: true,
                        published: true,
                        status: AssessmentStatus.PUBLISHED,
                        testType: 'OPENER'
                    }
                });
            } else {
                test = await prisma.summativeTest.update({
                    where: { id: test.id },
                    data: { published: true, status: AssessmentStatus.PUBLISHED, testType: 'OPENER' }
                });
            }

            // Upsert Result
            await prisma.summativeResult.upsert({
                where: {
                    testId_learnerId: {
                        testId: test.id,
                        learnerId: learner.id
                    }
                },
                update: {
                    marksObtained: score,
                    percentage: score,
                    grade: calculateGrade(score),
                    status: calculateStatus(score)
                },
                create: {
                    testId: test.id,
                    learnerId: learner.id,
                    marksObtained: score,
                    percentage: score,
                    grade: calculateGrade(score),
                    status: calculateStatus(score),
                    recordedBy: ADMIN_ID,
                    schoolId: SCHOOL_ID,
                    branchId: BRANCH_ID
                }
            });
        }
    }
    console.log(`✅ Completed seeding for ${gradeEnum}`);
}

async function main() {
    const parentMap = await loadParentData();

    await seedGrade('Grade1.xlsx', Grade.GRADE_1, parentMap);
    await seedGrade('Grade2.xlsx', Grade.GRADE_2, parentMap);
    await seedGrade('Grade3.xlsx', Grade.GRADE_3, parentMap);

    console.log('✨ All grades seeded successfully!');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
