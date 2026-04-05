import express from 'express';
import { initDB } from './db';
import authRoutes from './routes/auth.routes';
import { env } from './config/env';

const app = express();
app.use(express.json());

initDB();

app.use('/auth', authRoutes);
app.use('/users', authRoutes);

// 👇 TESTE
app.get('/', (req, res) => {
  res.send('Backend funcionando 🚀');
});

app.listen(env.port, '0.0.0.0', () => {
  console.log(`🔥 Server running on http://192.168.1.18:${env.port}`);
});