import 'dotenv/config';
import { validateEnvironment } from './config/env-validator';

// Validate environment before anything else
validateEnvironment();

import app from './server';
import prisma from './config/database';
import http from 'http';
import { initializeSocket } from './services/socket.service';
import { ensureSuperAdmin } from './utils/setup-admin';

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Ensure SuperAdmin exists on startup
    await ensureSuperAdmin();

    const httpServer = http.createServer(app);
    const io = initializeSocket(httpServer);
    app.set('io', io);

    httpServer.listen(PORT, () => {
      const isDev = process.env.NODE_ENV !== 'production';

      const apiUrl   = isDev
        ? `http://localhost:${PORT}/api`
        : (process.env.API_URL || `http://localhost:${PORT}/api`);

      const healthUrl = `${apiUrl}/health`;

      console.log('');
      console.log('🚀 Zawadi SMS server started');
      console.log(`📍 Environment : ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 API         : ${apiUrl}`);
      console.log(`❤️  Health      : ${healthUrl}`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received — shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received — shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
