import { Response } from 'express';
import { AuthRequest } from '../middleware/permissions.middleware';
import prisma from '../config/database';
import { ApiError } from '../utils/error.util';
import { EventType } from '@prisma/client';

export class PlannerController {
    /**
     * Get all events for the school
     */
    async getEvents(req: AuthRequest, res: Response) {
        const schoolId = req.user!.schoolId;
        const { start, end, type } = req.query;

        if (!schoolId) {
            throw new ApiError(400, 'School ID is required');
        }

        const where: any = { schoolId };

        if (start && end) {
            where.startDate = {
                gte: new Date(start as string),
                lte: new Date(end as string),
            };
        }

        if (type) {
            where.type = type as EventType;
        }

        const events = await prisma.event.findMany({
            where,
            include: {
                creator: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
            orderBy: { startDate: 'asc' },
        });

        res.json({ success: true, data: events });
    }

    /**
     * Create a new event
     */
    async createEvent(req: AuthRequest, res: Response) {
        const schoolId = req.user!.schoolId;
        const userId = req.user!.userId;
        const { title, description, startDate, endDate, allDay, type, location, meetingLink } = req.body;

        if (!schoolId) throw new ApiError(400, 'School ID is required');
        if (!title) throw new ApiError(400, 'Title is required');
        if (!startDate || !endDate) throw new ApiError(400, 'Start and End dates are required');

        // Valid types validation
        const validTypes = Object.values(EventType);
        if (type && !validTypes.includes(type)) {
            throw new ApiError(400, `Invalid event type. Must be one of: ${validTypes.join(', ')}`);
        }

        const event = await prisma.event.create({
            data: {
                title,
                description,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                allDay: allDay || false,
                type: (type as EventType) || 'GENERAL',
                location,
                meetingLink,
                schoolId,
                creatorId: userId,
            },
        });

        res.status(201).json({ success: true, data: event });
    }

    /**
     * Update an event
     */
    async updateEvent(req: AuthRequest, res: Response) {
        const { id } = req.params;
        const schoolId = req.user!.schoolId;
        const { title, description, startDate, endDate, allDay, type, location, meetingLink } = req.body;

        const existingEvent = await prisma.event.findUnique({ where: { id } });

        if (!existingEvent) throw new ApiError(404, 'Event not found');
        if (existingEvent.schoolId !== schoolId) throw new ApiError(403, 'Unauthorized access to this event');

        const event = await prisma.event.update({
            where: { id },
            data: {
                title,
                description,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
                allDay,
                type: type as EventType,
                location,
                meetingLink,
            },
        });

        res.json({ success: true, data: event });
    }

    /**
     * Delete an event
     */
    async deleteEvent(req: AuthRequest, res: Response) {
        const { id } = req.params;
        const schoolId = req.user!.schoolId;

        const existingEvent = await prisma.event.findUnique({ where: { id } });

        if (!existingEvent) throw new ApiError(404, 'Event not found');
        if (existingEvent.schoolId !== schoolId) throw new ApiError(403, 'Unauthorized access to this event');

        await prisma.event.delete({ where: { id } });

        res.json({ success: true, message: 'Event deleted successfully' });
    }
}
