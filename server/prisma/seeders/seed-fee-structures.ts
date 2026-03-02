import prisma from '../../src/config/database';

/**
 * Backfill default fee structures for all schools (all grades × all terms)
 * Run: npx ts-node prisma/seeders/seed-fee-structures.ts
 */

const GRADES = [
  'CRECHE', 'RECEPTION', 'TRANSITION', 'PLAYGROUP',
  'PP1', 'PP2', 'GRADE_1', 'GRADE_2', 'GRADE_3',
  'GRADE_4', 'GRADE_5', 'GRADE_6', 'GRADE_7',
  'GRADE_8', 'GRADE_9', 'GRADE_10', 'GRADE_11', 'GRADE_12'
];

const TERMS = ['TERM_1', 'TERM_2', 'TERM_3'];

const GRADE_DISPLAY_NAMES: Record<string, string> = {
  'CRECHE': 'Creche',
  'RECEPTION': 'Reception',
  'TRANSITION': 'Transition',
  'PLAYGROUP': 'Playgroup',
  'PP1': 'PP1',
  'PP2': 'PP2',
  'GRADE_1': 'Grade 1',
  'GRADE_2': 'Grade 2',
  'GRADE_3': 'Grade 3',
  'GRADE_4': 'Grade 4',
  'GRADE_5': 'Grade 5',
  'GRADE_6': 'Grade 6',
  'GRADE_7': 'Grade 7',
  'GRADE_8': 'Grade 8',
  'GRADE_9': 'Grade 9',
  'GRADE_10': 'Grade 10',
  'GRADE_11': 'Grade 11',
  'GRADE_12': 'Grade 12'
};

// Default fee amounts per grade level
const getFeeAmounts = (grade: string) => {
  // Early childhood (lower tuition)
  if (['CRECHE', 'RECEPTION', 'TRANSITION', 'PLAYGROUP', 'PP1', 'PP2'].includes(grade)) {
    return {
      TUITION: 15000,
      ACTIVITY: 500,
      TRANSPORT: 3000,
      MEALS: 8000,
      EXAM: 300,
      LIBRARY: 500,
      SPORTS: 500,
      TECHNOLOGY: 1000,
      MISC: 500
    };
  }
  // Primary (Grade 1-6, moderate tuition)
  if (['GRADE_1', 'GRADE_2', 'GRADE_3', 'GRADE_4', 'GRADE_5', 'GRADE_6'].includes(grade)) {
    return {
      TUITION: 20000,
      ACTIVITY: 800,
      TRANSPORT: 4000,
      MEALS: 10000,
      EXAM: 500,
      LIBRARY: 800,
      SPORTS: 1000,
      TECHNOLOGY: 1500,
      MISC: 800
    };
  }
  // Upper Primary (Grade 7-9, higher tuition)
  if (['GRADE_7', 'GRADE_8', 'GRADE_9'].includes(grade)) {
    return {
      TUITION: 25000,
      ACTIVITY: 1000,
      TRANSPORT: 5000,
      MEALS: 12000,
      EXAM: 800,
      LIBRARY: 1000,
      SPORTS: 1500,
      TECHNOLOGY: 2000,
      MISC: 1000
    };
  }
  // Secondary (Grade 10-12, highest tuition)
  return {
    TUITION: 30000,
    ACTIVITY: 1500,
    TRANSPORT: 6000,
    MEALS: 15000,
    EXAM: 1000,
    LIBRARY: 1500,
    SPORTS: 2000,
    TECHNOLOGY: 2500,
    MISC: 1500
  };
};

async function seedFeeStructures() {
  console.log('🌱 Seeding default fee structures for all schools...');

  try {
    // Get all schools
    const schools = await prisma.school.findMany({
      include: { branches: true }
    });
    console.log(`Found ${schools.length} schools`);

    const currentYear = new Date().getFullYear();
    let totalStructuresCreated = 0;
    let totalStructuresSkipped = 0;

    for (const school of schools) {
      console.log(`\n🏫 Processing school: ${school.name}`);

      // Get all fee types for this school
      const feeTypes = await prisma.feeType.findMany({
        where: { schoolId: school.id }
      });

      if (feeTypes.length === 0) {
        console.log(`  ⚠️ No fee types found, skipping fee structure creation`);
        continue;
      }

      // Create fee structures for each grade and term
      let schoolStructuresCreated = 0;
      let schoolStructuresSkipped = 0;

      for (const grade of GRADES) {
        for (const term of TERMS) {
          try {
            // Check if already exists
            const existing = await prisma.feeStructure.findFirst({
              where: {
                schoolId: school.id,
                grade: grade as any,
                term: term as any,
                academicYear: currentYear
              }
            });

            if (existing) {
              schoolStructuresSkipped++;
              continue;
            }

            // Create fee structure
            const feeStructure = await prisma.feeStructure.create({
              data: {
                name: `${GRADE_DISPLAY_NAMES[grade]} ${term.replace('_', ' ')} Fees ${currentYear}`,
                description: `Standard fees for ${GRADE_DISPLAY_NAMES[grade]} in ${term.replace('_', ' ')}`,
                grade: grade as any,
                term: term as any,
                academicYear: currentYear,
                mandatory: true,
                active: true,
                schoolId: school.id,
                branchId: school.branches && school.branches.length > 0 ? school.branches[0].id : null
              }
            });

            // Get amounts for this grade
            const amounts = getFeeAmounts(grade);

            // Create fee items for this structure
            for (const feeType of feeTypes) {
              const amount = amounts[feeType.code as keyof typeof amounts] || 0;

              if (amount > 0) {
                await prisma.feeStructureItem.create({
                  data: {
                    feeStructureId: feeStructure.id,
                    feeTypeId: feeType.id,
                    amount: amount.toString(),
                    mandatory: true
                  }
                });
              }
            }

            schoolStructuresCreated++;
          } catch (error: any) {
            if (error.code === 'P2002') {
              schoolStructuresSkipped++;
            } else {
              console.error(`    ❌ Error creating structure for ${grade} ${term}:`, error.message);
            }
          }
        }
      }

      console.log(`  ✅ Created ${schoolStructuresCreated} structures, skipped ${schoolStructuresSkipped}`);
      totalStructuresCreated += schoolStructuresCreated;
      totalStructuresSkipped += schoolStructuresSkipped;
    }

    console.log(`\n✅ Fee structure seeding complete!`);
    console.log(`   Total Created: ${totalStructuresCreated}`);
    console.log(`   Total Skipped: ${totalStructuresSkipped}`);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedFeeStructures();
