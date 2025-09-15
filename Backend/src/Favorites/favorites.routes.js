import { Router } from 'express';
import { authGuard } from '../shared/middlewares/authGuard.js';
import { addFavorite, removeFavorite, listFavorites } from './favorites.controller.js';

const router = Router();
router.get('/', authGuard, listFavorites);
router.post('/:planId', authGuard, addFavorite);
router.delete('/:planId', authGuard, removeFavorite);
export default router;
