import { Router } from 'express';
import multer from 'multer';
import { authGuard } from '../../_shared/authGuard.js';
import { roleGuard } from '../../_shared/roleGuard.js';
import * as ctrl from '../controllers/patches.controller.js';

const router = Router();

/* ------------------ Público ------------------ */
router.get('/patches', ctrl.listPublic);
router.get('/patches/:id', ctrl.detail);

/* Servir foto almacenada en DB (público si el parche está publicado; si no, requiere auth y ser dueño/admin) */
router.get('/patches/:id/photos/:photoId', ctrl.servePhoto);

/* ------------------ Protegidas ------------------ */
router.use(authGuard);

/* Empresa: listar mis parches */
router.get('/my/patches', roleGuard('USUARIO_EMPRESA'), ctrl.listMine);

/* Empresa/Admin: crear/editar/eliminar parche */
router.post('/patches', roleGuard('USUARIO_EMPRESA'), ctrl.create);
router.patch('/patches/:id', roleGuard('USUARIO_EMPRESA','ADMIN'), ctrl.update);
router.delete('/patches/:id', roleGuard('USUARIO_EMPRESA','ADMIN'), ctrl.softDelete);

/* --------- Subida/Borrado de fotos (multipart/form-data) --------- */
/**
 * Usamos memoryStorage para mantener los buffers en memoria (suficiente en dev).
 * Límite: hasta 3 archivos por request, 5MB por archivo (ajusta a tu gusto).
 * Aceptamos solo imágenes comunes.
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 3 },
  fileFilter: (req, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype);
    cb(ok ? null : new Error('Tipo de archivo no permitido'), ok);
  }
});

/* Empresa/Admin: subir fotos (máx 3 por request). Campo: "photos" (Files) */
router.post(
  '/patches/:id/photos',
  roleGuard('USUARIO_EMPRESA','ADMIN'),
  upload.array('photos', 3),
  ctrl.uploadPhotos
);

/* Empresa/Admin: borrar una foto de un parche */
router.delete(
  '/patches/:id/photos/:photoId',
  roleGuard('USUARIO_EMPRESA','ADMIN'),
  ctrl.deletePhoto
);

export default router;
