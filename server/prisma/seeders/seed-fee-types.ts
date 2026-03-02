import prisma from '../../src/config/database';

/**
 * Backfill default fee types for all schools that don't have them
 * Run: npx ts-node prisma/seeders/seed-fee-types.ts
 */
async function seedFeeTypes() {
  console.log('🌱 Seeding default fee types for all schools...');

  const defaultFeeTypes = [
    { code: 'TUITION', name: 'Tuition', category: 'ACADEMIC' as const, description: 'School tuition fees' },
    { code: 'ACTIVITY', name: 'Activity Fee', category: 'EXTRA_CURRICULAR' as const, description: 'Co-curricular activities' },
    { code: 'TRANSPORT', name: 'Transport', category: 'TRANSPORT' as const, description: 'School transport' },
    { code: 'MEALS', name: 'Meals', category: 'BOARDING' as const, description: 'School meals and catering' },
    { code: 'EXAM', name: 'Examination Fee', category: 'ACADEMIC' as const, description: 'Examination fees' },
    { code: 'LIBRARY', name: 'Library', category: 'ACADEMIC' as const, description: 'Library resources and materials' },
    { code: 'SPORTS', name: 'Sports Fee', category: 'EXTRA_CURRICULAR' as const, description: 'Sports programs and facilities' },
    { code: 'TECHNOLOGY', name: 'Technology Fee', category: 'ACADEMIC' as const, description: 'Computer lab and tech resources' },
    { code: 'MISC', name: 'Miscellaneous', category: 'OTHER' as const, description: 'Other school charges' }
  ];

  try {
    // Get all schools
    const schools = await prisma.school.findMany();
    console.log(`Found ${schools.length} schools`);

    for (const school of schools) {
      console.log(`\n📚 Processing school: ${school.name}`);

      // Check how many fee types already exist
      const existingCount = await prisma.feeType.count({
        where: { schoolId: school.id }
      });

      if (existingCount > 0) {
        console.log(`  ✓ Fee types already exist (${existingCount} found), skipping`);
        continue;
      }

      // Create default fee types for this school
      console.log(`  Creating ${defaultFeeTypes.length} default fee types...`);
      let createdCount = 0;

      for (const feeType of defaultFeeTypes) {
        try {
          await prisma.feeType.create({
            data: {
              schoolId: school.id,
              code: feeType.code,
              name: feeType.name,
              category: feeType.category,
              description: feeType.description,
              isActive: true
            }
          });
          createdCount++;
        } catch (error: any) {
          if (error.code === 'P2002') {
            // Unique constraint violation - likely duplicate, skip
            console.log(`    ⚠️ ${feeType.code} already exists (skipped)`);
          } else {
            console.error(`    ❌ Error creating ${feeType.code}:`, error.message);
          }
        }
      }

      console.log(`  ✅ Created ${createdCount} fee types`);
    }

    console.log('\n✅ Fee type seeding complete!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedFeeTypes();
