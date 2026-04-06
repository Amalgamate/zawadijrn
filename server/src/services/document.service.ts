/**
 * Document Service - Handles file storage via Supabase Storage
 * @module services/document.service
 */

import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!
);

const BUCKET = 'documents';

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
     * Upload a file to Supabase Storage
     */
    async uploadFile(
        file: Express.Multer.File,
        options: UploadOptions = {}
    ): Promise<UploadResult> {
        const { folder = 'general', maxSize, allowedFormats } = options;

        if (maxSize && file.size > maxSize) {
            throw new Error(`File size exceeds maximum allowed size of ${maxSize} bytes`);
        }

        if (allowedFormats && allowedFormats.length > 0) {
            const fileExt = file.originalname.split('.').pop()?.toLowerCase();
            if (!fileExt || !allowedFormats.includes(fileExt)) {
                throw new Error(`File format not allowed. Allowed: ${allowedFormats.join(', ')}`);
            }
        }

        const ext = path.extname(file.originalname);
        const uniqueName = `${uuidv4()}${ext}`;
        const storagePath = `${folder}/${uniqueName}`;

        const { error } = await supabase.storage
            .from(BUCKET)
            .upload(storagePath, file.buffer, {
                contentType: file.mimetype,
                upsert: false
            });

        if (error) {
            console.error('[Document Service] Supabase upload error:', error);
            throw new Error(`Failed to upload file: ${error.message}`);
        }

        const { data: urlData } = supabase.storage
            .from(BUCKET)
            .getPublicUrl(storagePath);

        return {
            url: urlData.publicUrl,
            publicId: storagePath,
            format: ext.replace('.', ''),
            size: file.size,
            resourceType: file.mimetype.startsWith('image/') ? 'image' : 'raw'
        };
    }

    /**
     * Upload multiple files
     */
    async uploadMultipleFiles(
        files: Express.Multer.File[],
        options: UploadOptions = {}
    ): Promise<UploadResult[]> {
        return Promise.all(files.map(file => this.uploadFile(file, options)));
    }

    /**
     * Delete a file from Supabase Storage
     */
    async deleteFile(publicId: string, _resourceType: string = 'image'): Promise<void> {
        const { error } = await supabase.storage.from(BUCKET).remove([publicId]);
        if (error) {
            console.error('[Document Service] Delete error:', error);
            throw new Error(`Failed to delete file: ${error.message}`);
        }
    }

    /**
     * Delete multiple files
     */
    async deleteMultipleFiles(publicIds: string[], _resourceType: string = 'image'): Promise<void> {
        const { error } = await supabase.storage.from(BUCKET).remove(publicIds);
        if (error) {
            console.error('[Document Service] Bulk delete error:', error);
            throw new Error(`Failed to delete files: ${error.message}`);
        }
    }

    /**
     * Get a signed URL for temporary private access
     */
    async generateSignedUrl(publicId: string, expiresIn: number = 3600): Promise<string> {
        const { data, error } = await supabase.storage
            .from(BUCKET)
            .createSignedUrl(publicId, expiresIn);

        if (error || !data) {
            throw new Error(`Failed to generate signed URL: ${error?.message}`);
        }
        return data.signedUrl;
    }
}

export const documentService = new DocumentService();
