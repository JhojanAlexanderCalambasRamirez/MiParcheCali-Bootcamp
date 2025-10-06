import { Router } from 'express';
import multer from 'multer';
import { authGuard } from '../../_shared/authGuard.js';
import { roleGuard } from '../../_shared/roleGuard.js';
import * as ctrl from '../controllers/patches.controller.js';

const router = Router();

router.get('/patches', ctrl.listPublic);
router.get('/patches/:id', ctrl.detail);
router.get('/patches/:id/photos/:photoId', ctrl.servePhoto);
router.use(authGuard);
router.get('/my/patches', roleGuard('USUARIO_EMPRESA'), ctrl.listMine);
router.post('/patches', roleGuard('USUARIO_EMPRESA'), ctrl.create);
router.patch('/patches/:id', roleGuard('USUARIO_EMPRESA','ADMIN'), ctrl.update);
router.delete('/patches/:id', roleGuard('USUARIO_EMPRESA','ADMIN'), ctrl.softDelete);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 3 },
  fileFilter: (req, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype);
    cb(ok ? null : new Error('Tipo de archivo no permitido'), ok);
  }
});

router.post(
  '/patches/:id/photos',
  roleGuard('USUARIO_EMPRESA','ADMIN'),
  upload.array('photos', 3),
  ctrl.uploadPhotos
);

router.delete(
  '/patches/:id/photos/:photoId',
  roleGuard('USUARIO_EMPRESA','ADMIN'),
  ctrl.deletePhoto
);

export default router;
