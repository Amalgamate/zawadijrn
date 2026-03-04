import 'dotenv/config';
import { validateEnvironment } from './config/env-validator';
import { execSync } from 'child_process';

// Validate environment before anything else
validateEnvironment();

console.log('--- RESTARTING SERVER ---');
import app from './server';
import prisma from './config/database';
import http from 'http';
import { initializeSocket } from './services/socket.service';
import { ensureSuperAdmin } from './utils/setup-admin';

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Note: Don't block on database connection on startup
    // Prisma will automatically connect when first query is made
    // This allows the server to start and handle requests even if DB is temporarily unavailable
    console.log('🚀 Starting server (database connection will be established on first request)...');

    // Create HTTP server
    console.log('[DEBUG] Creating HTTP server...');
    const httpServer = http.createServer(app);
    console.log('[DEBUG] HTTP server created');

    // Initialize Socket.io
    console.log('[DEBUG] Initializing Socket.io...');
    const io = initializeSocket(httpServer);
    console.log('[DEBUG] Socket.io initialized');

    // Store io instance in app for access in controllers
    app.set('io', io);
    console.log('[DEBUG] Socket.io stored in app instance');

    // Start server - Bind to 0.0.0.0 and PORT
    // We bind to the port BEFORE running ensureSuperAdmin so Render detects the service is live immediately
    console.log('[DEBUG] Calling httpServer.listen()...');
    httpServer.listen(Number(PORT), '0.0.0.0', async () => {
      console.log('[DEBUG] Listen callback FIRED');

      // Setup SuperAdmin in background after port is open to prevent Render port scan timeout
      await ensureSuperAdmin();

      // Determine API URL based on environment
      const apiUrl = process.env.API_URL || (process.env.NODE_ENV === 'production'
        ? `https://${process.env.FRONTEND_URL?.replace('https://', '')}/api` // Fallback logic
        : `http://localhost:${PORT}/api`);

      const healthUrl = `${apiUrl}/health`;

      console.log('🚀 Server started successfully!');
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'production'}`);
      console.log(`📍 API Base: ${apiUrl}`);
      console.log(`🏥 Health Check: ${healthUrl}`);
      console.log(`🚀 PORT: ${PORT}`);
      console.log('---------------------------');

      // Render Keep-Awake Logic
      if (process.env.RENDER_KEEP_AWAKE === 'true' && process.env.RENDER_SERVICE_URL) {
        const url = `${process.env.RENDER_SERVICE_URL}/status`.replace(/([^:]\/)\/+/g, "$1");
        console.log(`⏱️  Keep-Awake active: Pinging ${url} every 14 minutes...`);

        setInterval(async () => {
          try {
            const axios = (await import('axios')).default;
            await axios.get(url);
            console.log(`♻️ Self-ping successful at ${new Date().toISOString()}`);
          } catch (err: any) {
            console.warn(`⚠️ Self-ping failed: ${err.message}`);
          }
        }, 14 * 60 * 1000); // 14 minutes
      }

      console.log('');
      console.log('Available Configured Endpoints:');
      try {
        // @ts-ignore
        const routerStack = app._router.stack;
        routerStack.forEach((layer: any) => {
          if (layer.route) {
            const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
            console.log(`  ${methods.padEnd(6)} ${layer.route.path}`);
          } else if (layer.name === 'router') {
            console.log(`  [Router] Mounted Sub-router (likely /api)`);
          }
        });
      } catch (e) {
        console.log('  (Could not list routes dynamically)');
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
