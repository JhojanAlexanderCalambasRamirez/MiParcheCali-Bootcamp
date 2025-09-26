import { Router } from 'express';
import * as ctrl from '../controllers/auth.controller.js';

const router = Router();

router.post('/register', ctrl.register);        
router.post('/login', ctrl.login);
router.post('/register-admin', ctrl.registerAdmin); 

export default router;
