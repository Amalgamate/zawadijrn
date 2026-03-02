import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;

if (!ENCRYPTION_KEY) {
    console.error("CRITICAL ERROR: ENCRYPTION_KEY is not defined in environment variables.");
}

/**
 * Encrypts a text string.
 * @param text - The text to encrypt
 * @returns The encrypted string in format: iv:authTag:encryptedContent
 */
export const encrypt = (text: string): string => {
    if (!text) return text;
    if (!ENCRYPTION_KEY) throw new Error("Encryption key not configured");

    // Create a random initialization vector
    const iv = crypto.randomBytes(IV_LENGTH);

    // Create cipher
    // We use the hex key directly as a buffer if it's 64 chars (32 bytes) hex string
    // Or scrypt/pbkdf2 if it's a password. 
    // The guide generated a 32-byte hex string (64 chars). We should use it as the key directly.
    const key = Buffer.from(ENCRYPTION_KEY, 'hex');

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
};

/**
 * Decrypts an encrypted string.
 * @param text - The encrypted string in format: iv:authTag:encryptedContent
 * @returns The decrypted text
 */
export const decrypt = (text: string): string => {
    if (!text) return text;
    if (!ENCRYPTION_KEY) throw new Error("Encryption key not configured");

    const parts = text.split(':');
    if (parts.length !== 3) {
        // If it's not in our format, return as is (might not be encrypted yet)
        // Or throw error. For now, let's assume if it doesn't match, it might be plain text (legacy)
        // But for security, better to return empty or throw.
        // However, during migration handling legacy plain text might be useful?
        // Let's assume strict format.
        throw new Error("Invalid encrypted text format");
    }

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encryptedText = parts[2];

    const key = Buffer.from(ENCRYPTION_KEY, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
};
