import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';

import { env } from '../config/env';
import { usersRepository } from '../db';

const router = Router();
const verificationCodes = new Map<string, string>();

function createTransporter() {
  const emailUser = env.email.user;
  const emailPass = env.email.pass;

  if (!emailUser || !emailPass) {
    throw new Error('EMAIL_USER ou EMAIL_PASS nao carregados no .env');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });
}

router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        error: 'Email obrigatorio',
      });
      return;
    }

    const user = await usersRepository.findByEmail(email);

    if (!user) {
      res.status(404).json({
        error: 'Usuario nao encontrado.',
      });
      return;
    }

    const code = Math.floor(10000 + Math.random() * 90000).toString();
    verificationCodes.set(email, code);

    const transporter = createTransporter();

    await transporter.sendMail({
      from: env.email.user,
      to: email,
      subject: 'Codigo de recuperacao',
      html: `
        <div style="font-family: Arial; padding: 20px;">
          <h2>Recuperacao de senha</h2>
          <p>Seu codigo de verificacao e:</p>
          <div
            style="
              background: #2563EB;
              color: white;
              padding: 14px 24px;
              border-radius: 12px;
              font-size: 32px;
              font-weight: bold;
              width: fit-content;
              letter-spacing: 6px;
            "
          >
            ${code}
          </div>
          <p style="margin-top: 20px;">O codigo expira em alguns minutos.</p>
        </div>
      `,
    });

    res.json({
      success: true,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      error: 'Erro ao enviar codigo',
    });
  }
});

router.post('/verify-code', async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      res.status(400).json({
        error: 'Dados invalidos',
      });
      return;
    }

    const savedCode = verificationCodes.get(email);

    if (savedCode !== code) {
      res.status(400).json({
        error: 'Codigo invalido',
      });
      return;
    }

    verificationCodes.delete(email);

    res.json({
      success: true,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      error: 'Erro ao validar codigo',
    });
  }
});

router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      res.status(400).json({ error: 'Dados incompletos.' });
      return;
    }

    const user = await usersRepository.findByEmail(email);

    if (!user) {
      res.status(404).json({ error: 'Usuario nao encontrado.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await usersRepository.updatePassword(email, hashedPassword);

    res.json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Erro ao redefinir senha.' });
  }
});

router.get('/forgot-password-test', (req: Request, res: Response) => {
  res.json({
    message: 'Rota forgot password funcionando',
  });
});

export default router;
