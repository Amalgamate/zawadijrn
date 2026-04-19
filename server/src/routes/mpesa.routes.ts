import { Router } from 'express';
import * as mpesaController from '../controllers/mpesa.controller';

const router = Router();

// Safaricom Callback - MUST BE PUBLIC
// No authenticate middleware here
router.post('/callback', mpesaController.handleCallback);

export default router;
