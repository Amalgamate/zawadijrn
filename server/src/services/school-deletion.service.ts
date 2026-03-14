import prisma from '../config/database';
import { auditService } from './audit.service';

export interface DeletionOptions {
    hardDelete?: boolean;      // true = permanent delete, false = soft delete
    reason?: string;           // Reason for deletion
    deletedBy: string;         // User ID performing the deletion
}

export interface DeletionResult {
    success: boolean;
    message: string;
    deletedAt: Date;
    stats: {
        usersAffected: number;
        learnersAffected: number;
    };
}

/**
 * Safely delete school data with proper cleanup
 * In single-tenant mode, this is a system reset.
 */
export async function deleteSchoolSafely(
    schoolId: string,
    options: DeletionOptions
): Promise<DeletionResult> {

    console.log('🗑️  Starting system reset/school deletion process...');

    // 1. Validate school exists
    const school = await prisma.school.findUnique({
        where: { id: schoolId }
    });

    if (!school) {
        throw new Error('School not found');
    }

    // 2. Perform deletion in order of dependencies
    const stats = await prisma.$transaction(async (tx) => {
        const learnersCount = await tx.learner.count();
        const usersCount = await tx.user.count({ where: { role: { not: 'SUPER_ADMIN' } } });

        // Delete dependent data using deleteMany (since no schoolId relation)
        await tx.feePayment.deleteMany({});
        await tx.feeInvoice.deleteMany({});
        await tx.summativeResult.deleteMany({});
        await tx.summativeTest.deleteMany({});
        await tx.formativeAssessment.deleteMany({});
        await tx.classEnrollment.deleteMany({});
        await tx.attendance.deleteMany({});
        await tx.learner.deleteMany({});

        // Delete users EXCEPT super admin (to keep access)
        await tx.user.deleteMany({
            where: { role: { not: 'SUPER_ADMIN' } }
        });

        await tx.admissionSequence.deleteMany({});
        await tx.termConfig.deleteMany({});
        await tx.aggregationConfig.deleteMany({});
        await tx.streamConfig.deleteMany({});
        await tx.gradingSystem.deleteMany({});

        if (options.hardDelete) {
            await tx.school.delete({ where: { id: schoolId } });
        } else {
            await tx.school.update({
                where: { id: schoolId },
                data: { active: false, status: 'DELETED' }
            });
        }

        return {
            usersAffected: usersCount,
            learnersAffected: learnersCount
        };
    });

    const deletedAt = new Date();

    // Log audit
    await auditService.logChange({
        entityType: 'System',
        entityId: schoolId,
        action: 'DELETE',
        userId: options.deletedBy,
        reason: options.reason || 'System Reset',
        oldValue: JSON.stringify({ name: school.name, stats })
    });

    return {
        success: true,
        message: options.hardDelete
            ? 'System permanently reset'
            : 'School deactivated and data cleared',
        deletedAt,
        stats
    };
}

export async function restoreSchool(schoolId: string): Promise<any> {
    const school = await prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) throw new Error('School not found');

    return await prisma.school.update({
        where: { id: schoolId },
        data: { active: true, status: 'ACTIVE' }
    });
}

export async function getDeletedSchools(): Promise<any[]> {
    return await prisma.school.findMany({
        where: { status: 'DELETED', active: false }
    });
}
