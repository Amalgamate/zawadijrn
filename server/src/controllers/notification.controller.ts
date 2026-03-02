/**
 * Notification Controller
 * Handles sending notifications (WhatsApp, SMS, Email) to parents
 * 
 * @module controllers/notification.controller
 */

import { Response } from 'express';
import { AuthRequest } from '../middleware/permissions.middleware';
import { whatsappService } from '../services/whatsapp.service';
import prisma from '../config/database';
import { ApiError } from '../utils/error.util';

export class NotificationController {
  /**
   * Send assessment completion notification to parent
   * POST /api/notifications/assessment-complete
   */
  async sendAssessmentNotification(req: AuthRequest, res: Response) {
    const {
      learnerId,
      assessmentType, // 'Formative' or 'Summative'
      subject,
      grade,
      term,
    } = req.body;

    // Validate input
    if (!learnerId || !assessmentType) {
      throw new ApiError(400, 'Learner ID and assessment type are required');
    }

    // Get learner with parent info
    const learner = await prisma.learner.findUnique({
      where: {
        id: learnerId
      },
      include: {
        parent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    if (!learner) {
      throw new ApiError(404, 'Learner not found');
    }

    if (!learner.parent) {
      throw new ApiError(400, 'Parent information not available for this learner');
    }

    if (!learner.parent.phone) {
      throw new ApiError(400, 'Parent phone number not available');
    }

    // Send WhatsApp notification
    const result = await whatsappService.sendAssessmentNotification({
      parentPhone: learner.parent.phone,
      parentName: `${learner.parent.firstName} ${learner.parent.lastName}`,
      learnerName: `${learner.firstName} ${learner.lastName}`,
      assessmentType,
      subject,
      grade: grade || learner.grade,
      term
    } as any);

    if (result.success) {
      res.json({
        success: true,
        message: 'Assessment notification sent successfully',
        data: {
          sent: true,
          recipient: learner.parent.phone,
        },
      });
    } else {
      throw new ApiError(500, result.error || 'Failed to send notification');
    }
  }

  /**
   * Send bulk assessment notifications to multiple parents
   * POST /api/notifications/assessment-complete/bulk
   */
  async sendBulkAssessmentNotifications(req: AuthRequest, res: Response) {
    const {
      learnerIds,
      assessmentType,
      subject,
      grade,
      term,
    } = req.body;

    // Validate input
    if (!learnerIds || !Array.isArray(learnerIds) || learnerIds.length === 0) {
      throw new ApiError(400, 'Learner IDs array is required');
    }

    if (!assessmentType) {
      throw new ApiError(400, 'Assessment type is required');
    }

    // Get learners with parent info
    const learners = await prisma.learner.findMany({
      where: {
        id: { in: learnerIds }
      },
      include: {
        parent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });

    // Prepare notifications
    const notifications = learners
      .filter(l => l.parent && l.parent.phone) // Only include learners with parent phone
      .map(l => ({
        parentPhone: l.parent!.phone!,
        parentName: `${l.parent!.firstName} ${l.parent!.lastName}`,
        learnerName: `${l.firstName} ${l.lastName}`,
        assessmentType,
        subject,
        grade: grade || l.grade,
        term,
      }));

    if (notifications.length === 0) {
      throw new ApiError(400, 'No valid parent phone numbers found for the selected learners');
    }

    // Send bulk notifications
    const result = await whatsappService.sendBulkAssessmentNotifications(notifications);

    res.json({
      success: true,
      message: `Sent ${result.sent} notifications, ${result.failed} failed`,
      data: {
        total: learnerIds.length,
        sent: result.sent,
        failed: result.failed,
        skipped: learnerIds.length - notifications.length,
      },
    });
  }

  /**
   * Send custom message to parent
   * POST /api/notifications/custom
   */
  async sendCustomMessage(req: AuthRequest, res: Response) {
    const { parentId, message } = req.body;

    // Validate input
    if (!parentId || !message) {
      throw new ApiError(400, 'Parent ID and message are required');
    }

    // Get parent info
    const parent = await prisma.user.findUnique({
      where: {
        id: parentId
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
      },
    });

    if (!parent) {
      throw new ApiError(404, 'Parent not found');
    }

    if (parent.role !== 'PARENT') {
      throw new ApiError(400, 'User is not a parent');
    }

    if (!parent.phone) {
      throw new ApiError(400, 'Parent phone number not available');
    }

    // Send message
    const result = await whatsappService.sendCustomMessage({
      parentPhone: parent.phone,
      message
    } as any);

    if (result.success) {
      res.json({
        success: true,
        message: 'Custom message sent successfully',
        data: {
          sent: true,
          recipient: parent.phone,
        },
      });
    } else {
      throw new ApiError(500, result.error || 'Failed to send message');
    }
  }

  /**
   * Send announcement to all parents or filtered group
   * POST /api/notifications/announcement
   */
  async sendAnnouncement(req: AuthRequest, res: Response) {
    const { title, content, grade, stream } = req.body;

    // Validate input
    if (!title || !content) {
      throw new ApiError(400, 'Title and content are required');
    }

    // Build where clause
    const whereClause: any = {
      role: 'PARENT',
      phone: { not: null }
    };

    // If grade/stream specified, filter parents by their children's grade/stream
    let parents;
    if (grade || stream) {
      const learnerWhere: any = {};
      if (grade) learnerWhere.grade = grade;
      if (stream) learnerWhere.stream = stream;

      // Get unique parent IDs from learners
      const learners = await prisma.learner.findMany({
        where: { ...learnerWhere },
        select: { parentId: true },
      });

      const parentIds = [...new Set(learners.map(l => l.parentId).filter(Boolean))];

      parents = await prisma.user.findMany({
        where: {
          id: { in: parentIds as string[] },
          phone: { not: null },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
        },
      });
    } else {
      // Get all parents
      parents = await prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
        },
      });
    }

    if (parents.length === 0) {
      throw new ApiError(400, 'No parents found with phone numbers');
    }

    // Send announcements
    let sent = 0;
    let failed = 0;
    const results = [];

    for (const parent of parents) {
      const result = await whatsappService.sendAnnouncement({
        parentPhone: parent.phone!,
        parentName: `${parent.firstName} ${parent.lastName}`,
        title,
        content
      } as any);

      if (result.success) {
        sent++;
      } else {
        failed++;
      }

      results.push({
        parentId: parent.id,
        phone: parent.phone,
        success: result.success,
        error: result.error,
      });

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    res.json({
      success: true,
      message: `Announcement sent to ${sent} parents, ${failed} failed`,
      data: {
        total: parents.length,
        sent,
        failed,
        results,
      },
    });
  }

  /**
   * Send assessment report via SMS to parent
   * POST /api/notifications/sms/assessment-report
   */
  async sendAssessmentReportSms(req: AuthRequest, res: Response) {
    const {
      learnerId,
      learnerName,
      learnerGrade,
      parentPhone,
      parentName,
      term,
      totalTests,
      averageScore,
      overallGrade,
      totalMarks,
      maxPossibleMarks,
      subjects,
    } = req.body;

    // Validate required fields
    if (!learnerId || !learnerName || !learnerGrade || !parentPhone || !term) {
      throw new ApiError(400, 'Missing required fields: learnerId, learnerName, learnerGrade, parentPhone, term');
    }

    if (!totalTests || totalTests === 0) {
      throw new ApiError(400, 'Cannot send report with no tests');
    }

    // Import SmsService
    const { SmsService } = await import('../services/sms.service');

    // Send SMS
    const result = await SmsService.sendAssessmentReport({
      learnerId,
      learnerName,
      learnerGrade,
      parentPhone,
      parentName,
      term,
      totalTests,
      averageScore,
      overallGrade,
      totalMarks,
      maxPossibleMarks,
      subjects,
      sentByUserId: req.user?.userId,
    });

    if (result.success) {
      res.json({
        success: true,
        message: 'Assessment report SMS sent successfully',
        data: {
          sent: true,
          recipient: parentPhone,
          messageId: result.messageId,
        },
      });
    } else {
      throw new ApiError(500, result.error || 'Failed to send SMS');
    }
  }

  /**
   * Send assessment report via WhatsApp to parent
   * POST /api/notifications/whatsapp/assessment-report
   */
  async sendAssessmentReportWhatsApp(req: AuthRequest, res: Response) {
    const {
      learnerId,
      learnerName,
      learnerGrade,
      parentPhone,
      parentName,
      term,
      totalTests,
      averageScore,
      overallGrade,
      subjects,
    } = req.body;

    // Validate required fields
    if (!learnerId || !learnerName || !learnerGrade || !parentPhone || !term) {
      throw new ApiError(400, 'Missing required fields');
    }

    const result = await whatsappService.sendAssessmentReport({
      learnerId,
      learnerName,
      learnerGrade,
      parentPhone,
      parentName,
      term,
      totalTests,
      averageScore,
      overallGrade,
      subjects,
      schoolName: 'School'
    } as any);

    // Audit log
    await prisma.assessmentSmsAudit.create({
      data: {
        learnerId,
        assessmentType: 'SUMMATIVE',
        term,
        academicYear: new Date().getFullYear(),
        parentPhone: parentPhone,
        parentName: parentName || 'Unknown',
        learnerName: learnerName,
        learnerGrade: learnerGrade,
        templateType: 'SUMMATIVE_TERM',
        messageContent: 'WhatsApp Report',
        channel: 'WHATSAPP',
        smsStatus: result.success ? 'SENT' : 'FAILED',
        failureReason: result.error,
        sentByUserId: req.user?.userId,
      }
    });

    if (result.success) {
      res.json({ success: true, message: 'WhatsApp sent' });
    } else {
      throw new ApiError(500, result.error || 'Failed to send WhatsApp');
    }
  }

  /**
   * Log a communication action (e.g., WhatsApp send which is client-side)
   * POST /api/notifications/log-communication
   */
  async logCommunication(req: AuthRequest, res: Response) {
    const {
      learnerId,
      channel, // 'SMS' or 'WHATSAPP'
      term,
      academicYear,
      assessmentType = 'SUMMATIVE'
    } = req.body;

    if (!learnerId || !channel) {
      throw new ApiError(400, 'Learner ID and channel are required');
    }

    // Get learner info for the audit record
    const learner = await prisma.learner.findUnique({
      where: { id: learnerId },
      include: {
        parent: {
          select: {
            firstName: true,
            lastName: true,
            phone: true
          }
        }
      }
    });

    if (!learner) {
      throw new ApiError(404, 'Learner not found');
    }

    // Create audit record
    const audit = await prisma.assessmentSmsAudit.create({
      data: {
        learnerId,
        assessmentType,
        term,
        academicYear: academicYear ? parseInt(academicYear) : new Date().getFullYear(),
        parentPhone: learner.parent?.phone || learner.guardianPhone || 'Unknown',
        parentName: learner.parent ? `${learner.parent.firstName} ${learner.parent.lastName}` : (learner.guardianName || 'Parent'),
        learnerName: `${learner.firstName} ${learner.lastName}`,
        learnerGrade: learner.grade,
        templateType: 'SUMMATIVE_TERM',
        messageContent: `Action: ${channel} log via Dashboard`,
        channel: channel as any,
        smsStatus: 'SENT',
        sentByUserId: req.user?.userId,
      }
    });

    res.json({
      success: true,
      data: audit
    });
  }

  /**
   * Test WhatsApp connection
   * POST /api/notifications/test
   */
  async testWhatsApp(req: AuthRequest, res: Response) {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      throw new ApiError(400, 'Phone number is required');
    }

    const result = await whatsappService.sendMessage({
      to: phoneNumber,
      message: 'This is a test message from Zawadi JRN Academy. WhatsApp integration is working correctly!'
    } as any);

    res.json({
      success: result.success,
      message: result.message,
      error: result.error,
    });
  }

  /**
   * Get audit logs for SMS and WhatsApp communications
   * GET /api/notifications/audit-logs
   * 
   * TODO: Implement proper audit logging with assessmentSmsAudit model
   */
  async getAuditLogs(req: AuthRequest, res: Response) {
    const {
      startDate,
      endDate,
      channel,
      status,
      search,
      page = 1,
      limit = 50
    } = req.query as any;

    try {
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      const where: any = {};

      if (channel) where.channel = channel;
      if (status) where.smsStatus = status;
      if (startDate || endDate) {
        where.sentAt = {};
        if (startDate) where.sentAt.gte = new Date(startDate);
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          where.sentAt.lte = end;
        }
      }

      if (search) {
        where.OR = [
          { parentPhone: { contains: search, mode: 'insensitive' } },
          { parentName: { contains: search, mode: 'insensitive' } },
          { learnerName: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Fetch logs
      const logs = await prisma.assessmentSmsAudit.findMany({
        where,
        include: {
          learner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              admissionNumber: true,
              grade: true,
            }
          }
        },
        orderBy: { sentAt: 'desc' },
        skip,
        take,
      });

      const total = await prisma.assessmentSmsAudit.count({ where });

      // Fetch summary statistics
      const totalSent = await prisma.assessmentSmsAudit.count({});

      const successfulSent = await prisma.assessmentSmsAudit.count({
        where: { smsStatus: 'SENT' }
      });

      const failedSent = await prisma.assessmentSmsAudit.count({
        where: { smsStatus: 'FAILED' }
      });

      // Calculate success rate
      const successRate = totalSent > 0 ? Math.round((successfulSent / totalSent) * 100) : 0;

      res.json({
        success: true,
        data: {
          logs: logs.map(log => ({
            ...log,
            phoneNumber: log.parentPhone,
            status: log.smsStatus,
            // Mock sentBy for now as relation is missing in schema
            sentBy: { firstName: 'System', lastName: '' }
          })),
          total,
          summary: {
            totalSent,
            successRate,
            failed: failedSent,
            estimatedCost: 0 // TODO: Calculate based on message parts if needed
          }
        }
      });
    } catch (error: any) {
      console.error('[NotificationController] getAuditLogs error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
