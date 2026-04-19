import { PrismaClient } from '@prisma/client';
import { applyNameFormatterMiddleware } from '../middleware/prisma-name-formatter.middleware';

// ─── Connection pool tuning ────────────────────────────────────────────────────
// Supabase PgBouncer (port 6543) gives ≈15 server-side connections.
// We keep Prisma's own pool deliberately small so we never saturate the
// PgBouncer limit when the Render dyno wakes up cold and all requests
// arrive simultaneously.  Tune via env so staging / prod can differ.
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
