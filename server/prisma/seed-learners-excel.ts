
import { PrismaClient, Grade, Gender } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();

// Configuration
const ACADEMIC_YEAR = 2025;
const TERM = 'TERM_1';
const DATA_DIR = path.join(__dirname, '..', '..', 'data'); // data is in root, handled by caller or relative path

interface StudentRow {
    no: number;
    firstName: string;
    lastName: string;
    grade: Grade; // Mapped from filename/context
}

async function main() {
    console.log('🌱 Starting learner import from Excel...');

    // 1. Get the Active School and Branch
    let school = await prisma.school.findFirst({
        where: { name: 'ZAWADI JUNIOR ACADEMY' }
    });

    if (!school) {
        console.log('⚠️ "ZAWADI JUNIOR ACADEMY" not found, trying "EDucore Template"...');
        school = await prisma.school.findFirst({
            where: { name: 'EDucore Template' }
        });
    }

    if (!school) {
        console.log('⚠️ Specific school not found, taking the first active school...');
        school = await prisma.school.findFirst({
            where: { active: true }
        });
    }

    if (!school) {
        console.error('❌ "EDucore Template" school not found. Please run "npm run seed" first.');
        return;
    }

    const branch = await prisma.branch.findFirst({
        where: { schoolId: school.id, code: 'TPL' } // Assuming Template Campus
    });

    if (!branch) {
        console.error('❌ "Template Campus" branch not found. Please run "npm run seed" first.');
        return;
    }

    console.log(`🏫 Importing for: ${school.name} - ${branch.name}`);

    // 2. Define Files and Grade Mapping
    const filesToProcess = [
        { filename: 'PP1_student_grades.xlsx', grade: Grade.PP1 },
        { filename: 'PP2_student_grades-PP2.xlsx', grade: Grade.PP2 }
    ];

    for (const fileInfo of filesToProcess) {
        const filePath = path.join(DATA_DIR, fileInfo.filename);

        if (!fs.existsSync(filePath)) {
            console.warn(`⚠️ File not found: ${filePath}, skipping...`);
            continue;
        }

        console.log(`\n📂 Processing ${fileInfo.filename} for Grade: ${fileInfo.grade}`);

        // Read Excel
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

        // Identify data rows (starting from where "No." is usually 1)
        // Based on inspection:
        // Row 4: Headers ["No.","First Name","Second Name",...]
        // Row 5: Data [1, "Abdihafidh", "Musa", ...]

        // Let's find the header row index dynamically or hardcode if consistent
        let headerRowIndex = -1;
        for (let i = 0; i < rows.length; i++) {
            if (rows[i] && rows[i].includes('No.') && rows[i].includes('First Name')) {
                headerRowIndex = i;
                break;
            }
        }

        if (headerRowIndex === -1) {
            // Fallback or specific check
            console.warn('   ⚠️ Could not find header row ["No.", "First Name"]. Trying standardized index 4 or 5.');
            // Based on previous inspection, data started around row 5 index (0-based) ? 
            // Row 4 was headers.
        }

        // Process rows after header
        const dataStartIndex = headerRowIndex !== -1 ? headerRowIndex + 1 : 5;

        let createdCount = 0;
        let skippedCount = 0;

        for (let i = dataStartIndex; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length === 0) continue;

            // Check if it has a valid number in first column
            const no = parseInt(row[0]);
            if (isNaN(no)) continue;

            const firstName = row[1]?.toString().trim();
            const lastName = row[2]?.toString().trim();

            if (!firstName || !lastName) continue;

            // 3. Create or Find Learner
            // Admission Number Format: ADM-{GRADE}-{NO} to ensure uniqueness for this seed
            const admissionNumber = `ADM-${fileInfo.grade}-${no.toString().padStart(3, '0')}`;

            // Check if learner exists
            const existingLearner = await prisma.learner.findFirst({
                where: {
                    schoolId: school.id,
                    admissionNumber: admissionNumber
                }
            });

            if (existingLearner) {
                // console.log(`   ⏭️  Learner exists: ${firstName} ${lastName} (${admissionNumber})`);
                skippedCount++;
                continue;
            }

            // Create Learner
            try {
                const newLearner = await prisma.learner.create({
                    data: {
                        schoolId: school.id,
                        branchId: branch.id,
                        admissionNumber: admissionNumber,
                        firstName: firstName,
                        lastName: lastName,
                        gender: Gender.MALE, // Defaulting to MALE as gender is not in simple sheet, or randomize? Keeping simple.
                        dateOfBirth: new Date(new Date().setFullYear(new Date().getFullYear() - (fileInfo.grade === 'PP1' ? 4 : 5))), // Approx age
                        grade: fileInfo.grade,
                        stream: 'A', // Default stream
                        status: 'ACTIVE',
                        admissionDate: new Date()
                    }
                });

                // 4. Enroll in Class
                // Find the class for this grade/stream
                const studentClass = await prisma.class.findUnique({
                    where: {
                        branchId_grade_stream_academicYear_term: {
                            branchId: branch.id,
                            grade: fileInfo.grade,
                            stream: 'A',
                            academicYear: ACADEMIC_YEAR,
                            term: 'TERM_1' // derived enum check might be needed if strictly typed
                        }
                    }
                });

                if (studentClass) {
                    await prisma.classEnrollment.create({
                        data: {
                            classId: studentClass.id,
                            learnerId: newLearner.id,
                            active: true
                        }
                    });
                    createdCount++;
                    process.stdout.write('.'); // Progress indicator
                } else {
                    console.error(`   ❌ Class not found for ${fileInfo.grade} Stream A. Run seed:classes first.`);
                }

            } catch (err) {
                console.error(`   ❌ Error creating ${firstName} ${lastName}:`, err);
            }
        }
        console.log(`\n   ✅ Finished ${fileInfo.filename}: Created ${createdCount}, Skipped ${skippedCount}`);
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
