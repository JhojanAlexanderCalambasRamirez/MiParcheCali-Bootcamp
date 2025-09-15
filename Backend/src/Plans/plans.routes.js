import { Router } from 'express';
import { authGuard } from '../shared/middlewares/authGuard.js';
import { roleGuard } from '../shared/middlewares/roleGuard.js';
import {
  createPlan, listPlans, getPlan, updatePlan, deletePlan
} from './plans.controller.js';

const router = Router();

// Crear plan => usuario con rol 'plan' o 'admin'
router.post('/', authGuard, roleGuard(['plan', 'admin']), createPlan);

// Listar: publicados (si no admin) / todos (si admin)
router.get('/', authGuard, listPlans);

// Detalle
router.get('/:id', authGuard, getPlan);

// Editar/eliminar => dueño o admin
router.put('/:id', authGuard, updatePlan);
router.delete('/:id', authGuard, deletePlan);

export default router;
