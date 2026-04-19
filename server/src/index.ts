import 'dotenv/config';
import { validateEnvironment } from './config/env-validator';

// Validate environment before anything else
validateEnvironment();

import app from './server';
import prisma from './config/database';
import http from 'http';
import cron from 'node-cron';
import { initializeSocket } from './services/socket.service';
import { ensureSuperAdmin } from './utils/setup-admin';
import messageService from './services/message.service';
import { pledgeReminderService } from './services/pledgeReminder.service';
import { libraryAutomationService } from './services/libraryAutomation.service';
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
      // Start background jobs
      messageService.startScheduler();

      // Schedule pledge reminder CRON job: daily at 8:00 AM EAT (05:00 UTC)
      cron.schedule('0 5 * * *', () => {
        pledgeReminderService.runDailyCheck().catch(console.error);
      });
      console.log('[CRON] Pledge reminder job scheduled (daily 08:00 EAT)');

      // ── Library automation CRON jobs ────────────────────────────────────────
      // Job 1 — Auto-assess late fines: 00:05 EAT (21:05 UTC prev day)
      cron.schedule('5 21 * * *', () => {
        libraryAutomationService.autoAssessLateFines().catch(console.error);
      });
      console.log('[CRON] Library: assess-fines job scheduled (daily 00:05 EAT)');

      // Job 2 — Send overdue SMS reminders: 08:00 EAT (05:00 UTC)
      cron.schedule('0 5 * * *', () => {
        libraryAutomationService.sendOverdueSmsBatch().catch(console.error);
      });
      console.log('[CRON] Library: send-reminders job scheduled (daily 08:00 EAT)');

      // Job 3 — Auto-suspend members with large unpaid fines: 00:10 EAT
      cron.schedule('10 21 * * *', () => {
        libraryAutomationService.autoSuspendMembersWithFines().catch(console.error);
      });
      console.log('[CRON] Library: suspend-members job scheduled (daily 00:10 EAT)');

      // Job 4 — Auto-expire memberships: 00:15 EAT
      cron.schedule('15 21 * * *', () => {
        libraryAutomationService.autoExpireMemberships().catch(console.error);
      });
      console.log('[CRON] Library: expire-memberships job scheduled (daily 00:15 EAT)');
      // ────────────────────────────────────────────────────────────────────────

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
