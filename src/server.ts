import express from 'express';
import { initDB } from './db';
import authRoutes from './routes/auth.routes';
import { env } from './config/env';

const app = express();
app.use(express.json());

// Inicializa DB
initDB();

// Rotas
app.use('/auth', authRoutes);

app.listen(env.port, '0.0.0.0', () => {
  console.log(`🔥 Server running on http://192.168.1.9:${env.port}`);
});
