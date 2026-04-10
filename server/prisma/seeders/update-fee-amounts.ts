import prisma from '../../src/config/database';

/**
 * Updates existing 2026 fee structure items to match the official fee schedule.
 * Deletes old items and recreates them with the correct amounts.
 * Run: npx ts-node prisma/seeders/update-fee-amounts.ts
 */

const GRADES = [
  'PLAYGROUP',
  'PP1', 'PP2', 'GRADE_1', 'GRADE_2', 'GRADE_3',
  'GRADE_4', 'GRADE_5', 'GRADE_6', 'GRADE_7',
  'GRADE_8', 'GRADE_9'
];

const GRADE_DISPLAY_NAMES: Record<string, string> = {
  'PLAYGROUP': 'Playgroup', 'PP1': 'PP1', 'PP2': 'PP2',
  'GRADE_1': 'Grade 1', 'GRADE_2': 'Grade 2', 'GRADE_3': 'Grade 3',
  'GRADE_4': 'Grade 4', 'GRADE_5': 'Grade 5', 'GRADE_6': 'Grade 6',
  'GRADE_7': 'Grade 7', 'GRADE_8': 'Grade 8', 'GRADE_9': 'Grade 9'
};

const getFeeAmounts = (grade: string): Record<string, number> => {
  switch (grade) {
    case 'PLAYGROUP': return { TUITION: 6000, ACTIVITY: 500, MEALS: 500 };           // 7,000
    case 'PP1':       return { TUITION: 7000, ACTIVITY: 500, MEALS: 500 };           // 8,000
    case 'PP2':       return { TUITION: 7500, ACTIVITY: 500, MEALS: 500 };           // 8,500
    case 'GRADE_1':
    case 'GRADE_2':   return { TUITION: 8500, ACTIVITY: 500, EXAM: 500, MEALS: 500 }; // 10,000
    case 'GRADE_3':   return { TUITION: 9000, ACTIVITY: 500, EXAM: 500, MEALS: 500 }; // 10,500
    case 'GRADE_4':
    case 'GRADE_5':   return { TUITION: 9500, ACTIVITY: 500, EXAM: 500, MEALS: 500 }; // 11,000
    case 'GRADE_6':   return { TUITION: 10500, ACTIVITY: 500, EXAM: 500, MEALS: 500 }; // 12,000
    case 'GRADE_7':   return { TUITION: 15000, ACTIVITY: 1000, EXAM: 500, LIBRARY: 500, MEALS: 500 }; // 17,500
    case 'GRADE_8':
    case 'GRADE_9':   return { TUITION: 16000, ACTIVITY: 1000, EXAM: 500, LIBRARY: 500, MEALS: 500 }; // 18,500
    default:          return { TUITION: 10000 };
  }
};

async function updateFeeAmounts() {
  console.log('🔄 Updating fee structure amounts to 2026 schedule...\n');

  try {
    const TERMS = ['TERM_1', 'TERM_2', 'TERM_3'] as const;
    const currentYear = 2026;

    // Load all active fee types into a map by code
    const feeTypes = await prisma.feeType.findMany({ where: { isActive: true } });
    const feeTypeMap = new Map(feeTypes.map(ft => [ft.code, ft]));
    console.log(`📋 Found ${feeTypes.length} active fee types: ${feeTypes.map(f => f.code).join(', ')}\n`);

    let updated = 0;
    let notFound = 0;

    for (const grade of GRADES) {
      for (const term of TERMS) {
        const structure = await prisma.feeStructure.findFirst({
          where: { grade: grade as any, term: term as any, academicYear: currentYear },
          include: { feeItems: true }
        });

        if (!structure) {
          console.log(`  ⚠️  Not found: ${GRADE_DISPLAY_NAMES[grade]} ${term}`);
          notFound++;
          continue;
        }

        const amounts = getFeeAmounts(grade);
        const total = Object.values(amounts).reduce((s, v) => s + v, 0);

        // Delete all existing items for this structure
        await prisma.feeStructureItem.deleteMany({
          where: { feeStructureId: structure.id }
        });

        // Recreate with correct amounts
        for (const [code, amount] of Object.entries(amounts)) {
          const feeType = feeTypeMap.get(code);
          if (!feeType || amount <= 0) {
            if (!feeType) console.log(`    ⚠️  Fee type "${code}" not in DB — skipping`);
            continue;
          }
          await prisma.feeStructureItem.create({
            data: {
              feeStructureId: structure.id,
              feeTypeId:      feeType.id,
              amount:         amount.toString(),
              mandatory:      true,
            }
          });
        }

        // Also update the structure name to match canonical format
        await prisma.feeStructure.update({
          where: { id: structure.id },
          data: {
            name: `${GRADE_DISPLAY_NAMES[grade]} ${term.replace('_', ' ')} Fees ${currentYear}`,
          }
        });

        console.log(`  ✅ ${GRADE_DISPLAY_NAMES[grade].padEnd(10)} ${term} → KES ${total.toLocaleString()}/term  [${Object.entries(amounts).map(([k,v]) => `${k}: ${v.toLocaleString()}`).join(' | ')}]`);
        updated++;
      }
    }

    console.log(`\n✅ Complete! Updated: ${updated}, Not found: ${notFound}`);

    // Summary table
    console.log('\n📊 2026 Fee Schedule Summary:');
    console.log('─'.repeat(60));
    for (const grade of GRADES) {
      const amounts = getFeeAmounts(grade);
      const total = Object.values(amounts).reduce((s, v) => s + v, 0);
      console.log(`  ${GRADE_DISPLAY_NAMES[grade].padEnd(12)} → KES ${total.toLocaleString()}/term  × 3 terms = KES ${(total * 3).toLocaleString()}/year`);
    }
    console.log('─'.repeat(60));

  } catch (error) {
    console.error('❌ Update failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updateFeeAmounts();
