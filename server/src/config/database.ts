import { PrismaClient } from '@prisma/client';
import { applyNameFormatterMiddleware } from '../middleware/prisma-name-formatter.middleware';

const prisma = new PrismaClient({
  log: ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Apply automatic uppercase formatting for names
applyNameFormatterMiddleware(prisma);

export default prisma;
