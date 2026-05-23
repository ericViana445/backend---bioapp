import cors, { CorsOptions } from 'cors';
import express from 'express';
import os from 'os';

import { env } from './config/env';
import { initDB } from './db';
import aiRoutes from './routes/ai.routes';
import authRoutes from './routes/auth.routes';
import forgotPasswordRoutes from './routes/forgotPassword.routes';
import pdfRoutes from './routes/pdf.routes';

const app = express();

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin || env.nodeEnv !== 'production') {
      callback(null, true);
      return;
    }

    if (env.frontendOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Origem nao permitida pelo CORS'));
  },
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '2mb' }));

initDB().catch((error) => {
  console.error(error);
  process.exit(1);
});

app.get('/', (req, res) => {
  res.send('Backend funcionando');
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: env.nodeEnv,
  });
});
//teste
app.use('/auth', authRoutes);
app.use('/auth', forgotPasswordRoutes);
app.use('/users', authRoutes);
app.use('/pdf', pdfRoutes);
app.use('/ai', aiRoutes);

function getLocalIPv4() {
  const interfaces = os.networkInterfaces();
  const wifiNames = ['Wi-Fi', 'Wireless', 'WLAN'];

  for (const name of Object.keys(interfaces)) {
    const isWifi = wifiNames.some((wifiName) =>
      name.toLowerCase().includes(wifiName.toLowerCase())
    );

    if (!isWifi) continue;

    for (const net of interfaces[name] ?? []) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }

  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] ?? []) {
      if (
        net.family === 'IPv4' &&
        !net.internal &&
        !net.address.startsWith('192.168.137.')
      ) {
        return net.address;
      }
    }
  }

  return 'localhost';
}

const localIP = getLocalIPv4();

app.listen(env.port, '0.0.0.0', () => {
  console.log(`Server running locally: http://localhost:${env.port}`);
  console.log(`Server running on network: http://${localIP}:${env.port}`);
});
