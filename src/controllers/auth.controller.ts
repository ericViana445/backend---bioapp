// src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { env } from '../config/env';
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/* ======================================================
   GOOGLE AUTH
====================================================== */
export const googleAuth = async (req: Request, res: Response) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ error: 'Token não enviado.' });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      return res.status(400).json({ error: 'Token inválido.' });
    }

    const { email, name, sub } = payload;

    const database = await db;

    // Verifica se já existe
    let user = await database.get(
      'SELECT * FROM users WHERE email = ?',
      email
    );

    if (!user) {
      await database.run(
        `INSERT INTO users (name, email, provider, google_id)
         VALUES (?, ?, ?, ?)`,
        name,
        email,
        'google',
        sub
      );

      user = await database.get(
        'SELECT * FROM users WHERE email = ?',
        email
      );
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      env.jwtSecret,
      { expiresIn: '1h' }
    );

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        dob: user.dob,
      },
      needsCompletion: !user.dob,
    });

  } catch (err) {
    console.error(err);
    return res.status(401).json({ error: 'Falha na autenticação com Google.' });
  }
};


/* ======================================================
   REGISTRO NORMAL
====================================================== */
export const register = async (req: Request, res: Response) => {
  const { name, email, password, dob } = req.body;

  if (!name || !email || !password || !dob) {
    return res.status(400).json({ error: 'Preencha todos os campos.' });
  }

  try {
    const database = await db;

    const existingUser = await database.get(
      'SELECT * FROM users WHERE email = ?',
      email
    );

    if (existingUser) {
      return res.status(400).json({ error: 'Email já cadastrado.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await database.run(
      `INSERT INTO users (name, email, password, dob, provider)
       VALUES (?, ?, ?, ?, ?)`,
      name,
      email,
      hashedPassword,
      dob,
      'local'
    );

    return res.status(201).json({
      message: 'Cadastro realizado com sucesso!'
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};


/* ======================================================
   LOGIN NORMAL
====================================================== */
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Preencha todos os campos.' });
  }

  try {
    const database = await db;

    // 🔎 Procura usuário pelo email (independente do provider)
    const user = await database.get(
      'SELECT * FROM users WHERE email = ?',
      email
    );

    // 🔴 Email não existe
    if (!user) {
      return res.status(400).json({
        error: 'Email não cadastrado. Por favor, cadastre-se.'
      });
    }

    // 🔴 Usuário é Google tentando login com senha
    if (user.provider !== 'local') {
      return res.status(400).json({
        error: 'Este email foi cadastrado com Google. Faça login com Google.'
      });
    }

    // 🔴 Senha incorreta
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(400).json({
        error: 'Senha incorreta.'
      });
    }

    // ✅ Gera token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      env.jwtSecret,
      { expiresIn: '1h' }
    );

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        dob: user.dob,
      },
      needsCompletion: !user.dob,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};

// Endpoint para completar perfil (ex: adicionar data de nascimento)

export const updateDob = async (req: Request, res: Response) => {
  const { email, dob } = req.body;

  if (!email || !dob) {
    return res.status(400).json({ error: "Dados inválidos." });
  }

  try {
    const database = await db;

    await database.run(
      `UPDATE users SET dob = ? WHERE email = ?`,
      dob,
      email
    );

    return res.status(200).json({ message: "DOB atualizado." });

  } catch (error) {
    return res.status(500).json({ error: "Erro ao atualizar." });
  }
};