import { FastifyInstance } from 'fastify';
import { prisma } from '../plugins/prisma.js';
import { authenticate } from '../middlewares/authenticate.js';
import { ExecutionService } from '../services/execution.service.js';
import { z } from 'zod';

async function ensureRecentSession(userId: string, challengeId: string) {
  const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
  const existing = await (prisma as any).developmentEvent.findFirst({
    where: {
      userId,
      challengeId,
      eventType: 'SESSION_STARTED',
      timestamp: { gte: fourHoursAgo },
    },
    orderBy: { timestamp: 'desc' },
  });

  if (!existing) {
    await (prisma as any).developmentEvent.create({
      data: { userId, challengeId, eventType: 'SESSION_STARTED' },
    });
  }
}

async function resolveAssignmentId(userId: string, challengeId: string, requestedAssignmentId?: string | null) {
  if (requestedAssignmentId) {
    const assignment = await (prisma as any).assignment.findFirst({
      where: {
        id: requestedAssignmentId,
        challengeId,
        class: { members: { some: { userId, role: 'STUDENT' } } },
      },
      select: { id: true },
    });
    return assignment?.id || null;
  }

  const now = new Date();
  const candidates = await (prisma as any).assignment.findMany({
    where: {
      challengeId,
      startDate: { lte: now },
      OR: [{ dueDate: null }, { dueDate: { gte: now } }],
      class: { members: { some: { userId, role: 'STUDENT' } } },
    },
    select: { id: true },
    take: 2,
  });

  return candidates.length === 1 ? candidates[0].id : null;
}

