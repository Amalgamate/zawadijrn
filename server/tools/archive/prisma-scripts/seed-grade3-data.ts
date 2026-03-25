import { PrismaClient, Term, Grade, SummativeGrade, TestStatus, AssessmentStatus } from '@prisma/client';

const prisma = new PrismaClient();

const SCHOOL_ID = '3e435fdf-2439-4329-b8c5-8245f6041cb2';
const BRANCH_ID = '66957aae-aac1-44cd-ab66-c3908e8c2978';
const ADMIN_ID = 'b292381d-3a39-4133-b53a-e00567ad2403';
const ACADEMIC_YEAR = 2026;
const TERM = Term.TERM_1;
const GRADE = Grade.GRADE_3;

const SUBJECTS = [
    { name: 'Mathematical Activities', code: 'MATH' },
    { name: 'English Language Activities', code: 'ENG' },
    { name: 'Kiswahili Language Activities', code: 'KIS' },
    { name: 'Environmental Activities', code: 'ENV' },
    { name: 'Religious Education', code: 'CRE' },
    { name: 'Movement and Creative Activities', code: 'CREA' }
];

const STUDENTS = [
    { firstName: "Mubarak", lastName: "Mohamed", scores: [100, 97, 87, 100, 100, 100], gender: "MALE" },
    { firstName: "Salman", lastName: "Ahmed", scores: [100, 97, 100, 100, 100, 93], gender: "MALE" },
    { firstName: "Faiza", lastName: "Idris", scores: [100, 93, 100, 100, 100, 100], gender: "FEMALE" },
    { firstName: "Sabrin", lastName: "Osman", scores: [100, 93, 100, 100, 100, 83], gender: "FEMALE" },
    { firstName: "Ibrahim", lastName: "Ramadhan", scores: [100, 90, 80, 100, 100, 87], gender: "MALE" },
    { firstName: "Arafat", lastName: "Sharif", scores: [92, 90, 97, 100, 100, 97], gender: "MALE" },
    { firstName: "Ufanisi", lastName: "Mboya", scores: [92, 87, 93, 94, 87, 80], gender: "MALE" },
    { firstName: "Mohamed", lastName: "Ismail", scores: [100, 77, 87, 94, 87, 73], gender: "MALE" },
    { firstName: "Basra", lastName: "Adam", scores: [80, 80, 87, 100, 87, 80], gender: "FEMALE" },
    { firstName: "Sabir", lastName: "Nagaya", scores: [84, 83, 83, 94, 87, 80], gender: "MALE" },
    { firstName: "Abubakr", lastName: "Abdi", scores: [80, 87, 80, 94, 87, 83], gender: "MALE" },
    { firstName: "Salma", lastName: "Mohamed", scores: [92, 73, 93, 94, 75, 77], gender: "FEMALE" },
    { firstName: "Abdi", lastName: "Adnan", scores: [80, 77, 90, 100, 75, 77], gender: "MALE" },
    { firstName: "Abdimalik", lastName: "Abdi", scores: [92, 67, 73, 94, 87, 83], gender: "MALE" },
    { firstName: "Mahir", lastName: "Hassan", scores: [68, 73, 73, 100, 87, 90], gender: "MALE" },
    { firstName: "Nazlin", lastName: "Ibrahim", scores: [68, 60, 90, 94, 87, 87], gender: "FEMALE" },
    { firstName: "Ismail", lastName: "Said", scores: [88, 60, 77, 94, 87, 70], gender: "MALE" },
    { firstName: "Queentred", lastName: "Kavira", scores: [76, 77, 87, 94, 63, 77], gender: "FEMALE" },
    { firstName: "Tifany", lastName: "St Paolo", scores: [88, 67, 83, 76, 75, 77], gender: "FEMALE" },
    { firstName: "Denge", lastName: "Hussein", scores: [80, 70, 77, 94, 75, 67], gender: "MALE" },
    { firstName: "Yaqub", lastName: "Abdi", scores: [72, 60, 67, 88, 87, 87], gender: "MALE" },
    { firstName: "Jarso", lastName: "Adam", scores: [92, 67, 73, 76, 87, 63], gender: "MALE" },
    { firstName: "Kasim", lastName: "Koba", scores: [72, 63, 80, 70, 100, 70], gender: "MALE" },
    { firstName: "Aisha", lastName: "Abdirahman", scores: [84, 70, 77, 82, 75, 63], gender: "FEMALE" },
    { firstName: "Sumeya", lastName: "Ibrahim", scores: [72, 60, 80, 82, 75, 70], gender: "FEMALE" },
    { firstName: "Hamza", lastName: "Abdi", scores: [72, 57, 83, 64, 75, 87], gender: "MALE" },
    { firstName: "Colliane", lastName: "Heyi", scores: [64, 60, 60, 94, 75, 77], gender: "MALE" },
    { firstName: "Abdimalik", lastName: "Ali", scores: [52, 47, 77, 100, 87, 67], gender: "MALE" },
    { firstName: "Blanche", lastName: "I Rene", scores: [68, 67, 73, 94, 63, 60], gender: "FEMALE" },
    { firstName: "Mohammed", lastName: "Ibrahim", scores: [68, 60, 60, 100, 50, 70], gender: "MALE" },
    { firstName: "Abdimalik", lastName: "Adan", scores: [64, 50, 60, 73, 75, 87], gender: "MALE" },
    { firstName: "Brenda", lastName: "Amagore", scores: [60, 60, 70, 70, 75, 63], gender: "FEMALE" },
    { firstName: "Zakir", lastName: "Adan", scores: [64, 67, 83, 52, 50, 60], gender: "MALE" },
    { firstName: "Yassir", lastName: "Mohamed", scores: [60, 83, 90, 90, 87, 44], gender: "MALE" },
    { firstName: "Al", lastName: "Issack", scores: [57, 83, 83, 93, 62, 44], gender: "MALE" },
    { firstName: "Towfiq", lastName: "Muhumed", scores: [48, 80, 47, 76, 62, 59], gender: "MALE" },
    { firstName: "Victoria", lastName: "Hassan", scores: [70, 57, 83, 83, 63, 44], gender: "FEMALE" },
    { firstName: "Fatima", lastName: "Ibrahim", scores: [70, 83, 60, 60, 63, 44], gender: "FEMALE" },
    { firstName: "Abdi", lastName: "Rahman", scores: [88, 60, 70, 76, 62, 44], gender: "MALE" }
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

async function main() {
    console.log(`🌱 Seeding Grade 3 data for Zaawadi JR Academy...`);

    // 1. Delete existing Grade 3 learners
    const deletedLearners = await prisma.learner.deleteMany({
        where: {
            schoolId: SCHOOL_ID,
            grade: GRADE
        }
    });
    console.log(`🗑️ Deleted ${deletedLearners.count} existing Grade 3 learners`);

    // 2. Ensure Scale Groups and Grading Systems exist
    // 2. Ensure Scale Groups and Grading Systems exist
    let scaleGroup = await prisma.scaleGroup.findUnique({
        where: {
            schoolId_name: {
                schoolId: SCHOOL_ID,
                name: 'Standard CBC Scale'
            }
        }
    });

    if (!scaleGroup) {
        scaleGroup = await prisma.scaleGroup.create({
            data: {
                name: 'Standard CBC Scale',
                description: 'Standard 1-4 scale for CBC',
                schoolId: SCHOOL_ID
            }
        });
    }

    const gradingSystems: { [key: string]: string } = {};
    for (const subject of SUBJECTS) {
        let gs = await prisma.gradingSystem.findFirst({
            where: {
                schoolId: SCHOOL_ID,
                grade: GRADE,
                learningArea: subject.name
            }
        });

        if (!gs) {
            gs = await prisma.gradingSystem.create({
                data: {
                    name: `${subject.name} - ${GRADE}`,
                    type: 'SUMMATIVE',
                    scaleGroupId: scaleGroup.id,
                    grade: GRADE,
                    learningArea: subject.name,
                    schoolId: SCHOOL_ID,
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
        gradingSystems[subject.name] = gs.id;
        console.log(`✅ Ensured grading system for ${subject.name}`);
    }

    // 3. Ensure Tests exist
    const tests: { [key: string]: string } = {};
    for (const subject of SUBJECTS) {
        let test = await prisma.summativeTest.findFirst({
            where: {
                schoolId: SCHOOL_ID,
                academicYear: ACADEMIC_YEAR,
                term: TERM,
                grade: GRADE,
                learningArea: subject.name
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
        } else {
            test = await prisma.summativeTest.update({
                where: { id: test.id },
                data: {
                    testType: 'OPENER',
                    status: AssessmentStatus.PUBLISHED,
                    published: true
                }
            });
            console.log(`✅ Updated test for ${subject.name}`);
        }
        tests[subject.name] = test.id;
    }

    // 4. Create Students and Results
    for (const studentData of STUDENTS) {
        const learner = await prisma.learner.create({
            data: {
                firstName: studentData.firstName,
                lastName: studentData.lastName,
                grade: GRADE,
                schoolId: SCHOOL_ID,
                branchId: BRANCH_ID,
                status: 'ACTIVE' as any,
                admissionNumber: `ADM-G3-${Math.random().toString(36).substring(7).toUpperCase()}`,
                gender: studentData.gender as any,
                dateOfBirth: new Date(new Date().getFullYear() - 9, 0, 1),
                stream: 'A'
            }
        });

        console.log(`👤 Created student: ${studentData.firstName} ${studentData.lastName}`);

        for (let i = 0; i < SUBJECTS.length; i++) {
            const subject = SUBJECTS[i];
            const score = studentData.scores[i];

            if (score === null || score === undefined) continue;

            await prisma.summativeResult.create({
                data: {
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
            console.log(`   Added ${subject.name} score for ${studentData.firstName}`);
        }
    }

    console.log(`✨ Grade 3 Seeding completed!`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
