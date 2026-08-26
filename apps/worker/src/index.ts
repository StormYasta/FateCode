import dotenv from 'dotenv';
import path from 'path';
import { Redis } from 'ioredis';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config();

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

console.log('⚙️ Starting FateCode Execution Worker...');
console.log(`🔌 Connecting to Redis at ${redisHost}:${redisPort}...`);

const redis = new Redis({
  host: redisHost,
  port: redisPort,
  password: process.env.REDIS_PASSWORD || undefined,
  lazyConnect: true,
  retryStrategy(times: number) {
    if (times > 5) return 5000;
    return Math.min(times * 500, 3000);
  },
});

async function startWorker() {
  try {
    await redis.connect();
    console.log('✅ Worker connected to Redis.');
    console.log('🛡️ Execution Worker ready for code execution jobs (Phase 5 sandbox setup).');
  } catch (err: any) {
    console.warn('⚠️ Worker Redis connection failed (Worker will retry in background):', err.message);
  }
}

startWorker();
