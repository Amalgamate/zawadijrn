import prisma from '../../src/config/database';

/**
 * Backfill default fee structures for all schools (all grades × all terms)
 * Run: npx ts-node prisma/seeders/seed-fee-structures.ts
 */

const GRADES = [
  'PLAYGROUP',
  'PP1', 'PP2', 'GRADE_1', 'GRADE_2', 'GRADE_3',
  'GRADE_4', 'GRADE_5', 'GRADE_6', 'GRADE_7',
  'GRADE_8', 'GRADE_9'
];

const TERMS = ['TERM_1', 'TERM_2', 'TERM_3'];

const GRADE_DISPLAY_NAMES: Record<string, string> = {
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
  'GRADE_9': 'Grade 9'
};

/**
 * Per-grade fee breakdown — totals match the school's official 2026 fee schedule:
 *
 *  Play Group  →  7,000 / term
 *  PP1         →  8,000 / term
 *  PP2         →  8,500 / term
 *  Grade 1–2   → 10,000 / term
 *  Grade 3     → 10,500 / term
 *  Grade 4–5   → 11,000 / term
 *  Grade 6     → 12,000 / term
 *  Grade 7     → 17,500 / term
 *  Grade 8–9   → 18,500 / term
 */
const getFeeAmounts = (grade: string): Record<string, number> => {
  switch (grade) {
    case 'PLAYGROUP':
      // Total: 7,000
      return { TUITION: 6000, ACTIVITY: 500, MEALS: 500 };

    case 'PP1':
      // Total: 8,000
      return { TUITION: 7000, ACTIVITY: 500, MEALS: 500 };

    case 'PP2':
      // Total: 8,500
      return { TUITION: 7500, ACTIVITY: 500, MEALS: 500 };

    case 'GRADE_1':
    case 'GRADE_2':
      // Total: 10,000
      return { TUITION: 8500, ACTIVITY: 500, EXAM: 500, MEALS: 500 };

    case 'GRADE_3':
      // Total: 10,500
      return { TUITION: 9000, ACTIVITY: 500, EXAM: 500, MEALS: 500 };

    case 'GRADE_4':
    case 'GRADE_5':
      // Total: 11,000
      return { TUITION: 9500, ACTIVITY: 500, EXAM: 500, MEALS: 500 };

    case 'GRADE_6':
      // Total: 12,000
      return { TUITION: 10500, ACTIVITY: 500, EXAM: 500, MEALS: 500 };

    case 'GRADE_7':
      // Total: 17,500
      return { TUITION: 15000, ACTIVITY: 1000, EXAM: 500, LIBRARY: 500, MEALS: 500 };

    case 'GRADE_8':
    case 'GRADE_9':
      // Total: 18,500
      return { TUITION: 16000, ACTIVITY: 1000, EXAM: 500, LIBRARY: 500, MEALS: 500 };

    default:
      return { TUITION: 10000 };
  }
};

async function seedFeeStructures() {
  console.log('🌱 Seeding fee structures (2026 schedule)...');

  try {
    const currentYear = 2026;
    let totalCreated = 0;
    let totalSkipped = 0;

    // Fee types are global (no schoolId in current schema)
    const feeTypes = await prisma.feeType.findMany({ where: { isActive: true } });
    console.log(`Found ${feeTypes.length} active fee types`);

    if (feeTypes.length === 0) {
      console.log('⚠️  No fee types found — make sure FeeTypes are seeded first.');
      return;
    }

    const feeTypeMap = new Map(feeTypes.map(ft => [ft.code, ft]));

    for (const grade of GRADES) {
      for (const term of TERMS) {
        try {
          // Check if already exists (unique on grade+term+academicYear)
          const existing = await prisma.feeStructure.findFirst({
            where: { grade: grade as any, term: term as any, academicYear: currentYear }
          });

          if (existing) {
            console.log(`  ⏭  Skipped: ${GRADE_DISPLAY_NAMES[grade]} ${term} ${currentYear} (already exists)`);
            totalSkipped++;
            continue;
          }

          // Create fee structure
          const feeStructure = await prisma.feeStructure.create({
            data: {
              name:        `${GRADE_DISPLAY_NAMES[grade]} ${term.replace('_', ' ')} Fees ${currentYear}`,
              description: `Standard fees for ${GRADE_DISPLAY_NAMES[grade]} — ${term.replace('_', ' ')} ${currentYear}`,
              grade:       grade as any,
              term:        term as any,
              academicYear: currentYear,
              mandatory:   true,
              active:      true,
            }
          });

          // Create fee structure items
          const amounts = getFeeAmounts(grade);
          for (const [code, amount] of Object.entries(amounts)) {
            const feeType = feeTypeMap.get(code);
            if (!feeType || amount <= 0) continue;

            await prisma.feeStructureItem.create({
              data: {
                feeStructureId: feeStructure.id,
                feeTypeId:      feeType.id,
                amount:         amount.toString(),
                mandatory:      true,
              }
            });
          }

          const total = Object.values(amounts).reduce((s, v) => s + v, 0);
          console.log(`  ✅ ${GRADE_DISPLAY_NAMES[grade]} ${term} — KES ${total.toLocaleString()}/term`);
          totalCreated++;

        } catch (error: any) {
          if (error.code === 'P2002') {
            totalSkipped++;
          } else {
            console.error(`  ❌ Error — ${grade} ${term}:`, error.message);
          }
        }
      }
    }

    console.log(`\n✅ Done! Created: ${totalCreated}, Skipped: ${totalSkipped}`);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedFeeStructures();
