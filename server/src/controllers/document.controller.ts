/**
 * Document Controller - Handles document management endpoints
 * @module controllers/document.controller
 */

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { documentService } from '../services/document.service';
import { default as prisma } from '../config/database'; // Fixed import
import { ApiError } from '../utils/error.util'; // Fixed import

export class DocumentController {
    /**
     * Upload a document
     */
    async uploadDocument(req: AuthRequest, res: Response) {
        try {
            const { category, name } = req.body;
            const schoolId = (req as any).tenant?.schoolId;
            const userId = req.user?.userId; // Fixed property name

            if (!schoolId) {
                throw new ApiError(403, 'School context required');
            }

            if (!req.file) {
                throw new ApiError(400, 'No file uploaded');
            }

            // Determine folder based on category
            const folder = `schools/${schoolId}/${category || 'general'}`;

            // Upload to Cloudinary
            const uploadResult = await documentService.uploadFile(req.file, {
                folder,
                resourceType: 'auto',
                maxSize: 10 * 1024 * 1024 // 10MB max
            });

            // Save document metadata to database
            const document = await prisma.document.create({
                data: {
                    name: name || req.file.originalname,
                    url: uploadResult.url,
                    key: uploadResult.publicId,
                    type: uploadResult.format,
                    size: uploadResult.size,
                    category: category || 'general',
                    schoolId,
                    uploadedById: userId
                }
            });

            res.status(201).json({
                success: true,
                message: 'Document uploaded successfully',
                data: document
            });
        } catch (error: any) {
            console.error('[Document Controller] Upload error:', error);
            if (error instanceof ApiError) {
                res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Failed to upload document'
                });
            }
        }
    }

    /**
     * Upload multiple documents
     */
    async uploadMultipleDocuments(req: AuthRequest, res: Response) {
        try {
            const { category } = req.body;
            const schoolId = (req as any).tenant?.schoolId;
            const userId = req.user?.userId;

            if (!schoolId) {
                throw new ApiError(403, 'School context required');
            }

            if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
                throw new ApiError(400, 'No files uploaded');
            }

            const folder = `schools/${schoolId}/${category || 'general'}`;

            // Upload all files to Cloudinary
            const uploadResults = await documentService.uploadMultipleFiles(req.files, {
                folder,
                resourceType: 'auto',
                maxSize: 10 * 1024 * 1024
            });

            // Save all documents to database
            const documents = await Promise.all(
                uploadResults.map((result, index) =>
                    prisma.document.create({
                        data: {
                            name: req.files![index].originalname,
                            url: result.url,
                            key: result.publicId,
                            type: result.format,
                            size: result.size,
                            category: category || 'general',
                            schoolId,
                            uploadedById: userId
                        }
                    })
                )
            );

            res.status(201).json({
                success: true,
                message: `${documents.length} documents uploaded successfully`,
                data: documents
            });
        } catch (error: any) {
            console.error('[Document Controller] Bulk upload error:', error);
            if (error instanceof ApiError) {
                res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Failed to upload documents'
                });
            }
        }
    }

    /**
     * Get all documents for a school
     */
    async getDocuments(req: AuthRequest, res: Response) {
        try {
            const schoolId = (req as any).tenant?.schoolId;
            const { category, search, page = 1, limit = 20 } = req.query;

            if (!schoolId) {
                throw new ApiError(403, 'School context required');
            }

            const skip = (Number(page) - 1) * Number(limit);

            const where: any = { schoolId };

            if (category) {
                where.category = category;
            }

            if (search) {
                where.name = {
                    contains: search as string,
                    mode: 'insensitive'
                };
            }

            const [documents, total] = await Promise.all([
                prisma.document.findMany({
                    where,
                    include: {
                        uploadedBy: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: Number(limit)
                }),
                prisma.document.count({ where })
            ]);

            res.json({
                success: true,
                data: documents,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    pages: Math.ceil(total / Number(limit))
                }
            });
        } catch (error: any) {
            console.error('[Document Controller] Get documents error:', error);
            if (error instanceof ApiError) {
                res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Failed to fetch documents'
                });
            }
        }
    }

    /**
     * Get a single document
     */
    async getDocument(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const schoolId = (req as any).tenant?.schoolId;

            if (!schoolId) {
                throw new ApiError(403, 'School context required');
            }

            const document = await prisma.document.findFirst({
                where: {
                    id,
                    schoolId
                },
                include: {
                    uploadedBy: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    }
                }
            });

            if (!document) {
                throw new ApiError(404, 'Document not found');
            }

            res.json({
                success: true,
                data: document
            });
        } catch (error: any) {
            console.error('[Document Controller] Get document error:', error);
            if (error instanceof ApiError) {
                res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Failed to fetch document'
                });
            }
        }
    }

    /**
     * Delete a document
     */
    async deleteDocument(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const schoolId = (req as any).tenant?.schoolId;

            if (!schoolId) {
                throw new ApiError(403, 'School context required');
            }

            const document = await prisma.document.findFirst({
                where: {
                    id,
                    schoolId
                }
            });

            if (!document) {
                throw new ApiError(404, 'Document not found');
            }

            // Delete from Cloudinary
            if (document.key) {
                await documentService.deleteFile(document.key, 'raw');
            }

            // Delete from database
            await prisma.document.delete({
                where: { id }
            });

            res.json({
                success: true,
                message: 'Document deleted successfully'
            });
        } catch (error: any) {
            console.error('[Document Controller] Delete document error:', error);
            if (error instanceof ApiError) {
                res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Failed to delete document'
                });
            }
        }
    }

    /**
     * Update document metadata
     */
    async updateDocument(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const { name, category } = req.body;
            const schoolId = (req as any).tenant?.schoolId;

            if (!schoolId) {
                throw new ApiError(403, 'School context required');
            }

            const document = await prisma.document.findFirst({
                where: {
                    id,
                    schoolId
                }
            });

            if (!document) {
                throw new ApiError(404, 'Document not found');
            }

            const updatedDocument = await prisma.document.update({
                where: { id },
                data: {
                    ...(name && { name }),
                    ...(category && { category })
                }
            });

            res.json({
                success: true,
                message: 'Document updated successfully',
                data: updatedDocument
            });
        } catch (error: any) {
            console.error('[Document Controller] Update document error:', error);
            if (error instanceof ApiError) {
                res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Failed to update document'
                });
            }
        }
    }

    /**
     * Get document categories
     */
    async getCategories(req: AuthRequest, res: Response) {
        try {
            const schoolId = (req as any).tenant?.schoolId;

            if (!schoolId) {
                throw new ApiError(403, 'School context required');
            }

            const categories = await prisma.document.findMany({
                where: { schoolId },
                select: { category: true },
                distinct: ['category']
            });

            res.json({
                success: true,
                data: categories.map((c: { category: string }) => c.category)
            });
        } catch (error: any) {
            console.error('[Document Controller] Get categories error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch categories'
            });
        }
    }
}

export const documentController = new DocumentController();
