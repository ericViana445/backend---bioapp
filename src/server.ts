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

app.listen(env.port, () => {
  console.log(`🔥 Server running on http://localhost:${env.port}`);
});
