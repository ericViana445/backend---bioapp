import { Router } from 'express';
import bcrypt from 'bcrypt';

import {
  googleAuth,
  login,
  register,
  updateDob,
  updateUser,
} from '../controllers/auth.controller';
import { usersRepository } from '../db';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.patch('/update-dob', updateDob);
router.put('/:id', updateUser);

router.post('/change-password', async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;

    if (!email || !currentPassword || !newPassword) {
      res.status(400).json({
        error: 'Dados incompletos.',
      });
      return;
    }

    const user = await usersRepository.findByEmail(email);

    if (!user || !user.password) {
      res.status(404).json({
        error: 'Usuario nao encontrado.',
      });
      return;
    }

    const passwordMatches = await bcrypt.compare(currentPassword, user.password);

    if (!passwordMatches) {
      res.status(400).json({
        error: 'Senha atual incorreta.',
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await usersRepository.updatePassword(email, hashedPassword);

    res.json({
      success: true,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      error: 'Erro interno.',
    });
  }
});

export default router;
