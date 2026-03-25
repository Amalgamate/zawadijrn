import { PrismaClient, Term, Grade, SummativeGrade, TestStatus, AssessmentStatus } from '@prisma/client';

const prisma = new PrismaClient();

const SCHOOL_ID = '8f931b7b-d033-4a51-a651-62da8183d6ad';
const BRANCH_ID = 'd39e8727-bc17-488c-b97e-847074b070e3';
const ADMIN_ID = 'ef511be4-ceb3-4ee6-9a37-2bcb0a468b6d';
const ACADEMIC_YEAR = 2026;
const TERM = Term.TERM_1;
const GRADE = Grade.GRADE_6;

const SUBJECTS = [
    { code: 'MATH', name: 'MATHEMATICAL ACTIVITIES' },
    { code: 'ENG', name: 'ENGLISH LANGUAGE ACTIVITIES' },
    { code: 'KIS', name: 'KISWAHILI' },
    { code: 'SCI', name: 'SCIENCE & TECHNOLOGY' },
    { code: 'SIS', name: 'SOCIAL STUDIES' },
    { code: 'C/A', name: 'CREATIVE ACTIVITIES' },
    { code: 'IRE', name: 'RELIGIOUS EDUCATION' },
    { code: 'AGRI', name: 'AGRICULTURE' }
];

