/**
 * Bulk Operations Router Index
 * Combines all bulk operation routes
 */

import { Router } from 'express';
import learnersRouter from './learners.bulk';
import teachersRouter from './teachers.bulk';
import parentsRouter from './parents.bulk';
import assessmentsRouter from './assessments.bulk';
import feesRouter from './fees.bulk';
import accountingRouter from './accounting.bulk';

const router = Router();

// Mount sub-routers
router.use('/learners', learnersRouter);
router.use('/teachers', teachersRouter);
router.use('/parents', parentsRouter);
router.use('/assessments', assessmentsRouter);
router.use('/fees', feesRouter);
router.use('/accounting', accountingRouter);

export default router;
