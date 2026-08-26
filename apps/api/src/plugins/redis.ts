import { Redis } from 'ioredis';
import { env } from '../config/env.js';

export const redis = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
  lazyConnect: true,
  retryStrategy(times: number) {
    if (times > 3) return null; // do not block if redis is not running in test mode
    return Math.min(times * 100, 2000);
  },
});

redis.on('error', (err: Error) => {
  if (process.env.NODE_ENV !== 'test') {
    console.warn('⚠️ Redis connection warning:', err.message);
  }
});
