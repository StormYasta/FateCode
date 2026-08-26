import { FastifyInstance } from 'fastify';
import { prisma } from '../plugins/prisma.js';
import { authenticate } from '../middlewares/authenticate.js';
import { GamificationService } from '../services/gamification.service.js';
import { z } from 'zod';

export async function gamificationRoutes(fastify: FastifyInstance) {
  // 3-Level Rankings (Faculty, Course, Class)
  fastify.get('/rankings', { preHandler: [authenticate] }, async (request, reply) => {
    const querySchema = z.object({
      level: z.enum(['FACULTY', 'COURSE', 'CLASS']).default('FACULTY'),
      targetId: z.string().optional(),
      period: z.enum(['ALL_TIME', 'SEASON', 'MONTHLY']).default('ALL_TIME'),
    });

    const parsed = querySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation Error', details: parsed.error.errors });
    }

    const leaderboard = await GamificationService.getRankings(parsed.data);

    return reply.send({
      data: leaderboard,
      level: parsed.data.level,
      period: parsed.data.period,
    });
  });

  // List Achievements with user unlock status
  fastify.get('/achievements', { preHandler: [authenticate] }, async (request, reply) => {
    const user = (request as any).user;

    const [allAchievements, userAchievements] = await Promise.all([
      (prisma as any).achievement.findMany({ orderBy: { xpReward: 'asc' } }),
      (prisma as any).userAchievement.findMany({
        where: { userId: user.id },
        select: { achievementId: true, unlockedAt: true },
      }),
    ]);

    const unlockedMap = new Map(userAchievements.map((ua: any) => [ua.achievementId, ua.unlockedAt]));

    const response = allAchievements.map((ach: any) => ({
      ...ach,
      isUnlocked: unlockedMap.has(ach.id),
      unlockedAt: unlockedMap.get(ach.id) || null,
    }));

    return reply.send({ data: response });
  });

  // User XP Transactions Audit Log
  fastify.get('/users/:id/xp-transactions', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = (request as any).user;

    // Aluno só pode ver o próprio extrato; Professor/Admin pode auditar qualquer um
    if (user.role === 'STUDENT' && user.id !== id) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Você não tem permissão para auditar o extrato de outro aluno.' });
    }

    const transactions = await (prisma as any).xPTransaction.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return reply.send({ data: transactions });
  });
}
