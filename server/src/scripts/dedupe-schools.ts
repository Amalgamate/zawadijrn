import prisma from '../config/database';

type Mode = 'dry-run' | 'apply';

const mode: Mode = process.argv.includes('--apply') ? 'apply' : 'dry-run';

async function main() {
  const schools = await prisma.school.findMany({
    orderBy: [{ active: 'desc' }, { updatedAt: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      name: true,
      active: true,
      archived: true,
      createdAt: true,
      updatedAt: true,
      email: true,
      phone: true,
    },
  });

  if (schools.length <= 1) {
    console.log(`[dedupe-schools] OK: found ${schools.length} school row(s). No action needed.`);
    return;
  }

  const keep = schools[0];
  const extras = schools.slice(1);

  console.log(`[dedupe-schools] Found ${schools.length} school rows.`);
  console.log(`[dedupe-schools] Keeping: ${keep.id} (${keep.name})`);
  extras.forEach((s, i) => {
    console.log(`[dedupe-schools] Extra ${i + 1}: ${s.id} (${s.name}) active=${s.active} archived=${s.archived}`);
  });

  if (mode === 'dry-run') {
    console.log('[dedupe-schools] Dry run only. Re-run with --apply to archive extras.');
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.school.update({
      where: { id: keep.id },
      data: { active: true, archived: false, status: 'ACTIVE' },
    });

    for (const s of extras) {
      await tx.school.update({
        where: { id: s.id },
        data: { active: false, archived: true, status: 'DEACTIVATED' },
      });
    }
  });

  console.log(`[dedupe-schools] Applied. Kept 1 row, archived ${extras.length} extra row(s).`);
}

main()
  .catch((error) => {
    console.error('[dedupe-schools] Failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

