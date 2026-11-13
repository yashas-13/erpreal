
import dotenv from 'dotenv';

dotenv.config();

export const environment = {
  port: Number(process.env.PORT) || 3001,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV || 'development',
};
