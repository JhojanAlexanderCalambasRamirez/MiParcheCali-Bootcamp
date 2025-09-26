import { Router } from 'express';
import { register, login, me } from './auth.controller.js';
import { authGuard } from '../shared/middlewares/authGuard.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authGuard, me);

export default router;
