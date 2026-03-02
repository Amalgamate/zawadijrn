/**
 * Upload Middleware - Configures multer for file uploads
 * @module middleware/upload.middleware
 */

import multer from 'multer';
import { Request } from 'express';

// Configure multer to use memory storage (files stored in buffer)
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Allowed file types
    const allowedMimes = [
        // Documents
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'text/csv',
        // Images
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
        // Archives
        'application/zip',
        'application/x-rar-compressed',
        'application/x-7z-compressed'
    ];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`File type not allowed: ${file.mimetype}`));
    }
};

// Create multer instance
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB max file size
    }
});

export const uploadSingle = upload.single('file');
export const uploadMultiple = upload.array('files', 10); // Max 10 files at once
export const uploadFields = upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'files', maxCount: 10 }
]);

export default upload;
