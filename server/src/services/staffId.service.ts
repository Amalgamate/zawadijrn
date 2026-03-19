import prisma from '../config/database';

/**
 * Generates a unique, human-readable staff number scoped per school
 * 
 * Format: STF-{SEQUENCE} (e.g., STF-0001, STF-0002)
 *
 * Uses database-level locking via transaction to prevent race conditions
 * Staff numbers are unique per SCHOOL.
 */
const SEQUENCE_ID = 'global_staff_sequence';

/**
 * Generates a unique, human-readable staff number
 * 
 * Format: STF-{SEQUENCE} (e.g., STF-0001, STF-0002)
 *
 * Uses database-level locking via transaction to prevent race conditions
 */
export async function generateStaffId(): Promise<string> {
    try {
        // Lock and update sequence in a transaction to prevent race conditions
        const result = await prisma.$transaction(async (tx) => {
            // Find existing sequence
            let sequence = await (tx as any).staffSequence.findFirst();

            // If sequence doesn't exist, create it
            if (!sequence) {
                sequence = await (tx as any).staffSequence.create({
                    data: {
                        currentValue: 0
                    }
                });
            }

            // Increment the sequence value
            const updated = await (tx as any).staffSequence.update({
                where: {
                    id: sequence.id
                },
                data: {
                    currentValue: {
                        increment: 1
                    }
                }
            });

            return updated;
        });

        // Format the staff number
        // Using STF prefix and padding to 4 digits for a professional look
        const paddedNumber = String(result.currentValue).padStart(4, '0');
        const staffId = `STF-${paddedNumber}`;

        console.log(`✓ Generated staff ID: ${staffId}`);

        return staffId;
    } catch (error) {
        console.error('✗ Error generating staff ID:', error);
        throw error;
    }
}

/**
 * Gets the current sequence value
 */
export async function getCurrentStaffSequenceValue(): Promise<number | null> {
    try {
        const sequence = await (prisma as any).staffSequence.findFirst();

        if (!sequence) {
            return null;
        }

        return sequence.currentValue;
    } catch (error) {
        console.error('✗ Error fetching current staff sequence value:', error);
        throw error;
    }
}

/**
 * Resets the staff sequence
 * Use with caution
 */
export async function resetStaffSequence(
    newValue: number = 0
): Promise<void> {
    try {
        const sequence = await (prisma as any).staffSequence.findFirst();

        if (sequence) {
            await (prisma as any).staffSequence.update({
                where: { id: sequence.id },
                data: { currentValue: newValue }
            });
        } else {
            await (prisma as any).staffSequence.create({
                data: { currentValue: newValue }
            });
        }

        console.log(`✓ Staff sequence reset to ${newValue}`);
    } catch (error) {
        console.error('✗ Error resetting staff sequence:', error);
        throw error;
    }
}
