// src/routes/auth.routes.ts
import { Router } from 'express';
import { register, login, googleAuth, updateDob, updateUser } from '../controllers/auth.controller';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.patch("/update-dob", updateDob);
router.put('/:id', updateUser);

export default router;
