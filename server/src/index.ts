import 'dotenv/config';
import { validateEnvironment } from './config/env-validator';

// Validate environment before anything else
validateEnvironment();

import app from './server';
import prisma from './config/database';
import http from 'http';
import { initializeSocket } from './services/socket.service';
import { ensureSuperAdmin } from './utils/setup-admin';
import logger from './utils/logger';

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Phase 4: Explicit DB connection check for production stability
    await prisma.$connect();
    logger.info('✅ Database connection established');

    // Ensure SuperAdmin exists on startup
    await ensureSuperAdmin();

    const httpServer = http.createServer(app);
    const io = initializeSocket(httpServer);
    app.set('io', io);

    httpServer.listen(PORT, () => {
      const isDev = process.env.NODE_ENV !== 'production';

      const apiUrl = isDev
        ? `http://localhost:${PORT}/api`
        : (process.env.API_URL || `http://localhost:${PORT}/api`);

      const healthUrl = `${apiUrl}/health`;

      logger.info({
        port: PORT,
        env: process.env.NODE_ENV || 'development',
        apiUrl,
        healthUrl
      }, '🚀 Trends CORE V1.0 server started');
    });
  } catch (error) {
    logger.error(error, '❌ Failed to start server');
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received — shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received — shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

// Global error handlers to prevent process crashes from unhandled library errors (e.g. Baileys)
process.on('uncaughtException', (error) => {
  logger.error(error, '🚨 Uncaught Exception detected');
  // We don't exit here to keep the server alive despite background library errors
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, '🚨 Unhandled Rejection detected');
});

startServer();
