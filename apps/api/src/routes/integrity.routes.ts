import { FastifyInstance } from 'fastify';
import { prisma } from '../plugins/prisma.js';
import { authenticate } from '../middlewares/authenticate.js';
import { requireRole } from '../middlewares/requireRole.js';
import { IntegrityAnalysisService } from '../services/integrity.service.js';
import { z } from 'zod';

async function teacherCanAccessClass(userId: string, classId: string) {
  const membership = await (prisma as any).classMember.findFirst({
    where: {
      classId,
      userId,
      role: { in: ['PROFESSOR', 'ASSISTANT'] },
    },
    select: { id: true },
  });
  return Boolean(membership);
}

export async function integrityRoutes(fastify: FastifyInstance) {
  // Record Development Event from Editor
  fastify.post('/challenges/:id/events', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = (request as any).user;

    const schema = z.object({
      eventType: z.enum([
        'SESSION_STARTED',
        'CODE_CHANGED',
        'CODE_SAVED',
        'CODE_EXECUTED',
        'TEST_FAILED',
        'TEST_PASSED',
        'CODE_SUBMITTED',
        'SESSION_ENDED',
      ]),
      metadata: z.any().optional(),
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

    const event = await (prisma as any).developmentEvent.create({
      data: {
        userId: user.id,
        challengeId: challenge.id,
        eventType: parsed.data.eventType,
        metadata: parsed.data.metadata || null,
      },
    });

    return reply.status(201).send({ status: 'ok', eventId: event.id });
  });

  // Get Submission Integrity Analysis (Professor or Admin only)
  fastify.get(
    '/submissions/:id/integrity',
    { preHandler: [authenticate, requireRole(['ADMIN', 'PROFESSOR'])] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const user = (request as any).user;

      const submission = await (prisma as any).submission.findUnique({
        where: { id },
        select: {
          id: true,
          assignment: {
            select: { classId: true },
          },
        },
      });

      if (!submission) {
        return reply.status(404).send({ error: 'Not Found', message: 'Submissão não encontrada.' });
      }

      if (user.role !== 'ADMIN') {
        const classId = submission.assignment?.classId;
        if (!classId || !(await teacherCanAccessClass(user.id, classId))) {
          return reply.status(403).send({ error: 'Forbidden', message: 'Você não tem acesso a esta submissão acadêmica.' });
        }
      }

      try {
        const report = await IntegrityAnalysisService.analyzeSubmission(id);
        return reply.send({ data: report });
      } catch (err: any) {
        return reply.status(404).send({ error: 'Not Found', message: err.message });
      }
    }
  );

  // Get Class Development & Submissions Monitoring (Professor or Admin only)
  fastify.get(
    '/classes/:id/integrity-summary',
    { preHandler: [authenticate, requireRole(['ADMIN', 'PROFESSOR'])] },
    async (request, reply) => {
      const { id: classId } = request.params as { id: string };
      const user = (request as any).user;

      if (user.role !== 'ADMIN' && !(await teacherCanAccessClass(user.id, classId))) {
        return reply.status(403).send({ error: 'Forbidden', message: 'Você não está vinculado a esta turma.' });
      }

      const submissions = await (prisma as any).submission.findMany({
        where: {
          assignment: { classId },
        },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          challenge: {
            select: { id: true, title: true, difficulty: true },
          },
          integrityAnalysis: true,
        },
        orderBy: { submittedAt: 'desc' },
        take: 30,
      });

      return reply.send({ data: submissions });
    }
  );
}
