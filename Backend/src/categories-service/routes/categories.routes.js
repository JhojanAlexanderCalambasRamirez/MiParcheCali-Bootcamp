import { Router } from 'express';
import { authGuard } from '../../_shared/authGuard.js';
import { roleGuard } from '../../_shared/roleGuard.js';
import * as ctrl from '../controllers/categories.controller.js';

const router = Router();

router.get('/', ctrl.list);
router.post('/', authGuard, roleGuard('ADMIN'), ctrl.create);
router.delete('/:id', authGuard, roleGuard('ADMIN'), ctrl.remove);

export default router;