const STUDENTS = [
    { firstName: 'ZAMZAM', lastName: 'HASSAN', scores: [67, 74, 64, 84, 87, 72, 93, 92] },
    { firstName: 'AMINA', lastName: 'RAMADHAN', scores: [87, 84, 62, 68, 67, 68, 100, 92] },
    { firstName: 'SHUEB', lastName: 'ALI', scores: [77, 64, 72, 76, 87, 64, 87, 100] },
    { firstName: 'KHADIJA', lastName: 'IQBAL', scores: [86, 66, 70, 76, 70, 64, 93, 100] },
    { firstName: 'MOHAMED', lastName: 'IBRAHIM', scores: [67, 58, 68, 76, 87, 68, 87, 100] },
    { firstName: 'YAHYA', lastName: 'ISACK', scores: [70, 54, 56, 72, 87, 64, 87, 100] },
    { firstName: 'IBRAHIM', lastName: 'KALLA', scores: [67, 50, 60, 76, 83, 68, 93, 92] },
    { firstName: 'AISHA', lastName: 'IBRAHIM', scores: [80, 64, 58, 64, 70, 60, 100, 92] },
    { firstName: 'AISHA', lastName: 'HUSSEIN', scores: [57, 60, 54, 80, 77, 64, 100, 92] },
    { firstName: 'LADHAN', lastName: 'ABDI', scores: [53, 66, 66, 72, 73, 72, 80, 100] },
    { firstName: 'ABUBAKAR', lastName: 'SIRAJ', scores: [63, 50, 58, 76, 87, 68, 87, 88] },
    { firstName: 'MAHIR', lastName: 'ABDULLAHI', scores: [70, 52, 68, 64, 80, 68, 67, 100] },
    { firstName: 'HAMDI', lastName: 'MOHAMED', scores: [67, 56, 54, 72, 83, 76, 67, 92] },
    { firstName: 'ABDWAHID', lastName: 'MUHAMUD', scores: [47, 46, 55, 80, 87, 68, 93, 84] },
    { firstName: 'FARHAN', lastName: 'ALI', scores: [70, 54, 56, 72, 83, 68, 67, 88] },
    { firstName: 'RAHMA', lastName: 'ABDI', scores: [50, 62, 58, 64, 83, 52, 80, 96] },
    { firstName: 'ABDIRAHMAN', lastName: 'IBRAHIM', scores: [80, 48, 66, 76, 87, 64, 87, 36] },
    { firstName: 'DAHABO', lastName: 'HUSSEIN', scores: [40, 52, 52, 68, 80, 68, 80, 84] },
    { firstName: 'MUSARDH', lastName: 'ALI', scores: [57, 48, 52, 64, 87, 68, 67, 80] },
    { firstName: 'SIHAM', lastName: 'ABDIRIZACK', scores: [60, 32, 52, 52, 87, 64, 87, 84] },
    { firstName: 'MOHAMED', lastName: 'HUSSEIN', scores: [53, 56, 48, 68, 80, 44, 80, 88] },
    { firstName: 'JAMAL', lastName: 'ABDIKADIR', scores: [73, 54, 0, 72, 80, 68, 80, 72] },
    { firstName: 'RAYAN', lastName: 'SHUKRI', scores: [83, 52, 54, 44, 67, 52, 80, 52] },
    { firstName: 'ABDIRIZACK', lastName: 'IBRAHIM', scores: [53, 32, 42, 60, 80, 44, 73, 92] },
    { firstName: 'ZAKIA', lastName: 'ALINOOR', scores: [43, 58, 50, 44, 43, 40, 60, 56] },
    { firstName: 'ROSE', lastName: 'MAKENA', scores: [47, 32, 40, 44, 60, 0, 53, 76] },
    { firstName: 'HAMIDA', lastName: 'ABDI', scores: [33, 44, 42, 52, 43, 36, 33, 56] }
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

async function seed() {
    console.log('🌱 Seeding Grade 6 data for Zaawadi JR Academy...');

    // 1. Ensure a Scale Group exists
    let scaleGroup = await prisma.scaleGroup.findFirst({
        where: { schoolId: SCHOOL_ID, archived: false }
    });

    if (!scaleGroup) {
        scaleGroup = await prisma.scaleGroup.create({
            data: {
                name: 'Standard 0-100 Scale',
                description: 'Standard grading scale for Zaawadi JR Academy',
                schoolId: SCHOOL_ID,
                active: true,
                isDefault: true
            }
        });
        console.log(`✅ Created scale group: ${scaleGroup.name}`);
    }

    // 2. Ensure Grading Systems for all subjects exist
    const gradingSystems: Record<string, string> = {};
    for (const subject of SUBJECTS) {
        let system = await prisma.gradingSystem.findFirst({
            where: {
                scaleGroupId: scaleGroup.id,
                learningArea: subject.name,
                grade: GRADE,
                archived: false
            }
        });

        if (!system) {
            system = await prisma.gradingSystem.create({
                data: {
                    name: `${GRADE.replace('_', ' ')} - ${subject.name}`,
                    scaleGroupId: scaleGroup.id,
                    learningArea: subject.name,
                    grade: GRADE,
                    schoolId: SCHOOL_ID,
                    active: true,
                    type: 'SUMMATIVE',
                    ranges: {
                        create: [
                            { label: 'Exceeding Expectation', minPercentage: 80, maxPercentage: 100, points: 4, rubricRating: 'EE' },
                            { label: 'Meeting Expectation', minPercentage: 60, maxPercentage: 79, points: 3, rubricRating: 'ME' },
                            { label: 'Approaching Expectation', minPercentage: 40, maxPercentage: 59, points: 2, rubricRating: 'AE' },
                            { label: 'Below Expectation', minPercentage: 0, maxPercentage: 39, points: 1, rubricRating: 'BE' }
                        ]
                    }
                }
            });
            console.log(`✅ Created grading system for ${subject.name}`);
        }
        gradingSystems[subject.code] = system.id;
    }

    // 3. Create Tests for each subject directly
    const tests: Record<string, string> = {};
    for (const subject of SUBJECTS) {
        let test = await prisma.summativeTest.findFirst({
            where: {
                schoolId: SCHOOL_ID,
                learningArea: subject.name,
                grade: GRADE,
                term: TERM,
                academicYear: ACADEMIC_YEAR,
                archived: false
            }
        });

        if (!test) {
            test = await prisma.summativeTest.create({
                data: {
                    title: `${subject.name} - Term 1 2026`,
                    learningArea: subject.name,
                    grade: GRADE,
                    term: TERM,
                    academicYear: ACADEMIC_YEAR,
                    testDate: new Date('2026-03-20'),
                    totalMarks: 100,
                    passMarks: 50,
                    scaleId: gradingSystems[subject.code],
                    createdBy: ADMIN_ID,
                    schoolId: SCHOOL_ID,
                    active: true,
                    published: true,
                    status: AssessmentStatus.PUBLISHED
                }
            });
            console.log(`✅ Created test for ${subject.name}`);
        }
        tests[subject.code] = test.id;
    }

    // 4. Create Students and Results
    for (const studentData of STUDENTS) {
        // Check if student exists
        let learner = await prisma.learner.findFirst({
            where: {
                schoolId: SCHOOL_ID,
                firstName: { equals: studentData.firstName, mode: 'insensitive' },
                lastName: { startsWith: studentData.lastName, mode: 'insensitive' },
                grade: GRADE
            }
        });

        if (!learner) {
            // Create student
            learner = await prisma.learner.create({
                data: {
                    firstName: studentData.firstName,
                    lastName: studentData.lastName,
                    grade: GRADE,
                    schoolId: SCHOOL_ID,
                    branchId: BRANCH_ID,
                    active: true,
                    status: 'ACTIVE' as any,
                    admissionNumber: `ADM-${Math.random().toString(36).substring(7).toUpperCase()}`,
                    gender: Math.random() > 0.5 ? 'MALE' : 'FEMALE',
                    dateOfBirth: new Date('2014-06-15')
                }
            });
            console.log(`✅ Created student: ${studentData.firstName} ${studentData.lastName}`);
        } else {
            console.log(`ℹ️ Student ${studentData.firstName} ${studentData.lastName} already exists`);
        }

        // Create results for each score
        for (let i = 0; i < SUBJECTS.length; i++) {
            const subject = SUBJECTS[i];
            const score = studentData.scores[i];

            if (score === null || score === undefined || score === 0) continue;

            // Check if result already exists
            const existingResult = await prisma.summativeResult.findUnique({
                where: {
                    testId_learnerId: {
                        testId: tests[subject.code],
                        learnerId: learner.id
                    }
                }
            });

            if (!existingResult) {
                await prisma.summativeResult.create({
                    data: {
                        testId: tests[subject.code],
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
    }

    console.log('✨ Seeding completed!');
}

seed()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
