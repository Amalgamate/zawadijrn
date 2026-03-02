/**
 * Input Sanitization Utility
 * Prevents XSS, SQL injection, and other common attacks
 */

/**
 * Escape HTML special characters
 */
export const escapeHtml = (str: string | null | undefined): string => {
  if (!str) return '';

  const htmlMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;'
  };

  return String(str).replace(/[&<>"'\/]/g, (char) => htmlMap[char]);
};

/**
 * Remove potentially dangerous characters and trim whitespace
 */
export const sanitizeString = (str: string | null | undefined): string => {
  if (!str) return '';

  return String(str)
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .slice(0, 10000); // Limit length to prevent memory issues
};

/**
 * Sanitize email address
 */
export const sanitizeEmail = (email: string | null | undefined): string => {
  if (!email) return '';

  return String(email)
    .trim()
    .toLowerCase()
    .slice(0, 254);
};

/**
 * Sanitize phone number (keep only digits and + sign)
 */
export const sanitizePhone = (phone: string | null | undefined): string => {
  if (!phone) return '';

  return String(phone).replace(/[^\d+\-\s()]/g, '').slice(0, 20);
};

/**
 * Sanitize numeric input
 */
export const sanitizeNumber = (value: any): number | null => {
  const num = Number(value);
  return isNaN(num) ? null : num;
};

/**
 * Sanitize object by escaping all string values
 */
export const sanitizeObject = (obj: Record<string, any>): Record<string, any> => {
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === 'string' ? sanitizeString(item) : item
      );
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

/**
 * Sanitize URL path to prevent directory traversal
 */
export const sanitizePath = (path: string): string => {
  return path
    .replace(/\.\.\//g, '') // Remove ../
    .replace(/\.\.\\/g, '') // Remove ..\
    .replace(/[<>:"|?*\x00-\x1F]/g, '') // Remove invalid characters
    .slice(0, 1024);
};

/**
 * Check if string contains suspicious patterns
 */
export const containsSuspiciousPatterns = (str: string): boolean => {
  const suspiciousPatterns = [
    /<script[^>]*>.*?<\/script>/gi, // Script tags
    /javascript:/gi, // JavaScript protocol
    /on\w+\s*=/gi, // Event handlers (onclick, etc.)
    /union\s+select/gi, // SQL injection
    /drop\s+table/gi, // SQL injection
    /delete\s+from/gi, // SQL injection
    /insert\s+into/gi, // SQL injection
    /update\s+\w+\s+set/gi // SQL injection
  ];

  return suspiciousPatterns.some((pattern) => pattern.test(str));
};

/**
 * Validate and sanitize JSON payload
 */
export const sanitizeJson = <T>(data: any): T | null => {
  try {
    if (typeof data === 'string') {
      data = JSON.parse(data);
    }

    // Check for deeply nested objects (potential DoS)
    const depth = getObjectDepth(data);
    if (depth > 50) {
      console.warn('JSON depth exceeds safe limit');
      return null;
    }

    return sanitizeObject(data) as T;
  } catch (error) {
    console.error('Failed to sanitize JSON:', error);
    return null;
  }
};

/**
 * Get maximum nesting depth of an object
 */
function getObjectDepth(obj: any, currentDepth = 0): number {
  if (currentDepth > 100) return 100; // Safety limit

  if (typeof obj !== 'object' || obj === null) {
    return currentDepth;
  }

  const values = Array.isArray(obj) ? obj : Object.values(obj);
  if (values.length === 0) {
    return currentDepth;
  }

  return Math.max(...values.map((val) => getObjectDepth(val, currentDepth + 1)));
}

/**
 * Sanitize file name to prevent directory traversal
 */
export const sanitizeFileName = (fileName: string): string => {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace special characters
    .replace(/\.\.+/g, '.') // Remove multiple dots
    .replace(/^\.+/, '') // Remove leading dots
    .slice(0, 255);
};
