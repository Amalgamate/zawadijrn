import prisma from '../config/database';
import { BiometricLog, BiometricDevice, AttendanceStatus } from '@prisma/client';

export class BiometricService {
  /**
   * Register a new biometric device
   */
  async registerDevice(data: {
    deviceId: string;
    name: string;
    type?: string;
    location?: string;
    ipAddress?: string;
  }) {
    return await prisma.biometricDevice.upsert({
      where: { deviceId: data.deviceId },
      update: {
        name: data.name,
        type: data.type || 'TERMINAL',
        location: data.location,
        ipAddress: data.ipAddress,
        status: 'ONLINE',
        lastSeen: new Date(),
      },
      create: {
        ...data,
        status: 'ONLINE',
        lastSeen: new Date(),
      },
    });
  }

  /**
   * Enroll a user's biometric credential
   */
  async enrollCredential(data: {
    userId?: string;
    learnerId?: string;
    type: string;
    template: string;
    fingerIndex?: number;
    quality?: number;
  }) {
    return await prisma.biometricCredential.create({
      data,
    });
  }

  /**
   * Process an incoming attendance log from a device
   */
  async processAttendanceLog(data: {
    deviceToken: string;
    deviceId: string;
    personId: string; // admissionNumber or staffId
    personType: 'LEARNER' | 'STAFF';
    timestamp: Date;
    direction: 'IN' | 'OUT';
  }) {
    // 1. Validate device
    const device = await prisma.biometricDevice.findFirst({
      where: {
        deviceId: data.deviceId,
        token: data.deviceToken,
      },
    });

    if (!device) {
      throw new Error('Invalid device or token');
    }

    // Update device status
    await prisma.biometricDevice.update({
      where: { id: device.id },
      data: { lastSeen: new Date(), status: 'ONLINE' },
    });

    // 2. Log the raw biometric hit
    const log = await prisma.biometricLog.create({
      data: {
        deviceId: device.id,
        personId: data.personId,
        personType: data.personType,
        timestamp: data.timestamp,
        direction: data.direction,
        status: 'PENDING',
      },
    });

    try {
      if (data.personType === 'LEARNER') {
        await this.handleLearnerAttendance(data);
      } else {
        await this.handleStaffAttendance(data);
      }

      // Mark log as processed
      await prisma.biometricLog.update({
        where: { id: log.id },
        data: { status: 'PROCESSED' },
      });
    } catch (error: any) {
      await prisma.biometricLog.update({
        where: { id: log.id },
        data: { status: 'FAILED', errorMessage: error.message },
      });
      throw error;
    }

    return log;
  }

  private async handleLearnerAttendance(data: any) {
    const learner = await prisma.learner.findFirst({
      where: { admissionNumber: data.personId },
    });

    if (!learner) {
      throw new Error(`Learner with admission number ${data.personId} not found`);
    }

    const today = new Date(data.timestamp);
    today.setHours(0, 0, 0, 0);

    // Check if attendance already exists for today
    const existing = await prisma.attendance.findFirst({
      where: {
        learnerId: learner.id,
        date: today,
      },
    });

    if (existing) {
      // If logging OUT, update existing record if needed
      // (Assuming Attendance model tracks simple status for now)
      return existing;
    }

    // Find an admin to be the 'markedBy' reference
    const admin = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' }
    });

    // Create new attendance record
    return await prisma.attendance.create({
      data: {
        learnerId: learner.id,
        date: today,
        status: AttendanceStatus.PRESENT,
        remarks: `Biometric ${data.direction} at ${data.timestamp.toLocaleTimeString()}`,
        markedBy: admin?.id || 'SYSTEM',
      },
    });
  }

  private async handleStaffAttendance(data: any) {
    const user = await prisma.user.findFirst({
      where: { staffId: data.personId },
    });

    if (!user) {
      throw new Error(`Staff with ID ${data.personId} not found`);
    }

    const today = new Date(data.timestamp);
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.staffAttendanceLog.findUnique({
      where: {
        userId_date: {
          userId: user.id,
          date: today,
        },
      },
    });

    if (data.direction === 'IN') {
      if (!existing) {
        return await prisma.staffAttendanceLog.create({
          data: {
            userId: user.id,
            date: today,
            clockInAt: data.timestamp,
            source: 'BIOMETRIC',
            metadata: { deviceId: data.deviceId },
          },
        });
      }
    } else if (data.direction === 'OUT') {
      if (existing && !existing.clockOutAt) {
        return await prisma.staffAttendanceLog.update({
          where: { id: existing.id },
          data: {
            clockOutAt: data.timestamp,
          },
        });
      }
    }
  }

  async getDevices() {
    return await prisma.biometricDevice.findMany({
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getLogs(params: {
    startDate?: Date;
    endDate?: Date;
    deviceId?: string;
    status?: string;
  }) {
    return await prisma.biometricLog.findMany({
      where: {
        deviceId: params.deviceId,
        status: params.status,
        timestamp: {
          gte: params.startDate,
          lte: params.endDate,
        },
      },
      include: {
        device: true,
      },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });
  }
}
