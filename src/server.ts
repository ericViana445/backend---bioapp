import express from 'express';
import os from 'os';
import { initDB } from './db';
import authRoutes from './routes/auth.routes';
import { env } from './config/env';
import pdfRoutes from './routes/pdf.routes';

const app = express();
app.use(express.json());

initDB();

app.use('/auth', authRoutes);
app.use('/users', authRoutes);
app.use('/pdf', pdfRoutes);

app.get('/', (req, res) => {
  res.send('Backend funcionando 🚀');
});

function getLocalIPv4() {
  const interfaces = os.networkInterfaces();

  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] ?? []) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }

  return 'localhost';
}

const localIP = getLocalIPv4();

app.listen(env.port, '0.0.0.0', () => {
  console.log(`🔥 Server running locally: http://localhost:${env.port}`);
  console.log(`🌐 Server running on network: http://${localIP}:${env.port}`);
});