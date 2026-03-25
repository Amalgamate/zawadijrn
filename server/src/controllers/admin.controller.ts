import { Request, Response } from 'express';
import prisma from '../config/database';
import { encrypt } from '../utils/encryption.util';
import { ApiError } from '../utils/error.util';

export class AdminController {
  /**
   * Get available system modules
   * GET /api/admin/modules
   */
  async getSchoolModules(_req: Request, res: Response) {
    const modules = {
      ASSESSMENT: true,
      LEARNERS: true,
      TUTORS: true,
      PARENTS: true,
      ATTENDANCE: true,
      FEES: true,
      REPORTS: true,
      SETTINGS: true,
    };
    res.json({ success: true, data: modules });
  }

  /**
   * Get communication configuration
   * GET /api/admin/communication
   */
  async getSchoolCommunication(_req: Request, res: Response) {
    const config = await prisma.communicationConfig.findFirst();

    if (!config) {
      return res.json({
        success: true,
        data: {
          smsEnabled: true,
          smsProvider: 'mobilesasa',
          emailProvider: 'resend',
          mpesaProvider: 'intasend',
        },
      });
    }

    res.json({ success: true, data: config });
  }

  /**
   * Update communication configuration
   * PUT /api/admin/communication
   */
  async updateSchoolCommunication(req: Request, res: Response) {
    const updateData = { ...req.body };

    // Encrypt sensitive keys before storing
    if (updateData.smsApiKey)       updateData.smsApiKey       = encrypt(updateData.smsApiKey);
    if (updateData.emailApiKey)     updateData.emailApiKey     = encrypt(updateData.emailApiKey);
    if (updateData.mpesaSecretKey)  updateData.mpesaSecretKey  = encrypt(updateData.mpesaSecretKey);
    if (updateData.mpesaPublicKey)  updateData.mpesaPublicKey  = encrypt(updateData.mpesaPublicKey);
    if (updateData.smsCustomToken)  updateData.smsCustomToken  = encrypt(updateData.smsCustomToken);

    const existing = await prisma.communicationConfig.findFirst();

    const config = existing
      ? await prisma.communicationConfig.update({ where: { id: existing.id }, data: updateData })
      : await prisma.communicationConfig.create({ data: updateData });

    res.json({ success: true, data: config });
  }
}
