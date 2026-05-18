import prisma from '../config/database';

/**
 * Generates a unique, human-readable admission number
 * 
 * Format depends on school's admissionFormatType:
 * - NO_BRANCH:           ADM-{YEAR}-{SEQUENCE}
 * - BRANCH_PREFIX_START: {BRANCH_CODE}-ADM-{YEAR}-{SEQUENCE}
 * - BRANCH_PREFIX_MIDDLE: ADM-{BRANCH_CODE}-{YEAR}-{SEQUENCE}
 * - BRANCH_PREFIX_END:   ADM-{YEAR}-{SEQUENCE}-{BRANCH_CODE}
 */
export async function generateAdmissionNumber(
  branchCode: string = 'MC',
  academicYear: number = new Date().getFullYear()
): Promise<string> {
  try {
    const admissionNumber = await prisma.$transaction(async (tx) => {
      const settings = await getAdmissionSettings(tx);
      if (settings.mode === 'MANUAL') {
        throw new Error('Admission numbering is set to MANUAL. Provide admission number explicitly.');
      }
      return await findNextAvailableAdmissionNumber(tx, settings, {
        branchCode,
        academicYear,
        persistSequence: true
      });
    });

    return admissionNumber;
  } catch (error) {
    console.error('✗ Error generating admission number:', error);
    throw error;
  }
}

export async function getCurrentSequenceValue(academicYear: number): Promise<number | null> {
  const settings = await getAdmissionSettings(prisma);
  const sequenceYear = settings.resetRule === 'YEARLY' ? academicYear : 0;
  const sequence = await prisma.admissionSequence.findUnique({ where: { academicYear: sequenceYear } });
  return sequence ? sequence.currentValue : null;
}

export async function getNextAdmissionNumberPreview(
  branchCode: string = 'MC',
  academicYear: number = new Date().getFullYear()
): Promise<string | null> {
  const settings = await getAdmissionSettings(prisma);
  return await findNextAvailableAdmissionNumber(prisma, settings, {
    branchCode,
    academicYear,
    persistSequence: false
  });
}

export async function resetSequence(academicYear: number, newValue: number = 0): Promise<void> {
  const settings = await getAdmissionSettings(prisma);
  const sequenceYear = settings.resetRule === 'YEARLY' ? academicYear : 0;
  await prisma.admissionSequence.upsert({
    where: { academicYear: sequenceYear },
    update: { currentValue: newValue },
    create: { academicYear: sequenceYear, currentValue: newValue }
  });
}

export function extractSequenceNumber(
  admissionNumber: string,
  formatType: string = 'BRANCH_PREFIX_START',
  separator: string = '-'
): number | null {
  const escapedSeparator = separator === '.' ? '\\.' : separator;
  let pattern: RegExp;

  switch (formatType) {
    case 'NO_BRANCH':
      pattern = new RegExp(`^ADM${escapedSeparator}\\d{4}${escapedSeparator}(\\d{3})$`);
      break;
    case 'BRANCH_PREFIX_START':
      pattern = new RegExp(`^[A-Z0-9]+${escapedSeparator}ADM${escapedSeparator}\\d{4}${escapedSeparator}(\\d{3})$`);
      break;
    case 'BRANCH_PREFIX_MIDDLE':
      pattern = new RegExp(`^ADM${escapedSeparator}[A-Z0-9]+${escapedSeparator}\\d{4}${escapedSeparator}(\\d{3})$`);
      break;
    case 'BRANCH_PREFIX_END':
      pattern = new RegExp(`^ADM${escapedSeparator}\\d{4}${escapedSeparator}(\\d{3})${escapedSeparator}[A-Z0-9]+$`);
      break;
    default:
      return null;
  }

  const match = admissionNumber.match(pattern);
  return match ? parseInt(match[1], 10) : null;
}

type AdmissionSettings = {
  mode: 'AUTO' | 'MANUAL';
  pattern: string;
  width: number;
  startNumber: number;
  resetRule: 'NEVER' | 'YEARLY';
};

async function getAdmissionSettings(db: any): Promise<AdmissionSettings> {
  const school = await db.school.findFirst({
    where: { archived: false },
    orderBy: [{ active: 'desc' }, { updatedAt: 'desc' }, { createdAt: 'desc' }],
    select: {
      admissionNumberMode: true,
      admissionPattern: true,
      admissionSequenceWidth: true,
      admissionStartNumber: true,
      admissionResetRule: true
    }
  });

  return {
    mode: school?.admissionNumberMode || 'AUTO',
    pattern: school?.admissionPattern || 'ADM-{YEAR}-{SEQ}',
    width: Math.max(1, Number(school?.admissionSequenceWidth || 4)),
    startNumber: Math.max(1, Number(school?.admissionStartNumber || 1000)),
    resetRule: school?.admissionResetRule || 'YEARLY'
  };
}

function formatAdmissionNumber(
  settings: AdmissionSettings,
  value: number,
  academicYear: number,
  branchCode: string
): string {
  const seq = String(value).padStart(settings.width, '0');
  if (!settings.pattern || settings.pattern.trim() === '') return seq;
  return settings.pattern
    .replaceAll('{YEAR}', String(academicYear))
    .replaceAll('{SEQ}', seq)
    .replaceAll('{BRANCH}', String(branchCode || '').toUpperCase());
}

async function findNextAvailableAdmissionNumber(
  db: any,
  settings: AdmissionSettings,
  options: { branchCode: string; academicYear: number; persistSequence: boolean }
): Promise<string> {
  const sequenceYear = settings.resetRule === 'YEARLY' ? options.academicYear : 0;
  const sequence = await db.admissionSequence.upsert({
    where: { academicYear: sequenceYear },
    create: { academicYear: sequenceYear, currentValue: 0 },
    update: {}
  });

  let nextValue = sequence.currentValue > 0 ? sequence.currentValue + 1 : settings.startNumber;

  while (true) {
    const candidate = formatAdmissionNumber(settings, nextValue, options.academicYear, options.branchCode);
    const exists = await db.learner.findUnique({ where: { admissionNumber: candidate } });
    if (!exists) {
      if (options.persistSequence) {
        await db.admissionSequence.update({
          where: { id: sequence.id },
          data: { currentValue: nextValue }
        });
      }
      return candidate;
    }
    nextValue += 1;
  }
}
