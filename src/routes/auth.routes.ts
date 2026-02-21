// src/routes/auth.routes.ts
import { Router } from 'express';
import { register, login, googleAuth, updateDob } from '../controllers/auth.controller';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.patch("/update-dob", updateDob);

export default router;