export async function executionRoutes(fastify: FastifyInstance) {
  fastify.post('/challenges/:id/execute', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = (request as any).user;
    const schema = z.object({
      code: z.string().min(1, 'O código é obrigatório'),
      language: z.enum(['JAVASCRIPT', 'TYPESCRIPT', 'PYTHON', 'JAVA', 'C', 'CPP']).default('JAVASCRIPT'),
    });

    const parsed = schema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: 'Validation Error', details: parsed.error.errors });

    const challenge = await (prisma as any).challenge.findFirst({ where: { OR: [{ id }, { slug: id }] } });
    if (!challenge) return reply.status(404).send({ error: 'Not Found', message: 'Desafio não encontrado.' });

    await ensureRecentSession(user.id, challenge.id);
    const publicTests = (challenge.publicTests as any[]) || [];
    const executionResult = await ExecutionService.run(parsed.data.code, publicTests, parsed.data.language);
    return reply.send({ data: executionResult });
  });

  fastify.post('/challenges/:id/submit', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = (request as any).user;
    const schema = z.object({
      code: z.string().min(1, 'O código é obrigatório'),
      language: z.enum(['JAVASCRIPT', 'TYPESCRIPT', 'PYTHON', 'JAVA', 'C', 'CPP']).default('JAVASCRIPT'),
      assignmentId: z.string().uuid().optional().nullable(),
    });

    const parsed = schema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: 'Validation Error', details: parsed.error.errors });

    const challenge = await (prisma as any).challenge.findFirst({ where: { OR: [{ id }, { slug: id }] } });
    if (!challenge) return reply.status(404).send({ error: 'Not Found', message: 'Desafio não encontrado.' });

    await ensureRecentSession(user.id, challenge.id);
    const assignmentId = await resolveAssignmentId(user.id, challenge.id, parsed.data.assignmentId);
    const publicTests = (challenge.publicTests as any[]) || [];
    const hiddenTests = (challenge.hiddenTests as any[]) || [];
    const execution = await ExecutionService.run(parsed.data.code, [...publicTests, ...hiddenTests], parsed.data.language);

    const isAccepted = execution.success;
    let xpEarned = 0;
    const previousAccepted = await (prisma as any).submission.findFirst({
      where: { userId: user.id, challengeId: challenge.id, status: 'ACCEPTED' },
    });

    if (isAccepted && !previousAccepted) {
      xpEarned = challenge.xpReward;
      await (prisma as any).xPTransaction.create({
        data: { userId: user.id, amount: xpEarned, reason: `Conclusão do desafio "${challenge.title}"`, referenceId: challenge.id },
      });
      await (prisma as any).profile.upsert({
        where: { userId: user.id },
        create: { userId: user.id, totalXP: xpEarned },
        update: { totalXP: { increment: xpEarned } },
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const userStreak = await (prisma as any).streak.findUnique({ where: { userId: user.id } });
      if (!userStreak) {
        await (prisma as any).streak.create({ data: { userId: user.id, currentStreak: 1, maxStreak: 1, lastActivityDate: today } });
      } else {
        const lastDate = userStreak.lastActivityDate ? new Date(userStreak.lastActivityDate) : null;
        if (lastDate) lastDate.setHours(0, 0, 0, 0);
        const diffTime = lastDate ? today.getTime() - lastDate.getTime() : null;
        const diffDays = diffTime !== null ? Math.round(diffTime / (1000 * 3600 * 24)) : null;
        if (diffDays === 1) {
          const newCurrent = userStreak.currentStreak + 1;
          await (prisma as any).streak.update({
            where: { userId: user.id },
            data: { currentStreak: newCurrent, maxStreak: Math.max(newCurrent, userStreak.maxStreak), lastActivityDate: today },
          });
        } else if (diffDays !== 0) {
          await (prisma as any).streak.update({
            where: { userId: user.id },
            data: { currentStreak: 1, maxStreak: Math.max(1, userStreak.maxStreak), lastActivityDate: today },
          });
        }
      }
    }

    const submission = await (prisma as any).submission.create({
      data: {
        userId: user.id,
        challengeId: challenge.id,
        assignmentId,
        code: parsed.data.code,
        language: parsed.data.language,
        status: execution.status,
        passedTests: execution.passedTests,
        totalTests: execution.totalTests,
        executionTimeMs: execution.executionTimeMs,
        xpEarned,
      },
    });

    const updatedProfile = await (prisma as any).profile.findUnique({ where: { userId: user.id } });
    const updatedStreak = await (prisma as any).streak.findUnique({ where: { userId: user.id } });

    return reply.send({
      success: isAccepted,
      status: execution.status,
      passedTests: execution.passedTests,
      totalTests: execution.totalTests,
      executionTimeMs: execution.executionTimeMs,
      testResults: execution.testResults.slice(0, publicTests.length),
      hiddenTestsCount: hiddenTests.length,
      xpEarned,
      newTotalXP: updatedProfile?.totalXP || 0,
      currentStreak: updatedStreak?.currentStreak || 0,
      assignmentId,
      stdout: execution.stdout,
      stderr: execution.stderr,
      submissionId: submission.id,
      message: isAccepted
        ? (previousAccepted ? '✓ Desafio concluído com sucesso! (XP já concedido anteriormente)' : `🎉 DESAFIO CONCLUÍDO! +${xpEarned} XP`)
        : execution.status === 'COMPILATION_ERROR' || execution.status === 'RUNTIME_ERROR'
          ? execution.stderr || 'Não foi possível executar a solução.'
          : 'Alguns testes falharam. Revise sua lógica e tente novamente.',
    });
  });

  fastify.get('/challenges/:id/submissions', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = (request as any).user;
    const challenge = await (prisma as any).challenge.findFirst({ where: { OR: [{ id }, { slug: id }] } });
    if (!challenge) return reply.status(404).send({ error: 'Not Found', message: 'Desafio não encontrado.' });

    const submissions = await (prisma as any).submission.findMany({
      where: { userId: user.id, challengeId: challenge.id },
      orderBy: { submittedAt: 'desc' },
      take: 20,
    });
    return reply.send({ data: submissions });
  });
}
