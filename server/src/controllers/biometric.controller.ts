import { Request, Response } from 'express';
import { BiometricService } from '../services/biometric.service';
import { AuthRequest } from '../middleware/permissions.middleware';

const biometricService = new BiometricService();

export class BiometricController {
  /**
   * Device Management
   */
  async registerDevice(req: AuthRequest, res: Response) {
    try {
      const device = await biometricService.registerDevice(req.body);
      res.status(201).json({ 
        success: true, 
        message: 'Device registered successfully',
        data: device 
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getDevices(req: AuthRequest, res: Response) {
    try {
      const devices = await biometricService.getDevices();
      res.json({ success: true, data: devices });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Enrollment
   */
  async enrollCredential(req: AuthRequest, res: Response) {
    try {
      const credential = await biometricService.enrollCredential(req.body);
      res.status(201).json({ 
        success: true, 
        message: 'Biometric credential enrolled',
        data: credential 
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Attendance Logging (Webhook for Devices/Bridge)
   */
  async logAttendance(req: Request, res: Response) {
    try {
      const { deviceId, deviceToken, personId, personType, timestamp, direction } = req.body;
      
      if (!deviceId || !deviceToken || !personId || !personType || !timestamp) {
        return res.status(400).json({ 
          success: false, 
          message: 'Missing required fields: deviceId, deviceToken, personId, personType, timestamp' 
        });
      }

      const log = await biometricService.processAttendanceLog({
        deviceId,
        deviceToken,
        personId,
        personType: personType as 'LEARNER' | 'STAFF',
        timestamp: new Date(timestamp),
        direction: direction || 'IN',
      });

      res.status(200).json({ 
        success: true, 
        message: 'Attendance log processed',
        data: log 
      });
    } catch (error: any) {
      const status = error.message.includes('Invalid') ? 401 : 400;
      res.status(status).json({ success: false, message: error.message });
    }
  }

  /**
   * Logs Retrieval
   */
  async getLogs(req: AuthRequest, res: Response) {
    try {
      const { startDate, endDate, deviceId, status } = req.query;
      const logs = await biometricService.getLogs({
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        deviceId: deviceId as string,
        status: status as string,
      });
      res.json({ success: true, data: logs });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export const biometricController = new BiometricController();
