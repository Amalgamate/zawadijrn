import { PrismaClient, Term, Grade, SummativeGrade, TestStatus, AssessmentStatus } from '@prisma/client';

const prisma = new PrismaClient();

const SCHOOL_ID = '3e435fdf-2439-4329-b8c5-8245f6041cb2';
const BRANCH_ID = '66957aae-aac1-44cd-ab66-c3908e8c2978';
const ADMIN_ID = 'b292381d-3a39-4133-b53a-e00567ad2403';
const ACADEMIC_YEAR = 2026;
const TERM = Term.TERM_1;
const GRADE = Grade.GRADE_2;

const SUBJECTS = [
    { name: 'Mathematical Activities', code: 'MATH' },
    { name: 'English Language Activities', code: 'ENG' },
    { name: 'Kiswahili Language Activities', code: 'KIS' },
    { name: 'Movement and Creative Activities', code: 'CREA' },
    { name: 'Environmental Activities', code: 'ENV' },
    { name: 'Religious Education', code: 'CRE' }
];

const STUDENTS = [
    { firstName: 'Omar', lastName: 'Ibrahim', scores: [100, 97, 97, 93, 100, 100], gender: 'MALE' },
    { firstName: 'Salman', lastName: 'Abdi', scores: [96, 97, 97, 96, 100, 100], gender: 'MALE' },
    { firstName: 'Hudheyfa', lastName: 'Mohamed', scores: [100, 100, 100, 83, 100, 87], gender: 'MALE' },
    { firstName: 'Robin', lastName: 'Munene', scores: [92, 93, 100, 97, 100, 86], gender: 'MALE' },
    { firstName: 'Mohamed', lastName: 'Abdi', scores: [100, 93, 97, 90, 100, 87], gender: 'MALE' },
    { firstName: 'Mahir', lastName: 'Ahmed', scores: [100, 86, 97, 80, 100, 100], gender: 'MALE' },
    { firstName: 'Mumtaz', lastName: 'Mohamed', scores: [88, 93, 100, 90, 94, 87], gender: 'FEMALE' },
    { firstName: 'Samiira', lastName: 'Abdirahman', scores: [92, 97, 83, 90, 100, 87], gender: 'FEMALE' },
    { firstName: 'Ramzia', lastName: 'Issack', scores: [68, 97, 93, 87, 100, 100], gender: 'FEMALE' },
    { firstName: 'Shinaz', lastName: 'Abdirizack', scores: [68, 93, 97, 90, 94, 100], gender: 'FEMALE' },
    { firstName: 'Amina', lastName: 'Osman', scores: [72, 93, 100, 87, 100, 86], gender: 'FEMALE' },
    { firstName: 'Adan', lastName: 'Bishar', scores: [80, 90, 100, 83, 94, 85], gender: 'MALE' },
    { firstName: 'Abigael', lastName: 'Mukiri', scores: [92, 83, 83, 77, 100, 86], gender: 'FEMALE' },
    { firstName: 'Muzni', lastName: 'Abdikadir', scores: [84, 93, 77, 97, 94, 75], gender: 'FEMALE' },
    { firstName: 'Zeitun', lastName: 'Hassan', scores: [64, 96, 90, 87, 100, 71], gender: 'FEMALE' },
    { firstName: 'Evaline', lastName: 'Ntinyari', scores: [64, 90, 97, 80, 100, 75], gender: 'FEMALE' },
    { firstName: 'Ramadhan', lastName: 'Mohamud', scores: [68, 90, 80, 67, 100, 87], gender: 'MALE' },
    { firstName: 'Ilhaal', lastName: 'Issack', scores: [56, 90, 90, 77, 88, 88], gender: 'FEMALE' },
    { firstName: 'Abdulahi', lastName: 'Biliau', scores: [76, 90, 77, 87, 88, 71], gender: 'MALE' },
    { firstName: 'Sumeya', lastName: 'Ibrahim', scores: [72, 83, 87, 83, 98, 62], gender: 'FEMALE' },
    { firstName: 'Hassan', lastName: 'Noor', scores: [68, 93, 77, 80, 100, 68], gender: 'MALE' },
    { firstName: 'Sahman', lastName: 'Shaban', scores: [64, 73, 73, 73, 100, 87], gender: 'MALE' },
    { firstName: 'Mohamed', lastName: 'Rashid', scores: [76, 77, 70, 73, 83, 86], gender: 'MALE' },
    { firstName: 'Jabir', lastName: 'Abdi', scores: [68, 80, 73, 73, 71, 75], gender: 'MALE' },
    { firstName: 'Ilhan', lastName: 'Salat', scores: [68, 57, 97, 67, 94, 50], gender: 'FEMALE' },
    { firstName: 'Khalif', lastName: 'Hussein', scores: [44, 90, 83, 77, 76, 82], gender: 'MALE' }
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
    console.log('🌱 Seeding Grade 2 data for Zaawadi JR Academy...');

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
                    name: `Grade 2 - ${subject.name}`,
                    scaleGroupId: scaleGroup.id,
                    learningArea: subject.name,
                    grade: GRADE,
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
            console.log(`✅ Created grading system for ${subject.name}`);
        }
        gradingSystems[subject.name] = system.id;
    }

    // 3. Create Tests for each subject
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
                    scaleId: gradingSystems[subject.name],
                    createdBy: ADMIN_ID,
                    schoolId: SCHOOL_ID,
                    active: true,
                    published: true,
                    status: AssessmentStatus.PUBLISHED,
                    testType: 'OPENER'
                }
            });
            console.log(`✅ Created test for ${subject.name}`);
        } else if (test.testType !== 'OPENER') {
            test = await prisma.summativeTest.update({
                where: { id: test.id },
                data: { testType: 'OPENER' }
            });
            console.log(`✅ Updated test type to OPENER for ${subject.name}`);
        }
        tests[subject.name] = test.id;
    }

    // 4. Create Students and Results
    for (const studentData of STUDENTS) {
        // Check if student exists
        let learner = await prisma.learner.findFirst({
            where: {
                schoolId: SCHOOL_ID,
                firstName: { equals: studentData.firstName, mode: 'insensitive' },
                lastName: { equals: studentData.lastName, mode: 'insensitive' },
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
                    status: 'ACTIVE' as any,
                    admissionNumber: `ADM-G2-${Math.random().toString(36).substring(7).toUpperCase()}`,
                    gender: studentData.gender as any,
                    dateOfBirth: new Date('2018-06-15') // Assuming Grade 2 are around 7-8 years old in 2026
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

            if (score === null || score === undefined) continue;

            await prisma.summativeResult.upsert({
                where: {
                    testId_learnerId: {
                        testId: tests[subject.name],
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
                    testId: tests[subject.name],
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
            console.log(`   Updated ${subject.name} score for ${studentData.firstName}`);
        }
    }

    console.log('✨ Grade 2 Seeding completed!');
}

seed()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
