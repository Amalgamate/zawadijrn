import prisma from '../config/database';

interface ChangeLogParams {
  entityType: string;
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'ARCHIVE';
  userId: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  reason?: string;
}

export const auditService = {
  logChange: async (params: ChangeLogParams) => {
    try {
      await prisma.changeHistory.create({
        data: {
          entityType: params.entityType,
          entityId: params.entityId,
          action: params.action,
          changedBy: params.userId,
          field: params.field,
          oldValue: params.oldValue,
          newValue: params.newValue,
          reason: params.reason
        }
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw, just log the error so we don't block the main operation
    }
  }
};
