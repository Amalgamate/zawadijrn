import { PrismaClient, RubricRating, DetailedRubricRating } from '@prisma/client';

export async function seedSeniorGrading(prisma: PrismaClient) {
  console.log('\n📐 Seeding Senior High Hierarchical Grading (EE2-BE1)...');

  // 1. Find or Create the Senior Grading System
  let system = await prisma.gradingSystem.findFirst({
    where: { type: 'CBC', isDefault: true }
  });

  if (!system) {
    system = await prisma.gradingSystem.create({
      data: {
        name: 'Senior Secondary CBC 8-Level Scale',
        type: 'CBC',
        isDefault: true,
      }
    });
    console.log(`   ✅ Created Senior Grading System: ${system.name}`);
  } else {
    console.log(`   ℹ️  Senior Grading System already exists: ${system.name}`);
  }

  // 2. Define the 8 Hierarchical Levels
  const levels = [
    { code: 'EE2', band: 'Exceeding Expectations', rating: DetailedRubricRating.EE2, min: 85, max: 100, points: 12, color: '#1e3a8a', order: 1 },
    { code: 'EE1', band: 'Exceeding Expectations', rating: DetailedRubricRating.EE1, min: 75, max: 84,  points: 11, color: '#1d4ed8', order: 2 },
    { code: 'ME2', band: 'Meeting Expectations',   rating: DetailedRubricRating.ME2, min: 65, max: 74,  points: 10, color: '#2563eb', order: 3 },
    { code: 'ME1', band: 'Meeting Expectations',   rating: DetailedRubricRating.ME1, min: 55, max: 64,  points: 9,  color: '#3b82f6', order: 4 },
    { code: 'AE2', band: 'Approaching Expectations', rating: DetailedRubricRating.AE2, min: 45, max: 54,  points: 8,  color: '#60a5fa', order: 5 },
    { code: 'AE1', band: 'Approaching Expectations', rating: DetailedRubricRating.AE1, min: 35, max: 44,  points: 7,  color: '#93c5fd', order: 6 },
    { code: 'BE2', band: 'Below Expectations',     rating: DetailedRubricRating.BE2, min: 20, max: 34,  points: 6,  color: '#ef4444', order: 7 },
    { code: 'BE1', band: 'Below Expectations',     rating: DetailedRubricRating.BE1, min: 0,  max: 19,  points: 5,  color: '#b91c1c', order: 8 },
  ];

  for (const level of levels) {
    const existing = await prisma.gradingRange.findFirst({
      where: { systemId: system.id, label: level.code }
    });

    if (existing) {
      console.log(`      ⏭️  Level ${level.code} already exists, skipping...`);
      continue;
    }

    await prisma.gradingRange.create({
      data: {
        systemId: system.id,
        label: level.code,
        minPercentage: level.min,
        maxPercentage: level.max,
        rubricRating: level.rating,
        parentBand: level.band,
        displayOrder: level.order,
        points: level.points,
        color: level.color,
        description: `${level.band} - (${level.code})`
      }
    });

    console.log(`      ✅ Seeded Level: ${level.code} (${level.min}% - ${level.max}%)`);
  }
}
