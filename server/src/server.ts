import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'express-async-errors';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { sanitizeResponse } from './middleware/response-sanitization.middleware';
import { ipRateLimit } from './middleware/enhanced-rateLimit.middleware';

const app: Application = express();

// Trust proxy (required when behind Render / Cloud Run / Vercel reverse proxies)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// ── CORS ─────────────────────────────────────────────────────────────────────
// Single-tenant system: only the configured frontend origin is permitted.
// FRONTEND_URL is a required env var, validated at startup by env-validator.ts.
// In development we additionally allow localhost variants for DX.
const buildAllowedOrigins = (): string[] => {
  const origins: string[] = [];

  // Always include the configured frontend URL (required in all environments)
  const frontendUrl = process.env.FRONTEND_URL;
  if (frontendUrl) {
    origins.push(frontendUrl.replace(/\/$/, '')); // strip trailing slash
  }

  // In development, also allow localhost variants used by Vite dev server
  if (process.env.NODE_ENV !== 'production') {
    origins.push('http://localhost:3000');
    origins.push('http://localhost:5000');
    origins.push('http://127.0.0.1:3000');
  }

  return origins;
};

const allowedOrigins = buildAllowedOrigins();

console.log(`🌐 CORS allowed origins: ${allowedOrigins.join(', ')}`);

app.use(cors({
  origin: (requestOrigin, callback) => {
    // Allow requests with no origin (e.g. curl, Postman, server-to-server)
    if (!requestOrigin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(requestOrigin)) {
      return callback(null, true);
    }

    // Log and reject unknown origins — visible in server logs for debugging
    console.warn(`⚠️  CORS blocked request from origin: ${requestOrigin}`);
    return callback(new Error(`CORS: Origin '${requestOrigin}' is not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400,
}));
// ─────────────────────────────────────────────────────────────────────────────

// Global IP-based rate limiting
app.use(ipRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5000,
  message: 'Too many requests from this IP. Please try again later.'
}));

// Response sanitization
app.use(sanitizeResponse);

// Body parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API Routes
app.use('/api', routes);

// Simple health probe — bypasses all route middleware
app.get('/status', (_req, res) => {
  res.send('OK');
});

// Error handling (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
