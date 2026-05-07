// src/routes/auth.routes.ts
import { Router } from 'express';
import { register, login, googleAuth, updateDob, updateUser } from '../controllers/auth.controller';
import { db } from "../db";
const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.patch("/update-dob", updateDob);
router.put('/:id', updateUser);
router.post("/change-password", async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;

    if (!email || !currentPassword || !newPassword) {
      res.status(400).json({
        error: "Dados incompletos.",
      });
      return;
    }

    const database = await db;

    const user = await database.get(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (!user) {
      res.status(404).json({
        error: "Usuário não encontrado.",
      });
      return;
    }

    if (user.password !== currentPassword) {
      res.status(400).json({
        error: "Senha atual incorreta.",
      });
      return;
    }

    await database.run(
      "UPDATE users SET password = ? WHERE email = ?",
      [newPassword, email]
    );

    res.json({
      success: true,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      error: "Erro interno.",
    });
  }
});

export default router;
