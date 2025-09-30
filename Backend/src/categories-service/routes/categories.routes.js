import { Router } from 'express';
import { authGuard } from '../../_shared/authGuard.js';
import { roleGuard } from '../../_shared/roleGuard.js';
import * as ctrl from '../controllers/categories.controller.js';

const router = Router();

/** Públicas */
router.get('/', ctrl.list);
router.get('/:id', ctrl.detail);

/** Solo ADMIN */
router.post('/',      authGuard, roleGuard('ADMIN'), ctrl.create);
router.post('/bulk',  authGuard, roleGuard('ADMIN'), ctrl.bulkCreate);
router.patch('/:id',  authGuard, roleGuard('ADMIN'), ctrl.update);
router.delete('/:id', authGuard, roleGuard('ADMIN'), ctrl.remove);

export default router;
