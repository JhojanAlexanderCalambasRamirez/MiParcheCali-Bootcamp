import { Router } from 'express';
import { authGuard } from '../shared/middlewares/authGuard.js';
import { searchPlans } from '../controllers/patches.controller.js';

const router = Router();
router.get('/', authGuard, searchPlans);
export default router;
