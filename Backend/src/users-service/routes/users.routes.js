import { Router } from 'express';
import { authGuard } from '../../_shared/authGuard.js';
import { roleGuard } from '../../_shared/roleGuard.js';
import * as ctrl from '../controllers/users.controller.js';

const router = Router();

router.get('/me', authGuard, ctrl.me);
router.get('/', authGuard, roleGuard('ADMIN'), ctrl.list);
router.get('/:id', authGuard, roleGuard('ADMIN'), ctrl.detail);
router.delete('/:id', authGuard, roleGuard('ADMIN'), ctrl.softDelete);

export default router;
