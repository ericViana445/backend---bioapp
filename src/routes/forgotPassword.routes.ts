import { Router, Request, Response } from "express";
import nodemailer from "nodemailer";
import { db } from "../db";

const router = Router();

/* ARMAZENA CÓDIGOS TEMPORARIAMENTE */
const verificationCodes = new Map<string, string>();

/* CRIA TRANSPORTER */
function createTransporter() {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  console.log("EMAIL_USER:", emailUser);
  console.log("EMAIL_PASS existe:", !!emailPass);

  if (!emailUser || !emailPass) {
    throw new Error("EMAIL_USER ou EMAIL_PASS não carregados no .env");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });
}


/* ENVIAR CÓDIGO */
router.post("/forgot-password", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        error: "Email obrigatório",
      });

      return;
    }

    /* GERA CÓDIGO DE 5 DÍGITOS */
    const code = Math.floor(
      10000 + Math.random() * 90000
    ).toString();

    /* SALVA */
    verificationCodes.set(email, code);

    const transporter = createTransporter();

    /* ENVIA EMAIL */
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Código de recuperação",
      html: `
        <div style="font-family: Arial; padding: 20px;">
          <h2>Recuperação de senha</h2>

          <p>Seu código de verificação é:</p>

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

          <p style="margin-top: 20px;">
            O código expira em alguns minutos.
          </p>
        </div>
      `,
    });

    res.json({
      success: true,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      error: "Erro ao enviar código",
    });
  }
});

/* VALIDAR CÓDIGO */
router.post("/verify-code", async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      res.status(400).json({
        error: "Dados inválidos",
      });

      return;
    }

    const savedCode = verificationCodes.get(email);

    if (savedCode !== code) {
      res.status(400).json({
        error: "Código inválido",
      });

      return;
    }

    /* REMOVE APÓS VALIDAR */
    verificationCodes.delete(email);

    res.json({
      success: true,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      error: "Erro ao validar código",
    });
  }
});

router.post("/reset-password", async (req: Request, res: Response) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      res.status(400).json({ error: "Dados incompletos." });
      return;
    }

    const database = await db;

    const user = await database.get(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (!user) {
      res.status(404).json({ error: "Usuário não encontrado." });
      return;
    }

    await database.run(
      "UPDATE users SET password = ? WHERE email = ?",
      [newPassword, email]
    );

    res.json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Erro ao redefinir senha." });
  }
});

/* TESTE */
router.get("/forgot-password-test", (req: Request, res: Response) => {
  res.json({
    message: "Rota forgot password funcionando",
  });
});

export default router;