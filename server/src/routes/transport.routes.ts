import { Router } from 'express';
import { transportController } from '../controllers/transport.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Base PATH is: /api/transport

router.use(authenticate);

// Vehicles
router.get('/vehicles', transportController.getVehicles);
router.post('/vehicles', transportController.createVehicle);
router.delete('/vehicles/:id', transportController.deleteVehicle);

// Routes
router.get('/routes', transportController.getRoutes);
router.post('/routes', transportController.createRoute);
router.delete('/routes/:id', transportController.deleteRoute);

// Assignments & Passengers
router.get('/assignments/:routeId', transportController.getAssignments);
router.post('/assignments', transportController.createAssignment);
router.delete('/assignments/:id', transportController.deleteAssignment);

export default router;
