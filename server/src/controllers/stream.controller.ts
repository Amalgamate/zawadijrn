/**
 * Stream Controller
 * Handles stream management (A, B, C, D) within facility management
 */

import { Response } from 'express';
import prisma from '../config/database';
import { ApiError } from '../utils/error.util';
import { AuthRequest } from '../middleware/permissions.middleware';

export class StreamController {
  /**
   * GET /api/facility/streams
   * Get all streams
   */
  async getStreams(req: AuthRequest, res: Response) {
    try {
      const streams = await prisma.stream.findMany({
        where: {
          archived: false
        },
        orderBy: { name: 'asc' }
      });

      res.json({
        success: true,
        data: streams,
        count: streams.length
      });
    } catch (error: any) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, error.message || 'Failed to fetch streams');
    }
  }

  /**
   * GET /api/facility/streams/:streamId
   * Get single stream by ID
   */
  async getStream(req: AuthRequest, res: Response) {
    try {
      const { streamId } = req.params;

      const stream = await prisma.stream.findUnique({
        where: { id: streamId }
      });

      if (!stream) {
        throw new ApiError(404, 'Stream not found');
      }

      res.json({ success: true, data: stream });
    } catch (error: any) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, error.message || 'Failed to fetch stream');
    }
  }

  /**
   * POST /api/facility/streams
   * Create new stream
   */
  async createStream(req: AuthRequest, res: Response) {
    try {
      const { name } = req.body;

      // Validate required fields
      if (!name) {
        throw new ApiError(400, 'name is required');
      }

      // Check for duplicate stream name
      const existing = await prisma.stream.findFirst({
        where: {
          name,
          archived: false
        }
      });

      if (existing) {
        throw new ApiError(409, `Stream '${name}' already exists`);
      }

      const stream = await prisma.stream.create({
        data: {
          name,
          active: true,
          archived: false
        }
      });

      res.status(201).json({
        success: true,
        message: 'Stream created successfully',
        data: stream
      });
    } catch (error: any) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, error.message || 'Failed to create stream');
    }
  }

  /**
   * PUT /api/facility/streams/:streamId
   * Update stream (name, active status)
   */
  async updateStream(req: AuthRequest, res: Response) {
    try {
      const { streamId } = req.params;
      const { name, active } = req.body;

      const stream = await prisma.stream.findUnique({
        where: { id: streamId }
      });

      if (!stream) {
        throw new ApiError(404, 'Stream not found');
      }

      // If name is changing, check for duplicates
      if (name && name !== stream.name) {
        const duplicate = await prisma.stream.findFirst({
          where: {
            name,
            archived: false,
            NOT: { id: streamId }
          }
        });

        if (duplicate) {
          throw new ApiError(409, `Stream '${name}' already exists`);
        }
      }

      const updated = await prisma.stream.update({
        where: { id: streamId },
        data: {
          ...(name && { name }),
          ...(active !== undefined && { active })
        }
      });

      res.json({
        success: true,
        message: 'Stream updated successfully',
        data: updated
      });
    } catch (error: any) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, error.message || 'Failed to update stream');
    }
  }

  /**
   * DELETE /api/facility/streams/:streamId
   * Archive stream (soft delete)
   */
  async deleteStream(req: AuthRequest, res: Response) {
    try {
      const { streamId } = req.params;

      const stream = await prisma.stream.findUnique({
        where: { id: streamId }
      });

      if (!stream) {
        throw new ApiError(404, 'Stream not found');
      }

      // Check if stream is being used by any active classes
      const classesUsingStream = await prisma.class.findMany({
        where: {
          stream: stream.name,
          archived: false
        }
      });

      if (classesUsingStream.length > 0) {
        throw new ApiError(
          409,
          `Cannot delete stream '${stream.name}'. It is currently assigned to ${classesUsingStream.length} class(es).`
        );
      }

      const updated = await prisma.stream.update({
        where: { id: streamId },
        data: {
          archived: true,
          archivedAt: new Date()
        }
      });

      res.json({
        success: true,
        message: 'Stream archived successfully',
        data: updated
      });
    } catch (error: any) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, error.message || 'Failed to delete stream');
    }
  }

  /**
   * GET /api/facility/streams/available-names
   * Get list of stream names available for creation (A, B, C, D, E, F, G, H)
   */
  async getAvailableStreamNames(req: AuthRequest, res: Response) {
    try {
      // Standard stream names
      const allStreamNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

      // Get existing streams
      const existingStreams = await prisma.stream.findMany({
        where: {
          archived: false
        },
        select: { name: true }
      });

      const usedNames = existingStreams.map(s => s.name);
      const available = allStreamNames.filter(name => !usedNames.includes(name));

      res.json({
        success: true,
        data: {
          available,
          used: usedNames,
          total: {
            available: available.length,
            used: usedNames.length
          }
        }
      });
    } catch (error: any) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, error.message || 'Failed to fetch available streams');
    }
  }
}

export const streamController = new StreamController();
