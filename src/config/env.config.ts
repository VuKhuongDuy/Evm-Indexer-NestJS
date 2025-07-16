import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
}));

export const databaseConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL,
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
  name: process.env.DATABASE_NAME || 'evm_indexer',
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'password',
}));

export const networkConfig = registerAs('network', () => ({
  rpcUrl: process.env.RPC_URL,
  chainId: parseInt(process.env.CHAIN_ID, 10) || 1,
  blockConfirmations: parseInt(process.env.BLOCK_CONFIRMATIONS, 10) || 12,
}));

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
  expiresIn: process.env.JWT_EXPIRES_IN || '24h',
}));

export const redisConfig = registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD || '',
}));

export const loggingConfig = registerAs('logging', () => ({
  level: process.env.LOG_LEVEL || 'debug',
}));
