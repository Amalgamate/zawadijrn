export interface PasswordPolicy {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
}

export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
};

export const PARENT_PASSWORD_POLICY: PasswordPolicy = {
    minLength: 6,
    requireUppercase: false,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
};

export interface ValidationResult {
    valid: boolean;
    errors: string[];
}

// List of XSS patterns to block
const XSS_PATTERNS = [
    /<script[^>]*>/gi,
    /<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // Event handlers like onclick=
    /<iframe[^>]*>/gi,
    /<embed[^>]*>/gi,
    /<object[^>]*>/gi,
];

/**
 * Check if password contains XSS attempt patterns
 */
const containsXSSAttempt = (password: string): boolean => {
    return XSS_PATTERNS.some(pattern => pattern.test(password));
};

export const validatePassword = (password: string, policy: PasswordPolicy): ValidationResult => {
    const errors: string[] = [];

    // Check for XSS attempts first
    if (containsXSSAttempt(password)) {
        errors.push('Password contains invalid characters or patterns');
        return { valid: false, errors };
    }

    if (password.length < policy.minLength) {
        errors.push(`Password must be at least ${policy.minLength} characters long`);
    }

    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }

    if (policy.requireLowercase && !/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }

    if (policy.requireNumbers && !/\d/.test(password)) {
        errors.push('Password must contain at least one number');
    }

    if (policy.requireSpecialChars && !/[^A-Za-z0-9]/.test(password)) {
        errors.push('Password must contain at least one special character');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
};

export const passwordsMatch = (password: string, passwordConfirm: string): boolean => {
    return password === passwordConfirm;
};
