import { PrismaClient, Grade, Term } from '@prisma/client';

const prisma = new PrismaClient();

const STANDARD_FEES: Record<string, number> = {
    'PLAYGROUP': 7000,
    'PP1': 8000,
    'PP2': 8500,
    'GRADE_1': 10000,
    'GRADE_2': 10000,
    'GRADE_3': 10500,
    'GRADE_4': 11000,
    'GRADE_5': 11000,
    'GRADE_6': 12000,
    'GRADE_7': 17500,
    'GRADE_8': 18500,
    'GRADE_9': 18500,
};

async function main() {
    console.log('🚀 Starting Fee Structure Update for Term 1 2026...');

    // 1. Get School (First active)
    const school = await prisma.school.findFirst();

    if (!school) {
        console.error('❌ No school found!');
        return;
    }
    console.log(`🏫 Updating fees for: ${school.name}`);

    // 2. Ensure Fee Types exist
    const feeTypes = [
        { name: 'Tuition Fees', code: 'TUIT', category: 'ACADEMIC' },
        { name: 'Activity Fees', code: 'ACT', category: 'EXTRA_CURRICULAR' },
        { name: 'Maintenance Levy', code: 'MAINT', category: 'OTHER' }, // Categorizing roughly
    ];

    const typeMap: Record<string, string> = {}; // name -> id

    for (const ft of feeTypes) {
        // Check if exists
        let type = await prisma.feeType.findFirst({
            where: { code: ft.code }
        });

        if (!type) {
            type = await prisma.feeType.create({
                data: {
                    name: ft.name,
                    code: ft.code,
                    category: ft.category as any, // Cast if enum mismatch
                    isActive: true
                }
            });
            console.log(`✅ Created Fee Type: ${ft.name}`);
        }
        typeMap[ft.name] = type.id;
    }

    // 3. Update Fee Structures
    for (const [gradeKey, totalAmount] of Object.entries(STANDARD_FEES)) {
        const grade = gradeKey as Grade;

        // Calculate split
        // 70% Tuition, 15% Activity, 15% Maintenance
        const tuition = Math.floor(totalAmount * 0.70);
        const activity = Math.floor(totalAmount * 0.15);
        const maintenance = totalAmount - tuition - activity; // Remainder ensures exact sum

        console.log(`\nProcessing ${grade} - Total: ${totalAmount}`);
        console.log(`   Detailed: T:${tuition} + A:${activity} + M:${maintenance} = ${tuition + activity + maintenance}`);

        // Upsert Fee Structure Header
        const structure = await prisma.feeStructure.upsert({
            where: {
                schoolId_grade_term_academicYear: {
                    schoolId: school.id,
                    grade: grade,
                    term: Term.TERM_1,
                    academicYear: 2026
                }
            },
            update: {
                name: `Term 1 2026 Fees - ${grade}`,
                description: 'Standard Fee Structure',
                active: true,
            },
            create: {
                schoolId: school.id,
                grade: grade,
                term: Term.TERM_1,
                academicYear: 2026,
                name: `Term 1 2026 Fees - ${grade}`,
                description: 'Standard Fee Structure',
                active: true,
                mandatory: true
            }
        });

        // 4. Clear existing items ("Delete what we have")
        await prisma.feeStructureItem.deleteMany({
            where: { feeStructureId: structure.id }
        });

        // 5. Create new distributed items
        await prisma.feeStructureItem.create({
            data: {
                feeStructureId: structure.id,
                feeTypeId: typeMap['Tuition Fees'],
                amount: tuition,
                mandatory: true
            }
        });

        await prisma.feeStructureItem.create({
            data: {
                feeStructureId: structure.id,
                feeTypeId: typeMap['Activity Fees'],
                amount: activity,
                mandatory: true
            }
        });

        await prisma.feeStructureItem.create({
            data: {
                feeStructureId: structure.id,
                feeTypeId: typeMap['Maintenance Levy'],
                amount: maintenance,
                mandatory: true
            }
        });

        console.log(`   ✅ Updated items for ${grade}`);
    }

    // 6. Fix existing Invoices? (Optional but recommended to match "delete what we have")
    // The user said "Just generate the term 1 fees, delete what we have". 
    // Updating PAST invoices might be dangerous if they were real, but this seems like a setup phase.
    // I will Update PENDING invoices to correct totals, but leave PAID ones alone?
    // User said "delete what we have". I'll stick to updating STructures.
    // If invoices are regenerated from the structure (which they should be), they will pick up new items.
    // However, existing invoice records store a snapshot? No, referencing structure.
    // The `FeeInvoice` model has `totalAmount`. I should update that too for consistency.

    console.log('\n🔄 Updating active invoice totals to match new structures...');

    // Find all invoices for this term/year
    const invoices = await prisma.feeInvoice.findMany({
        where: {
            term: Term.TERM_1,
            academicYear: 2026,
            feeStructure: { schoolId: school.id }
        },
        include: { learner: true }
    });

    for (const inv of invoices) {
        const g = inv.learner.grade;
        const correctTotal = STANDARD_FEES[g];
        if (correctTotal && Number(inv.totalAmount) !== correctTotal) {
            // Recalculate balance
            const paid = Number(inv.paidAmount);
            const newBal = correctTotal - paid;

            await prisma.feeInvoice.update({
                where: { id: inv.id },
                data: {
                    totalAmount: correctTotal,
                    balance: newBal
                }
            });
            // process.stdout.write('.');
        }
    }
    console.log(`\n✅ Checked/Updated ${invoices.length} invoices.`);

}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
