import 'dotenv/config';
import { validateEnvironment } from './config/env-validator';

// Validate environment before anything else
validateEnvironment();

import app from './server';
import prisma from './config/database';
import http from 'http';
import { initializeSocket } from './services/socket.service';
import { ensureSuperAdmin } from './utils/setup-admin';
import messageService from './services/message.service';
import logger from './utils/logger';

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Ensure SuperAdmin exists on startup
    await ensureSuperAdmin();

    const httpServer = http.createServer(app);
    const io = initializeSocket(httpServer);
    app.set('io', io);

    httpServer.listen(PORT, () => {
      // Start background jobs
      messageService.startScheduler();

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
      }, '🚀 Zawadi SMS server started');
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

startServer();
