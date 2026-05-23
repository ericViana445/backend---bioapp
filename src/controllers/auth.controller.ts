import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

import { env } from '../config/env';
import { usersRepository } from '../db';

const googleClient = new OAuth2Client(env.googleClientId);

function publicUser(user: {
  id: number;
  name: string;
  email: string;
  dob: string | null;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    dob: user.dob,
  };
}

function createAuthToken(user: { id: number; email: string }) {
  return jwt.sign({ id: user.id, email: user.email }, env.jwtSecret, {
    expiresIn: '1h',
  });
}

export const googleAuth = async (req: Request, res: Response) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ error: 'Token nao enviado.' });
  }

  if (!env.googleClientId) {
    return res.status(500).json({ error: 'Google Client ID nao configurado.' });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: env.googleClientId,
    });

    const payload = ticket.getPayload();

    if (!payload?.email) {
      return res.status(400).json({ error: 'Token invalido.' });
    }

    const { email, name, sub } = payload;

    let user = await usersRepository.findByEmail(email);

    if (!user) {
      user = await usersRepository.create({
        name: name || email,
        email,
        provider: 'google',
        google_id: sub,
      });
    }

    const token = createAuthToken(user);

    return res.status(200).json({
      token,
      user: publicUser(user),
      needsCompletion: !user.dob,
    });
  } catch (err) {
    console.error(err);
    return res.status(401).json({ error: 'Falha na autenticacao com Google.' });
  }
};

export const register = async (req: Request, res: Response) => {
  const { name, email, password, dob } = req.body;

  if (!name || !email || !password || !dob) {
    return res.status(400).json({ error: 'Preencha todos os campos.' });
  }

  try {
    const existingUser = await usersRepository.findByEmail(email);

    if (existingUser) {
      return res.status(400).json({ error: 'Email ja cadastrado.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await usersRepository.create({
      name,
      email,
      password: hashedPassword,
      dob,
      provider: 'local',
    });

    return res.status(201).json({
      message: 'Cadastro realizado com sucesso!',
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Preencha todos os campos.' });
  }

  try {
    const user = await usersRepository.findByEmail(email);

    if (!user) {
      return res.status(400).json({
        error: 'Email nao cadastrado. Por favor, cadastre-se.',
      });
    }

    if (user.provider !== 'local' || !user.password) {
      return res.status(400).json({
        error: 'Este email foi cadastrado com Google. Faca login com Google.',
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(400).json({
        error: 'Senha incorreta.',
      });
    }

    const token = createAuthToken(user);

    return res.status(200).json({
      token,
      user: publicUser(user),
      needsCompletion: !user.dob,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};

export const updateDob = async (req: Request, res: Response) => {
  const { email, dob } = req.body;

  if (!email || !dob) {
    return res.status(400).json({ error: 'Dados invalidos.' });
  }

  try {
    await usersRepository.updateDob(email, dob);

    return res.status(200).json({ message: 'DOB atualizado.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao atualizar.' });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, email, dob } = req.body;

  if (!name || !email || !dob) {
    return res.status(400).json({ error: 'Dados invalidos.' });
  }

  try {
    const updatedUser = await usersRepository.updateProfile(Number(id), {
      name,
      email,
      dob,
    });

    return res.json(updatedUser);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao atualizar usuario' });
  }
};
