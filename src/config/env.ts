import 'dotenv/config';

export const env = {
  jwtSecret: process.env.JWT_SECRET || 'default_secret',
  port: Number(process.env.PORT) || 3333
};
