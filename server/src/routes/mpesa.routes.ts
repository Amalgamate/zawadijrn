import { Router } from 'express';
import * as mpesaController from '../controllers/mpesa.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// ── Public — Safaricom/Kopo Kopo Callback (MUST be public, no auth) ────────
router.post('/callback', mpesaController.handleCallback);

// ── Protected ──────────────────────────────────────────────────────────────
router.post('/initiate', authenticate, mpesaController.initiatePayment);
router.get('/status/:checkoutRequestId/:invoiceId', authenticate, mpesaController.queryStatus);

router.post('/payout/bulk', authenticate, mpesaController.initiateBulkPayout);

// Unmatched payments (Buy Goods Till organic payments)
router.get('/unmatched',             authenticate, mpesaController.getUnmatchedPayments);
router.get('/unmatched/count',       authenticate, mpesaController.getUnmatchedCount);
router.put('/unmatched/:id/resolve', authenticate, mpesaController.resolveUnmatchedPayment);
router.put('/unmatched/:id/dismiss', authenticate, mpesaController.dismissUnmatchedPayment);

export default router;
