import { FastifyInstance } from 'fastify';
import { prisma } from '../plugins/prisma.js';
import { authenticate } from '../middlewares/authenticate.js';
import { ExecutionService } from '../services/execution.service.js';
import { z } from 'zod';

export async function executionRoutes(fastify: FastifyInstance) {
  // Execute Public Tests (Fast test runner in editor)
  fastify.post('/challenges/:id/execute', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const schema = z.object({
      code: z.string().min(1, 'O código é obrigatório'),
      language: z.enum(['JAVASCRIPT', 'TYPESCRIPT', 'PYTHON', 'JAVA', 'C', 'CPP']).default('JAVASCRIPT'),
    });

    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation Error', details: parsed.error.errors });
    }

    const challenge = await (prisma as any).challenge.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });

    if (!challenge) {
      return reply.status(404).send({ error: 'Not Found', message: 'Desafio não encontrado.' });
    }

    const publicTests = (challenge.publicTests as any[]) || [];
    const executionResult = await ExecutionService.runJavaScript(parsed.data.code, publicTests);

    return reply.send({
      data: executionResult,
    });
  });

  // Submit Solution (Full evaluation with hidden tests + Gamification XP & Streak)
  fastify.post('/challenges/:id/submit', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = (request as any).user;

    const schema = z.object({
      code: z.string().min(1, 'O código é obrigatório'),
      language: z.enum(['JAVASCRIPT', 'TYPESCRIPT', 'PYTHON', 'JAVA', 'C', 'CPP']).default('JAVASCRIPT'),
      assignmentId: z.string().uuid().optional().nullable(),
    });

    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation Error', details: parsed.error.errors });
    }

    const challenge = await (prisma as any).challenge.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });

    if (!challenge) {
      return reply.status(404).send({ error: 'Not Found', message: 'Desafio não encontrado.' });
    }

    const publicTests = (challenge.publicTests as any[]) || [];
    const hiddenTests = (challenge.hiddenTests as any[]) || [];
    const allTests = [...publicTests, ...hiddenTests];

    // Run execution against all test cases
    const execution = await ExecutionService.runJavaScript(parsed.data.code, allTests);

    const isAccepted = execution.success;
    let xpEarned = 0;

    // Check if user has already received XP for this challenge
    const previousAccepted = await (prisma as any).submission.findFirst({
      where: {
        userId: user.id,
        challengeId: challenge.id,
        status: 'ACCEPTED',
      },
    });

    // If accepted and not previously solved, grant XP & update streak
    if (isAccepted && !previousAccepted) {
      xpEarned = challenge.xpReward;

      // 1. Create XP Transaction
      await (prisma as any).xPTransaction.create({
        data: {
          userId: user.id,
          amount: xpEarned,
          reason: `Conclusão do desafio "${challenge.title}"`,
          referenceId: challenge.id,
        },
      });

      // 2. Increment Profile totalXP
      await (prisma as any).profile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          totalXP: xpEarned,
        },
        update: {
          totalXP: {
            increment: xpEarned,
          },
        },
      });

      // 3. Update Streak
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const userStreak = await (prisma as any).streak.findUnique({
        where: { userId: user.id },
      });

      if (!userStreak) {
        await (prisma as any).streak.create({
          data: {
            userId: user.id,
            currentStreak: 1,
            maxStreak: 1,
            lastActivityDate: today,
          },
        });
      } else {
        const lastDate = userStreak.lastActivityDate ? new Date(userStreak.lastActivityDate) : null;
        if (lastDate) lastDate.setHours(0, 0, 0, 0);

        const diffTime = lastDate ? today.getTime() - lastDate.getTime() : null;
        const diffDays = diffTime !== null ? Math.round(diffTime / (1000 * 3600 * 24)) : null;

        if (diffDays === 0) {
          // Already active today, streak unchanged
        } else if (diffDays === 1) {
          // Active consecutive day -> Increment streak
          const newCurrent = userStreak.currentStreak + 1;
          await (prisma as any).streak.update({
            where: { userId: user.id },
            data: {
              currentStreak: newCurrent,
              maxStreak: Math.max(newCurrent, userStreak.maxStreak),
              lastActivityDate: today,
            },
          });
        } else {
          // Streak broken -> reset to 1
          await (prisma as any).streak.update({
            where: { userId: user.id },
            data: {
              currentStreak: 1,
              maxStreak: Math.max(1, userStreak.maxStreak),
              lastActivityDate: today,
            },
          });
        }
      }
    }

    // Register Submission
    const submission = await (prisma as any).submission.create({
      data: {
        userId: user.id,
        challengeId: challenge.id,
        assignmentId: parsed.data.assignmentId || null,
        code: parsed.data.code,
        language: parsed.data.language,
        status: execution.status,
        passedTests: execution.passedTests,
        totalTests: execution.totalTests,
        executionTimeMs: execution.executionTimeMs,
        xpEarned,
      },
    });

    // Fetch updated user profile
    const updatedProfile = await (prisma as any).profile.findUnique({
      where: { userId: user.id },
    });
    const updatedStreak = await (prisma as any).streak.findUnique({
      where: { userId: user.id },
    });

    return reply.send({
      success: isAccepted,
      status: execution.status,
      passedTests: execution.passedTests,
      totalTests: execution.totalTests,
      executionTimeMs: execution.executionTimeMs,
      xpEarned,
      newTotalXP: updatedProfile?.totalXP || 0,
      currentStreak: updatedStreak?.currentStreak || 0,
      stdout: execution.stdout,
      stderr: execution.stderr,
      submissionId: submission.id,
      message: isAccepted
        ? (previousAccepted
            ? '✓ Desafio concluído com sucesso! (XP já concedido anteriormente)'
            : `🎉 DESAFIO CONCLUÍDO! +${xpEarned} XP`)
        : 'Alguns testes falharam. Revise sua lógica e tente novamente.',
    });
  });

  // Get Submissions for Challenge
  fastify.get('/challenges/:id/submissions', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = (request as any).user;

    const challenge = await (prisma as any).challenge.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });

    if (!challenge) {
      return reply.status(404).send({ error: 'Not Found', message: 'Desafio não encontrado.' });
    }

    const submissions = await (prisma as any).submission.findMany({
      where: {
        userId: user.id,
        challengeId: challenge.id,
      },
      orderBy: { submittedAt: 'desc' },
      take: 20,
    });

    return reply.send({ data: submissions });
  });
}
