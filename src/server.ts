import express from 'express';
import { initDB } from './db';
import authRoutes from './routes/auth.routes';
import { env } from './config/env';

const app = express();

// 🔥 Middleware de log global
app.use((req, res, next) => {
  console.log('------------------------------');
  console.log('📥 METHOD:', req.method);
  console.log('📥 URL:', req.originalUrl);
  console.log('📥 Headers:', req.headers);
  console.log('📥 Body:', req.body);
  console.log('------------------------------');
  next();
});

app.use(express.json());

// Inicializa DB
initDB();

// Rotas
app.use('/auth', authRoutes);

// 🔥 Log de erros global
app.use((err: any, req: any, res: any, next: any) => {
  console.error('🚨 ERRO GLOBAL:', err);
  res.status(500).json({ error: 'Erro interno', details: err.message });
});

app.listen(env.port, () => {
  console.log(`🔥 Server running on http://localhost:${env.port}`);
});
