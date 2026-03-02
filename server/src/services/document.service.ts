/**
 * Document Service - Handles cloud storage operations via Cloudinary
 * @module services/document.service
 */

import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// Configure Cloudinary using environment variable
cloudinary.config({
    cloudinary_url: process.env.CLOUDINARY_URL
});

export interface UploadResult {
    url: string;
    publicId: string;
    format: string;
    size: number;
    resourceType: string;
}

export interface UploadOptions {
    folder?: string;
    resourceType?: 'image' | 'video' | 'raw' | 'auto';
    allowedFormats?: string[];
    maxSize?: number; // in bytes
}

class DocumentService {
    /**
     * Upload a file to Cloudinary
     */
    async uploadFile(
        file: Express.Multer.File,
        options: UploadOptions = {}
    ): Promise<UploadResult> {
        const {
            folder = 'documents',
            resourceType = 'auto',
            allowedFormats,
            maxSize
        } = options;

        // Validate file size
        if (maxSize && file.size > maxSize) {
            throw new Error(`File size exceeds maximum allowed size of ${maxSize} bytes`);
        }

        // Validate file format
        if (allowedFormats && allowedFormats.length > 0) {
            const fileExt = file.originalname.split('.').pop()?.toLowerCase();
            if (!fileExt || !allowedFormats.includes(fileExt)) {
                throw new Error(`File format not allowed. Allowed formats: ${allowedFormats.join(', ')}`);
            }
        }

        try {
            // Upload to Cloudinary
            const result = await new Promise<any>((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder,
                        resource_type: resourceType,
                        use_filename: true,
                        unique_filename: true
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );

                // Convert buffer to stream and pipe to Cloudinary
                const bufferStream = new Readable();
                bufferStream.push(file.buffer);
                bufferStream.push(null);
                bufferStream.pipe(uploadStream);
            });

            return {
                url: result.secure_url,
                publicId: result.public_id,
                format: result.format,
                size: result.bytes,
                resourceType: result.resource_type
            };
        } catch (error: any) {
            console.error('[Document Service] Upload error:', error);
            throw new Error(`Failed to upload file: ${error.message}`);
        }
    }

    /**
     * Upload multiple files
     */
    async uploadMultipleFiles(
        files: Express.Multer.File[],
        options: UploadOptions = {}
    ): Promise<UploadResult[]> {
        const uploadPromises = files.map(file => this.uploadFile(file, options));
        return Promise.all(uploadPromises);
    }

    /**
     * Delete a file from Cloudinary
     */
    async deleteFile(publicId: string, resourceType: string = 'image'): Promise<void> {
        try {
            await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
        } catch (error: any) {
            console.error('[Document Service] Delete error:', error);
            throw new Error(`Failed to delete file: ${error.message}`);
        }
    }

    /**
     * Delete multiple files
     */
    async deleteMultipleFiles(publicIds: string[], resourceType: string = 'image'): Promise<void> {
        try {
            await cloudinary.api.delete_resources(publicIds, { resource_type: resourceType });
        } catch (error: any) {
            console.error('[Document Service] Bulk delete error:', error);
            throw new Error(`Failed to delete files: ${error.message}`);
        }
    }

    /**
     * Get file details from Cloudinary
     */
    async getFileDetails(publicId: string, resourceType: string = 'image'): Promise<any> {
        try {
            return await cloudinary.api.resource(publicId, { resource_type: resourceType });
        } catch (error: any) {
            console.error('[Document Service] Get details error:', error);
            throw new Error(`Failed to get file details: ${error.message}`);
        }
    }

    /**
     * Generate a signed URL for temporary access
     */
    generateSignedUrl(publicId: string, expiresIn: number = 3600): string {
        const timestamp = Math.floor(Date.now() / 1000) + expiresIn;
        return cloudinary.url(publicId, {
            sign_url: true,
            type: 'authenticated',
            expires_at: timestamp
        });
    }
}

export const documentService = new DocumentService();
