import { PrismaClient } from '@prisma/client';

/**
 * Name Formatter Middleware
 * Automatically formats designated name fields to UPPERCASE across the system
 * on any create or update operation.
 */

const NAME_FIELDS = [
    'firstName',
    'lastName',
    'middleName',
    'guardianName',
    'fatherName',
    'motherName',
    'primaryContactName',
    'principalName'
];

export function applyNameFormatterMiddleware(prisma: PrismaClient): void {
    prisma.$use(async (params, next) => {
        // Only intercept data mutations
        if (['create', 'update', 'createMany', 'updateMany'].includes(params.action)) {
            if (params.args && params.args.data) {
                formatDataToUppercase(params.args.data);
            }
        }
        return next(params);
    });
    console.log('✅ Name Formatter middleware enabled (System-wide uppercase names)');
}

function formatDataToUppercase(data: any): void {
    if (!data) return;

    if (Array.isArray(data)) {
        data.forEach(item => formatDataToUppercase(item));
    } else if (typeof data === 'object') {
        for (const key of Object.keys(data)) {
            if (NAME_FIELDS.includes(key) && typeof data[key] === 'string') {
                data[key] = data[key].trim().toUpperCase();
            } else if (typeof data[key] === 'object' && data[key] !== null) {
                // Recursively handle nested creates/updates (e.g. relation mutations)
                formatDataToUppercase(data[key]);
            }
        }
    }
}
