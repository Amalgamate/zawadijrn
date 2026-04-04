import { Router } from 'express';
import { idTemplateController } from '../controllers/idTemplate.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/permissions.middleware';

const router = Router();

// Require authorization for template customization
router.use(authenticate);
router.use(requirePermission('MANAGE_ID_TEMPLATES'));

router.get('/', idTemplateController.getAll);
router.get('/active', idTemplateController.getActive);
router.get('/:id', idTemplateController.getById);

router.post('/', idTemplateController.create);
router.put('/:id', idTemplateController.update);
router.delete('/:id', idTemplateController.delete);

export default router;
