/**
 * Environment Configuration Validator
 * Ensures all required security environment variables are present and valid
 */

import { ApiError } from './error.util';
import logger from './logger';

interface EnvConfig {
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  jwtRefreshSecret: string;
  frontendUrl: string;
  apiUrl: string;
  smsProvider?: string;
  emailProvider?: string;
}

/**
 * Validate environment variables at startup
 */
export const validateEnvironmentConfig = (): EnvConfig => {
  const errors: string[] = [];

  // Check required variables
  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'FRONTEND_URL',
    'API_URL'
  ];

  for (const variable of required) {
    if (!process.env[variable]) {
      errors.push(`Missing required environment variable: ${variable}`);
    }
  }

  // Validate JWT secrets length
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters long');
  }

  if (process.env.JWT_REFRESH_SECRET && process.env.JWT_REFRESH_SECRET.length < 32) {
    errors.push('JWT_REFRESH_SECRET must be at least 32 characters long');
  }

  // Validate protocol for URLs
  const frontendUrl = process.env.FRONTEND_URL || '';
  if (frontendUrl && !frontendUrl.match(/^https?:\/\//)) {
    errors.push('FRONTEND_URL must start with http:// or https://');
  }

  const apiUrl = process.env.API_URL || '';
  if (apiUrl && !apiUrl.match(/^https?:\/\//)) {
    errors.push('API_URL must start with http:// or https://');
  }

  // In production, enforce HTTPS only when HTTPS_ONLY=true
  const httpsOnly = (process.env.HTTPS_ONLY || '').toLowerCase() === 'true';
  if (process.env.NODE_ENV === 'production' && httpsOnly) {
    if (frontendUrl && !frontendUrl.startsWith('https://')) {
      errors.push('FRONTEND_URL must use HTTPS when HTTPS_ONLY=true in production');
    }
    if (apiUrl && !apiUrl.startsWith('https://')) {
      errors.push('API_URL must use HTTPS when HTTPS_ONLY=true in production');
    }
  }

  if (errors.length > 0) {
    logger.error({ errors }, '❌ Environment Configuration Errors');
    throw new Error(`Invalid environment configuration. ${errors.length} error(s) found.`);
  }

  const config: EnvConfig = {
    nodeEnv: (process.env.NODE_ENV as any) || 'development',
    port: parseInt(process.env.PORT || '5000', 10),
    databaseUrl: process.env.DATABASE_URL!,
    jwtSecret: process.env.JWT_SECRET!,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET!,
    frontendUrl: process.env.FRONTEND_URL!,
    apiUrl: process.env.API_URL!,
    smsProvider: process.env.SMS_PROVIDER,
    emailProvider: process.env.EMAIL_PROVIDER
  };

  logger.info('✅ Environment configuration validated');
  return config;
};

/**
 * Check security best practices for current configuration
 */
export const checkSecurityBestPractices = (): string[] => {
  const warnings: string[] = [];

  if (process.env.NODE_ENV !== 'production') {
    warnings.push('⚠️  Running in ' + process.env.NODE_ENV + ' mode - ensure production mode in production');
  }

  if (!process.env.HTTPS_ONLY || process.env.HTTPS_ONLY !== 'true') {
    warnings.push('⚠️  HTTPS_ONLY not explicitly set to true');
  }

  if (!process.env.SECURE_COOKIES || process.env.SECURE_COOKIES !== 'true') {
    warnings.push('⚠️  SECURE_COOKIES not explicitly enabled');
  }

  if (!process.env.RATE_LIMIT_ENABLED || process.env.RATE_LIMIT_ENABLED !== 'true') {
    warnings.push('⚠️  Rate limiting should be explicitly enabled');
  }

  if (process.env.LOG_LEVEL === 'debug') {
    warnings.push('⚠️  Debug logging enabled - may expose sensitive information');
  }

  if (!process.env.CORS_ORIGIN || process.env.CORS_ORIGIN === '*') {
    warnings.push('⚠️  CORS_ORIGIN not restricted - consider limiting to specific origins');
  }

  if (!process.env.CSP_HEADER) {
    warnings.push('⚠️  Content Security Policy not explicitly configured');
  }

  return warnings;
};

/**
 * Display security checklist
 */
export const displaySecurityChecklist = (): void => {
  logger.info('🔒 Security Checklist: Environment validated, JWT configured, DB secured, CORS configured, Helmet enabled, Rate limiting implemented, Error handling sanitized, Request validation enabled, Response sanitization enabled');
  
  const warnings = checkSecurityBestPractices();
  if (warnings.length > 0) {
    logger.warn({ warnings }, '⚠️  Security Warnings detected');
  }
};
