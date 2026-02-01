// src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { env } from '../config/env';

// REGISTRO
export const register = async (req: Request, res: Response) => {
  const { name, email, password, dob } = req.body;

  if (!name || !email || !password || !dob) {
    return res.status(400).json({ error: 'Preencha todos os campos.' });
  }

  try {
    const database = await db;

    // Verifica se email já existe
    const existingUser = await database.get('SELECT * FROM users WHERE email = ?', email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email já cadastrado.' });
    }

    // Criptografa a senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Salva usuário
    await database.run(
      'INSERT INTO users (name, email, password, dob) VALUES (?, ?, ?, ?)',
      name,
      email,
      hashedPassword,
      dob
    );

    return res.status(201).json({ message: 'Cadastro realizado com sucesso!' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};

// LOGIN
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Preencha todos os campos.' });
  }

  try {
    const database = await db;

    const user = await database.get('SELECT * FROM users WHERE email = ?', email);
    if (!user) {
      return res.status(400).json({ error: 'Email ou senha incorretos.' });
    }

    // Verifica senha
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Email ou senha incorretos.' });
    }

    // Gera token JWT
    const token = jwt.sign({ id: user.id, email: user.email }, env.jwtSecret, {
      expiresIn: '1h',
    });

    return res.status(200).json({ token, name: user.name, email: user.email });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};
