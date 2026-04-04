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
    const school = await prisma.school.findFirst();
    const separator = school?.branchSeparator || '-';
    const formatType = school?.admissionFormatType || 'NO_BRANCH';

    const buildAdmissionNumber = (sequenceValue: number) => {
      const paddedNumber = String(sequenceValue).padStart(3, '0');
      switch (formatType) {
        case 'NO_BRANCH':
          return `ADM${separator}${academicYear}${separator}${paddedNumber}`;
        case 'BRANCH_PREFIX_START':
          return `${branchCode}${separator}ADM${separator}${academicYear}${separator}${paddedNumber}`;
        case 'BRANCH_PREFIX_MIDDLE':
          return `ADM${separator}${branchCode}${separator}${academicYear}${separator}${paddedNumber}`;
        case 'BRANCH_PREFIX_END':
          return `ADM${separator}${academicYear}${separator}${paddedNumber}${separator}${branchCode}`;
        default:
          return `ADM${separator}${academicYear}${separator}${paddedNumber}`;
      }
    };

    const admissionNumber = await prisma.$transaction(async (tx) => {
      let sequence = await tx.admissionSequence.findUnique({ where: { academicYear } });
      if (!sequence) {
        sequence = await tx.admissionSequence.create({ data: { academicYear, currentValue: 0 } });
      }

      while (true) {
        const updatedSequence = await tx.admissionSequence.update({
          where: { academicYear },
          data: { currentValue: { increment: 1 } }
        });

        const candidate = buildAdmissionNumber(updatedSequence.currentValue);
        const existingLearner = await tx.learner.findUnique({ where: { admissionNumber: candidate } });
        if (!existingLearner) {
          return candidate;
        }
      }
    });

    return admissionNumber;
  } catch (error) {
    console.error('✗ Error generating admission number:', error);
    throw error;
  }
}

export async function getCurrentSequenceValue(academicYear: number): Promise<number | null> {
  const sequence = await prisma.admissionSequence.findUnique({ where: { academicYear } });
  return sequence ? sequence.currentValue : null;
}

export async function getNextAdmissionNumberPreview(
  branchCode: string = 'MC',
  academicYear: number = new Date().getFullYear()
): Promise<string | null> {
  const school = await prisma.school.findFirst();
  if (!school) return null;

  const sequence = await prisma.admissionSequence.findUnique({ where: { academicYear } });
  const nextValue = sequence ? sequence.currentValue + 1 : 1;
  const paddedNumber = String(nextValue).padStart(3, '0');
  const separator = school.branchSeparator || '-';

  switch (school.admissionFormatType) {
    case 'NO_BRANCH':
      return `ADM${separator}${academicYear}${separator}${paddedNumber}`;
    case 'BRANCH_PREFIX_START':
      return `${branchCode}${separator}ADM${separator}${academicYear}${separator}${paddedNumber}`;
    case 'BRANCH_PREFIX_MIDDLE':
      return `ADM${separator}${branchCode}${separator}${academicYear}${separator}${paddedNumber}`;
    case 'BRANCH_PREFIX_END':
      return `ADM${separator}${academicYear}${separator}${paddedNumber}${separator}${branchCode}`;
    default:
      return `ADM${separator}${academicYear}${separator}${paddedNumber}`;
  }
}

export async function resetSequence(academicYear: number, newValue: number = 0): Promise<void> {
  await prisma.admissionSequence.upsert({
    where: { academicYear },
    update: { currentValue: newValue },
    create: { academicYear, currentValue: newValue }
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
