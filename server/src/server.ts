import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'express-async-errors';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { sanitizeResponse, hideSensitiveHeaders, securityHeaders } from './middleware/response-sanitization.middleware';
import { ipRateLimit } from './middleware/enhanced-rateLimit.middleware';

const app: Application = express();

console.log('[ROUTES_DEBUG] Routes module loaded:', !!routes);

// Trust proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS — allow any origin in single-tenant/desktop mode
// Clients connect from Electron (file://), localhost, or any configured server URL
app.use(cors({
  origin: true, // Reflect request origin — safe for single-tenant
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400,
}));

// Global IP-based rate limiting  
app.use(ipRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5000, // Increased to 5000 for better dev/multi-tab experience
  message: 'Too many requests from this IP. Please try again later.'
}));

// Response sanitization
app.use(sanitizeResponse);

// Body parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

console.log('[ROUTES_DEBUG] About to mount API routes...');
// API Routes
app.use('/api', routes);
console.log('[ROUTES_DEBUG] API routes mounted successfully');

// DEBUG: Simple endpoint that bypasses all other middleware for diagnostics
app.get('/status', (_req, res) => {
  res.send('OK');
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
