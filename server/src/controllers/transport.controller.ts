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
}

export const transportController = new TransportController();
