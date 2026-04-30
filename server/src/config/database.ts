import { PrismaClient } from '@prisma/client';
import { applyNameFormatterMiddleware } from '../middleware/prisma-name-formatter.middleware';

// ─── Connection pool tuning ────────────────────────────────────────────────────
// Keep Prisma's own pool deliberately small so the API does not saturate
// the database during cold starts or burst traffic. Tune via env so staging
// and production can differ.
const CONNECTION_LIMIT = parseInt(process.env.DB_CONNECTION_LIMIT  || '5',  10);
const POOL_TIMEOUT     = parseInt(process.env.DB_POOL_TIMEOUT       || '10', 10); // seconds

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  datasources: {
    db: {
      // Append pool params to whatever URL is already configured.
      // If the URL already has a query string the params are appended;
      // if DATABASE_URL already contains connection_limit we honour the
      // existing value rather than overwriting it.
      url: (() => {
        const base = process.env.DATABASE_URL || '';
        if (base.includes('connection_limit')) return base; // already configured
        const sep = base.includes('?') ? '&' : '?';
        return `${base}${sep}connection_limit=${CONNECTION_LIMIT}&pool_timeout=${POOL_TIMEOUT}`;
      })(),
    },
  },
});

// Apply automatic uppercase formatting for names
applyNameFormatterMiddleware(prisma);

export default prisma;
