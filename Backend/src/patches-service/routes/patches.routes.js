import { Router } from 'express';
import { authGuard } from '../../_shared/authGuard.js';
import { roleGuard } from '../../_shared/roleGuard.js';
import * as ctrl from '../controllers/patches.controller.js';

const router = Router();

router.get('/patches', ctrl.listPublic);
router.get('/patches/:id', ctrl.detail);

router.use(authGuard);
router.get('/my/patches', roleGuard('USUARIO_EMPRESA'), ctrl.listMine);
router.post('/patches', roleGuard('USUARIO_EMPRESA'), ctrl.create);
router.patch('/patches/:id', roleGuard('USUARIO_EMPRESA','ADMIN'), ctrl.update);
router.delete('/patches/:id', roleGuard('USUARIO_EMPRESA','ADMIN'), ctrl.softDelete);

export default router;
