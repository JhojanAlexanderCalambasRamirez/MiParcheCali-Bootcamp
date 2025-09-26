import { Router } from 'express';
import { authGuard } from '../shared/middlewares/authGuard.js';
import { roleGuard } from '../shared/middlewares/roleGuard.js';
import {
  createPlan, listPlans, getPlan, updatePlan, deletePlan
} from '../controllers/categories.controller.js';

const router = Router();

router.post('/', authGuard, roleGuard(['plan', 'admin']), createPlan);

router.get('/', authGuard, listPlans);

router.get('/:id', authGuard, getPlan);

router.put('/:id', authGuard, updatePlan);
router.delete('/:id', authGuard, deletePlan);

export default router;
