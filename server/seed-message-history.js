/**
 * seed-message-history.js
 * Creates 2 sample message history records (1 SMS + 1 WhatsApp).
 *
 * Run from /server:
 *   node seed-message-history.js
 */

require('dotenv').config({ path: '.env.production' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Grab the first active learner available
  const learner = await prisma.learner.findFirst({
    where: { status: 'ACTIVE', archived: false },
    select: { id: true, firstName: true, lastName: true, grade: true, guardianPhone: true, guardianName: true },
  });

  if (!learner) {
    console.log('❌ No active learners found. Import learners first.');
    return;
  }

  const admin = await prisma.user.findFirst({
    where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] } },
    select: { id: true },
  });

  const phone = learner.guardianPhone || '254712345678';
  const name  = `${learner.firstName} ${learner.lastName}`;

  await prisma.assessmentSmsAudit.createMany({
    data: [
      {
        learnerId:      learner.id,
        assessmentType: 'SUMMATIVE',
        term:           'TERM_1',
        academicYear:   2026,
        parentPhone:    phone,
        parentName:     learner.guardianName || 'Guardian',
        learnerName:    name,
        learnerGrade:   learner.grade,
        templateType:   'SUMMATIVE_TERM',
        messageContent: `Dear Parent, ${learner.firstName}'s Term 1 2026 results are ready. Average: 72%. Contact school for full report.`,
        channel:        'SMS',
        smsStatus:      'SENT',
        smsMessageId:   'MSG-SEED-001',
        sentByUserId:   admin?.id || null,
        sentAt:         new Date(Date.now() - 2 * 86400000),
      },
      {
        learnerId:      learner.id,
        assessmentType: 'FORMATIVE',
        term:           'TERM_1',
        academicYear:   2026,
        parentPhone:    phone,
        parentName:     learner.guardianName || 'Guardian',
        learnerName:    name,
        learnerGrade:   learner.grade,
        templateType:   'FORMATIVE_UPDATE',
        messageContent: `Dear Parent, ${learner.firstName} has been assessed in Mathematics (Term 1). Rating: Meeting Expectations. Keep encouraging reading at home.`,
        channel:        'WHATSAPP',
        smsStatus:      'SENT',
        smsMessageId:   'WA-SEED-001',
        sentByUserId:   admin?.id || null,
        sentAt:         new Date(Date.now() - 1 * 86400000),
      },
    ],
    skipDuplicates: true,
  });

  console.log(`✅ Created 2 message history records for ${name}.`);
}

main()
  .catch(e => { console.error('❌ Error:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
