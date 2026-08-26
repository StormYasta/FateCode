import { FastifyInstance } from 'fastify';
import { prisma } from '../plugins/prisma.js';
import { redis } from '../plugins/redis.js';

export async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/health', async (request, reply) => {
    let dbStatus = 'ok';
    let redisStatus = 'ok';

    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (err: any) {
      dbStatus = `error: ${err.message}`;
    }

    try {
      if (redis.status === 'ready' || redis.status === 'connecting') {
        const ping = await redis.ping();
        redisStatus = ping === 'PONG' ? 'ok' : 'unexpected';
      } else {
        redisStatus = 'disconnected';
      }
    } catch (err: any) {
      redisStatus = `unavailable: ${err.message}`;
    }

    const isHealthy = dbStatus === 'ok';

    return reply.status(isHealthy ? 200 : 503).send({
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
        redis: redisStatus,
        api: 'ok',
      },
    });
  });
}
