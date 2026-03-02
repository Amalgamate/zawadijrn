import { Request, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/permissions.middleware';
import { ApiError } from '../utils/error.util';

// Type cast for broadcast models (Prisma client includes these models at runtime)
const broadcastPrisma = prisma as any;

/**
 * Save Broadcast Campaign
 * POST /api/broadcasts
 */
export const saveBroadcastCampaign = async (req: AuthRequest, res: Response) => {
  try {
    const {
      messagePreview,
      messageTemplate,
      totalRecipients,
      successCount,
      failedCount,
      recipientSource,
      recipients // Array of {phone, name, status, messageId, sentAt}
    } = req.body;

    const schoolId = (req as any).tenant?.schoolId || req.user?.schoolId;
    const senderId = req.user?.userId || (req as any).user?.id;

    if (!schoolId || !senderId) {
      throw new ApiError(400, 'School and user context required');
    }

    // Create broadcast campaign
    const campaign = await broadcastPrisma.broadcastCampaign.create({
      data: {
        schoolId,
        senderId,
        messagePreview: messagePreview.substring(0, 150),
        messageTemplate,
        totalRecipients,
        successCount,
        failedCount,
        recipientSource,
        sentAt: new Date(),
        status: failedCount === 0 ? 'DELIVERED' : 'SENT',
        // Create broadcast recipients
        recipients: {
          createMany: {
            data: recipients.map((r: any) => ({
              recipientPhone: r.phone,
              recipientName: r.name,
              status: r.status === 'Sent' ? 'DELIVERED' : 'FAILED',
              messageId: r.messageId,
              sentAt: new Date(r.sentAt || Date.now()),
              failureReason: r.error || null
            }))
          }
        }
      }
    });

    // Also sync to AssessmentSmsAudit for unified message history
    try {
      if (recipients && recipients.length > 0) {
        await prisma.assessmentSmsAudit.createMany({
          data: recipients.map((r: any) => ({
            schoolId,
            learnerId: r.id, // This is the learner ID passed from frontend
            parentPhone: r.phone,
            parentName: r.name || 'Parent',
            learnerName: r.studentName || r.name || 'Student',
            learnerGrade: r.grade || 'N/A',
            assessmentType: 'BROADCAST',
            templateType: 'GENERAL',
            messageContent: messagePreview,
            smsStatus: r.status === 'Sent' ? 'SENT' : 'FAILED',
            sentByUserId: senderId,
            channel: 'SMS',
            sentAt: new Date(r.sentAt || Date.now())
          }))
        });
        console.log(`✅ Synced ${recipients.length} recipients to audit logs`);
      }
    } catch (auditError) {
      console.error('❌ Failed to sync broadcast to audit logs:', auditError);
      // Non-blocking error
    }

    console.log(`✅ Broadcast campaign saved: ${campaign.id}`);

    res.status(201).json({
      success: true,
      message: 'Broadcast campaign saved successfully',
      campaignId: campaign.id,
      data: campaign
    });
  } catch (error: any) {
    console.error('❌ Save Broadcast Error:', error);
    res.status(500).json({
      error: error.message || 'Failed to save broadcast campaign'
    });
  }
};

/**
 * Get Broadcast History
 * GET /api/broadcasts
 */
export const getBroadcastHistory = async (req: AuthRequest, res: Response) => {
  try {
    const schoolId = (req as any).tenant?.schoolId || req.user?.schoolId;
    const { limit = 50, offset = 0 } = req.query;

    if (!schoolId) {
      throw new ApiError(400, 'School context required');
    }

    const campaigns = await broadcastPrisma.broadcastCampaign.findMany({
      where: { schoolId },
      orderBy: { sentAt: 'desc' },
      take: parseInt(limit as string) || 50,
      skip: parseInt(offset as string) || 0,
      include: {
        recipients: {
          select: {
            recipientPhone: true,
            status: true,
            messageId: true,
            sentAt: true,
            failureReason: true
          },
          take: 10 // Show first 10 recipients per campaign
        }
      }
    });

    const total = await broadcastPrisma.broadcastCampaign.count({
      where: { schoolId }
    });

    res.status(200).json({
      success: true,
      data: campaigns,
      pagination: {
        total,
        limit: parseInt(limit as string) || 50,
        offset: parseInt(offset as string) || 0,
        hasMore: (parseInt(offset as string) || 0) + (parseInt(limit as string) || 50) < total
      }
    });
  } catch (error: any) {
    console.error('❌ Get Broadcast History Error:', error);
    res.status(500).json({
      error: error.message || 'Failed to retrieve broadcast history'
    });
  }
};

/**
 * Get Broadcast Campaign Details
 * GET /api/broadcasts/:campaignId
 */
export const getBroadcastDetails = async (req: AuthRequest, res: Response) => {
  try {
    const schoolId = (req as any).tenant?.schoolId || req.user?.schoolId;
    const { campaignId } = req.params;

    if (!schoolId) {
      throw new ApiError(400, 'School context required');
    }

    const campaign = await broadcastPrisma.broadcastCampaign.findUnique({
      where: { id: campaignId },
      include: {
        recipients: {
          orderBy: { sentAt: 'desc' }
        },
        deliveryLogs: {
          orderBy: { sentAt: 'desc' },
          take: 100
        }
      }
    });

    if (!campaign) {
      throw new ApiError(404, 'Broadcast campaign not found');
    }

    if (campaign.schoolId !== schoolId) {
      throw new ApiError(403, 'Not authorized to view this broadcast');
    }

    res.status(200).json({
      success: true,
      data: campaign
    });
  } catch (error: any) {
    console.error('❌ Get Broadcast Details Error:', error);
    res.status(error.statusCode || 500).json({
      error: error.message || 'Failed to retrieve broadcast details'
    });
  }
};

/**
 * Get Broadcast Statistics
 * GET /api/broadcasts/stats/:schoolId
 */
export const getBroadcastStats = async (req: AuthRequest, res: Response) => {
  try {
    const schoolId = (req as any).tenant?.schoolId || req.user?.schoolId;

    if (!schoolId) {
      throw new ApiError(400, 'School context required');
    }

    const totalBroadcasts = await broadcastPrisma.broadcastCampaign.count({
      where: { schoolId }
    });

    const totalRecipients = await broadcastPrisma.broadcastCampaign.aggregate({
      where: { schoolId },
      _sum: { totalRecipients: true }
    });

    const totalSuccessful = await broadcastPrisma.broadcastCampaign.aggregate({
      where: { schoolId },
      _sum: { successCount: true }
    });

    const totalFailed = await broadcastPrisma.broadcastCampaign.aggregate({
      where: { schoolId },
      _sum: { failedCount: true }
    });

    const recentCampaigns = await broadcastPrisma.broadcastCampaign.findMany({
      where: { schoolId },
      orderBy: { sentAt: 'desc' },
      take: 5,
      select: {
        id: true,
        messagePreview: true,
        sentAt: true,
        totalRecipients: true,
        successCount: true,
        failedCount: true
      }
    });

    res.status(200).json({
      success: true,
      data: {
        totalBroadcasts,
        totalRecipients: totalRecipients._sum.totalRecipients || 0,
        totalSuccessful: totalSuccessful._sum.successCount || 0,
        totalFailed: totalFailed._sum.failedCount || 0,
        successRate: totalRecipients._sum.totalRecipients
          ? Math.round(
            ((totalSuccessful._sum.successCount || 0) /
              (totalRecipients._sum.totalRecipients || 1)) *
            100
          )
          : 0,
        recentCampaigns
      }
    });
  } catch (error: any) {
    console.error('❌ Get Broadcast Stats Error:', error);
    res.status(error.statusCode || 500).json({
      error: error.message || 'Failed to retrieve statistics'
    });
  }
};

/**
 * Save SMS Delivery Log Entry
 * POST /api/broadcasts/:campaignId/delivery-logs
 */
export const saveSmsDeliveryLog = async (req: AuthRequest, res: Response) => {
  try {
    const { campaignId } = req.params;
    const {
      recipientPhone,
      message,
      provider,
      providerId,
      status,
      statusCode,
      errorDetails
    } = req.body;

    const schoolId = (req as any).tenant?.schoolId || req.user?.schoolId;

    if (!schoolId || !campaignId) {
      throw new ApiError(400, 'Missing required fields');
    }

    // Verify campaign exists and belongs to school
    const campaign = await broadcastPrisma.broadcastCampaign.findUniqueOrThrow({
      where: { id: campaignId }
    });

    if (campaign.schoolId !== schoolId) {
      throw new ApiError(403, 'Not authorized');
    }

    const log = await broadcastPrisma.smsDeliveryLog.create({
      data: {
        campaignId,
        recipientPhone,
        message: message.substring(0, 255),
        messageLength: message.length,
        provider,
        providerId: providerId || null,
        status,
        statusCode: statusCode || null,
        errorDetails: errorDetails || null,
        sentAt: new Date()
      }
    });

    res.status(201).json({
      success: true,
      data: log
    });
  } catch (error: any) {
    console.error('❌ Save Delivery Log Error:', error);
    res.status(500).json({
      error: error.message || 'Failed to save delivery log'
    });
  }
};

/**
 * Delete Broadcast Campaign
 * DELETE /api/broadcasts/:campaignId
 */
export const deleteBroadcastCampaign = async (req: AuthRequest, res: Response) => {
  try {
    const { campaignId } = req.params;
    const schoolId = (req as any).tenant?.schoolId || req.user?.schoolId;

    if (!schoolId) {
      throw new ApiError(400, 'School context required');
    }

    const campaign = await broadcastPrisma.broadcastCampaign.findUnique({
      where: { id: campaignId }
    });

    if (!campaign) {
      throw new ApiError(404, 'Campaign not found');
    }

    if (campaign.schoolId !== schoolId) {
      throw new ApiError(403, 'Not authorized');
    }

    await broadcastPrisma.broadcastCampaign.delete({
      where: { id: campaignId }
    });

    console.log(`✅ Broadcast campaign deleted: ${campaignId}`);

    res.status(200).json({
      success: true,
      message: 'Broadcast campaign deleted successfully'
    });
  } catch (error: any) {
    console.error('❌ Delete Broadcast Error:', error);
    res.status(error.statusCode || 500).json({
      error: error.message || 'Failed to delete broadcast campaign'
    });
  }
};
