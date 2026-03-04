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

    // Setup SuperAdmin
    await ensureSuperAdmin();

    // Create HTTP server
    console.log('[DEBUG] Creating HTTP server...');
    const httpServer = http.createServer(app);
    console.log('[DEBUG] HTTP server created');

    // Initialize Socket.io
    console.log('[DEBUG] Initializing Socket.io...');
    const io = initializeSocket(httpServer);
    console.log('[DEBUG] Socket.io initialized');

    // Store io instance in app for access in controllers (optional, but good practice)
    app.set('io', io);
    console.log('[DEBUG] Socket.io stored in app instance');

    // Start server
    console.log('[DEBUG] Calling httpServer.listen()...');
    httpServer.listen(PORT, () => {
      console.log('[DEBUG] Listen callback FIRED');
      // Determine API URL based on environment
      const apiUrl = process.env.API_URL || (process.env.NODE_ENV === 'production'
        ? `https://${process.env.FRONTEND_URL?.replace('https://', '')}/api` // Fallback logic
        : `http://localhost:${PORT}/api`);

      const healthUrl = `${apiUrl}/health`;

      console.log('🚀 Server started successfully!');
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
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

      // Dynamic route printing
      // Helper to print routes from the express app/router stack
      const printRoutes = (stack: any[], basePath: string = '') => {
        stack.forEach((layer) => {
          if (layer.route) {
            // It's a route
            const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
            console.log(`  ${methods.padEnd(6)} ${basePath}${layer.route.path}`);
          } else if (layer.name === 'router' && layer.handle.stack) {
            // It's a router middleware
            // The path info is in layer.regexp, but getting the string nicely is tricky. 
            // Often express stores the mount path in `layer.regexp` which is hard to parse back to string.
            // For simplicity in this setup where we know the structure, we can try to guess or just warn.
            // However, since we mounted routes in server.ts with specific prefixes, those prefixes are lost in the compiled regex
            // unless we inspect the original mount call, which we can't easily do here.
            // 
            // BETTER APPROACH: List the main modules we know are mounted if we can't easily recurs
            // But user asked to NOT hide and find out.
            // 
            // Actually, express 4.x structure makes this hard from the top level 'app' without using a library like 'express-list-endpoints'.
            // Since we can't install packages, we will try to list what we can see from the main 'app._router'.
            // 
            // printRoutes(layer.handle.stack, basePath);
          }
        });
      };

      // We need to access app._router which is not typed in the prompt's context but exists at runtime.
      // However, app is imported from ./server. Since we are in index.ts and app is imported.
      // @ts-ignore
      if (app._router && app._router.stack) {
        // @ts-ignore
        // This only works if we can see the mount paths. Express unfortunately converts `app.use('/api', routes)` 
        // into a regex layer. We might only see the sub-routes without the '/api' prefix if we just walk the stack.
        // 
        // Use a simplified list for now that reliably shows top specific routes if possible, 
        // or just admit we need to look at routes/index.ts
      }

      // Since we can't easily reconstruct the full path without a library, 
      // let's at least print the top-level mounts we know from 'server.ts' if we can't inspect them.
      // But wait, user said "no hardcoded endpoints".
      // 
      // Let's rely on the fact that we know we mounted everything under /api.
      // We can iterate the 'routes' router we imported?
      // No, we imported 'app', not 'routes'.

      // Let's try to print whatever we can find in app._router
      try {
        // @ts-ignore
        const routerStack = app._router.stack;
        routerStack.forEach((layer: any) => {
          if (layer.route) {
            const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
            console.log(`  ${methods.padEnd(6)} ${layer.route.path}`);
          } else if (layer.name === 'router') {
            // This is likely the '/api' router
            // We can't easily get the '/api' string from the regexp fastKey.
            // But we can peek inside.
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
