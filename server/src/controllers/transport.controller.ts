import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/database';
import { ApiError } from '../utils/error.util';

export class TransportController {
    
    // ============================================
    // VEHICLES
    // ============================================

    async getVehicles(req: AuthRequest, res: Response) {
        try {
            const vehicles = await prisma.transportVehicle.findMany({
                where: { archived: false },
                include: { _count: { select: { routes: true } } }
            });
            res.json({ success: true, data: vehicles });
        } catch (error: any) {
            console.error('[TransportController] getVehicles:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async createVehicle(req: AuthRequest, res: Response) {
        try {
            const { registrationNumber, capacity, driverName, driverPhone } = req.body;
            
            const existing = await prisma.transportVehicle.findUnique({
                where: { registrationNumber }
            });
            
            if (existing) throw new ApiError(400, 'Registration number already exists');

            const vehicle = await prisma.transportVehicle.create({
                data: {
                    registrationNumber,
                    capacity: parseInt(capacity) || 0,
                    driverName,
                    driverPhone,
                }
            });

            res.status(201).json({ success: true, data: vehicle });
        } catch (error: any) {
            console.error('[TransportController] createVehicle:', error);
            res.status(error.statusCode || 500).json({ success: false, message: error.message });
        }
    }

    async deleteVehicle(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            await prisma.transportVehicle.update({
                where: { id },
                data: { archived: true }
            });
            res.json({ success: true, message: 'Vehicle archived' });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // ============================================
    // ROUTES
    // ============================================

    async getRoutes(req: AuthRequest, res: Response) {
        try {
            const routes = await prisma.transportRoute.findMany({
                where: { archived: false },
                include: { 
                    vehicle: true,
                    _count: { select: { assignments: true } }
                }
            });
            res.json({ success: true, data: routes });
        } catch (error: any) {
            console.error('[TransportController] getRoutes:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async createRoute(req: AuthRequest, res: Response) {
        try {
            const { name, description, amount, vehicleId } = req.body;
            
            const route = await prisma.transportRoute.create({
                data: {
                    name,
                    description,
                    amount: amount,
                    vehicleId: vehicleId || null
                },
                include: { vehicle: true }
            });

            res.status(201).json({ success: true, data: route });
        } catch (error: any) {
            console.error('[TransportController] createRoute:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    
    async deleteRoute(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            await prisma.transportRoute.update({
                where: { id },
                data: { archived: true }
            });
            res.json({ success: true, message: 'Route archived' });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // ============================================
    // ASSIGNMENTS & PASSENGERS
    // ============================================

    async getAssignments(req: AuthRequest, res: Response) {
        try {
            const { routeId } = req.params;
            const assignments = await prisma.transportAssignment.findMany({
                where: { routeId, archived: false },
                include: { 
                    route: true
                }
            });

            // Manually fetch and join learner data if passengerType is LEARNER
            // This avoids complex polymorphic relations in Prisma if not fully mapped
            const learnerIds = assignments
                .filter(a => a.passengerType === 'LEARNER')
                .map(a => a.passengerId);

            const learners = await prisma.learner.findMany({
                where: { id: { in: learnerIds } },
                select: { id: true, firstName: true, lastName: true, admissionNumber: true, grade: true, stream: true }
            });

            const data = assignments.map(a => ({
                ...a,
                passenger: learners.find(l => l.id === a.passengerId) || null
            }));

            res.json({ success: true, data });
        } catch (error: any) {
            console.error('[TransportController] getAssignments:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async createAssignment(req: AuthRequest, res: Response) {
        try {
            const { routeId, passengerId, passengerType = 'LEARNER', pickupPoint, dropoffPoint } = req.body;

            // 1. Check if assignment already exists
            const existing = await prisma.transportAssignment.findFirst({
                where: { routeId, passengerId, archived: false }
            });
            if (existing) throw new ApiError(400, 'Student is already assigned to this route');

            // 2. Create Assignment & Update Learner Sync
            const result = await prisma.$transaction(async (tx) => {
                const assignment = await tx.transportAssignment.create({
                    data: {
                        routeId,
                        passengerId,
                        passengerType,
                        pickupPoint,
                        dropoffPoint
                    }
                });

                // Automark Learner as Transport Student
                if (passengerType === 'LEARNER') {
                    await tx.learner.update({
                        where: { id: passengerId },
                        data: { isTransportStudent: true }
                    });
                }

                return assignment;
            });

            res.status(201).json({ success: true, data: result });
        } catch (error: any) {
            console.error('[TransportController] createAssignment:', error);
            res.status(error.statusCode || 500).json({ success: false, message: error.message });
        }
    }

    async deleteAssignment(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;

            const assignment = await prisma.transportAssignment.findUnique({
               where: { id }
            });
            if (!assignment) throw new ApiError(404, 'Assignment not found');

            const { passengerId, passengerType } = assignment;

            await prisma.$transaction(async (tx) => {
                // Hard delete or archive? We'll archive for safety
                await tx.transportAssignment.update({
                    where: { id },
                    data: { archived: true, status: 'INACTIVE' }
                });

                // Automarking Logic: Check if student has ANY other active assignments
                if (passengerType === 'LEARNER') {
                    const otherAssignmentsCount = await tx.transportAssignment.count({
                        where: { passengerId, passengerType: 'LEARNER', archived: false }
                    });

                    if (otherAssignmentsCount === 0) {
                        await tx.learner.update({
                            where: { id: passengerId },
                            data: { isTransportStudent: false }
                        });
                    }
                }
            });

            res.json({ success: true, message: 'Assignment removed' });
        } catch (error: any) {
            console.error('[TransportController] deleteAssignment:', error);
            res.status(error.statusCode || 500).json({ success: false, message: error.message });
        }
    }
}

export const transportController = new TransportController();
