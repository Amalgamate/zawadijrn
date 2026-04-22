import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/async.util';
import { rateLimit } from '../middleware/enhanced-rateLimit.middleware';

const router = Router();
const paymentController = new PaymentController();

// All payment routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/payments/mpesa/stk-push
 * @desc    Initiate an M-Pesa STK Push via IntaSend
 */
router.post(
    '/mpesa/stk-push',
    rateLimit({ windowMs: 60_000, maxRequests: 5 }), // Strict limit for STK pushes
    asyncHandler(paymentController.initiateStkPush.bind(paymentController))
);

/**
 * @route   GET /api/payments/mpesa/status/:checkoutId/:invoiceId
 * @desc    Check status of an IntaSend M-Pesa transaction and record if complete
 */
router.get(
    '/mpesa/status/:checkoutId/:invoiceId',
    rateLimit({ windowMs: 60_000, maxRequests: 20 }),
    asyncHandler(paymentController.checkStatusAndRecord.bind(paymentController))
);

export default router;
