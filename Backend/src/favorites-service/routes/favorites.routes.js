import { Router } from 'express';
import { authGuard } from '../../_shared/authGuard.js';
import { roleGuard } from '../../_shared/roleGuard.js';
import * as ctrl from '../controllers/favorites.controller.js';

const router = Router();

router.use(authGuard, roleGuard('USUARIO_BUSCADOR'));
router.get('/', ctrl.listMine);
router.post('/', ctrl.add);
router.delete('/:patch_id', ctrl.remove);

export default router;
