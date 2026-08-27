import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../plugins/prisma.js';
import { authenticate } from '../middlewares/authenticate.js';
import { requireRole } from '../middlewares/requireRole.js';
import {
  createAcademicExerciseSchema,
  updateAcademicExerciseSchema,
  submitAcademicExerciseSchema,
} from '@fatecode/shared';
import { AcademicCatalogService } from '../services/academicCatalog.service.js';

function normalizeText(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

function evaluateAnswer(exercise: any, answer: unknown): { isCorrect: boolean; score: number } {
  switch (exercise.exerciseType) {
    case 'TRUE_FALSE': {
      const normalized = typeof answer === 'boolean'
        ? answer
        : ['true', 'verdadeiro', '1'].includes(normalizeText(answer));
      const expected = Boolean(exercise.correctAnswer);
      return { isCorrect: normalized === expected, score: normalized === expected ? 100 : 0 };
    }

    case 'NUMERIC': {
      const actual = Number(String(answer).replace(',', '.'));
      const expected = Number(exercise.correctAnswer);
      const tolerance = Number(exercise.numericTolerance ?? 0);
      const isCorrect = Number.isFinite(actual) && Number.isFinite(expected) && Math.abs(actual - expected) <= tolerance;
      return { isCorrect, score: isCorrect ? 100 : 0 };
    }

    case 'SHORT_TEXT': {
      const accepted = Array.isArray(exercise.correctAnswer) ? exercise.correctAnswer : [exercise.correctAnswer];
      const normalized = normalizeText(answer);
      const isCorrect = accepted.some((candidate: unknown) => normalizeText(candidate) === normalized);
      return { isCorrect, score: isCorrect ? 100 : 0 };
    }

    case 'MULTIPLE_CHOICE':
    default: {
      const isCorrect = normalizeText(answer) === normalizeText(exercise.correctAnswer);
      return { isCorrect, score: isCorrect ? 100 : 0 };
    }
  }
}

async function updateStreak(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const current = await (prisma as any).streak.findUnique({ where: { userId } });
  if (!current) {
    await (prisma as any).streak.create({
      data: { userId, currentStreak: 1, maxStreak: 1, lastActivityDate: today },
    });
    return;
  }

  const last = current.lastActivityDate ? new Date(current.lastActivityDate) : null;
  if (last) last.setHours(0, 0, 0, 0);
  const diffDays = last ? Math.round((today.getTime() - last.getTime()) / 86400000) : null;

  if (diffDays === 0) return;
  if (diffDays === 1) {
    const next = current.currentStreak + 1;
    await (prisma as any).streak.update({
      where: { userId },
      data: { currentStreak: next, maxStreak: Math.max(next, current.maxStreak), lastActivityDate: today },
    });
    return;
  }

  await (prisma as any).streak.update({
    where: { userId },
    data: { currentStreak: 1, maxStreak: Math.max(1, current.maxStreak), lastActivityDate: today },
  });
}

export async function academicExerciseRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: [authenticate] }, async (request, reply) => {
    const querySchema = z.object({
      subject: z.enum([
        'DISCRETE_MATHEMATICS',
        'PROGRAMMING_LOGIC',
        'CALCULUS',
        'STATISTICS',
        'OPERATIONS_RESEARCH',
        'OTHER',
      ]).optional(),
      difficulty: z.enum(['BASIC', 'INTERMEDIATE', 'ADVANCED']).optional(),
      exerciseType: z.enum(['MULTIPLE_CHOICE', 'TRUE_FALSE', 'NUMERIC', 'SHORT_TEXT']).optional(),
      search: z.string().optional(),
      tag: z.string().optional(),
      published: z.enum(['true', 'false']).optional(),
    });

    const parsed = querySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation Error', details: parsed.error.errors });
    }

    const user = (request as any).user;
    const elevated = user.role === 'ADMIN' || user.role === 'PROFESSOR';
    const where: any = {};

    if (parsed.data.subject) where.subject = parsed.data.subject;
    if (parsed.data.difficulty) where.difficulty = parsed.data.difficulty;
    if (parsed.data.exerciseType) where.exerciseType = parsed.data.exerciseType;
    if (parsed.data.tag) where.tags = { has: parsed.data.tag };
    if (parsed.data.search) {
      where.OR = [
        { title: { contains: parsed.data.search, mode: 'insensitive' } },
        { statement: { contains: parsed.data.search, mode: 'insensitive' } },
      ];
    }

    if (!elevated) {
      where.isPublished = true;
    } else if (parsed.data.published) {
      where.isPublished = parsed.data.published === 'true';
    }

    const exercises = await (prisma as any).academicExercise.findMany({
      where,
      orderBy: [{ subject: 'asc' }, { difficulty: 'asc' }, { title: 'asc' }],
    });

    const safe = exercises.map((exercise: any) => {
      if (elevated) return exercise;
      const { correctAnswer: _correct, explanation: _explanation, numericTolerance: _tolerance, ...rest } = exercise;
      return rest;
    });

    return reply.send({ data: safe });
  });

  fastify.get('/:idOrSlug', { preHandler: [authenticate] }, async (request, reply) => {
    const { idOrSlug } = request.params as { idOrSlug: string };
    const user = (request as any).user;
    const elevated = user.role === 'ADMIN' || user.role === 'PROFESSOR';

    const exercise = await (prisma as any).academicExercise.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    });

    if (!exercise || (!elevated && !exercise.isPublished)) {
      return reply.status(404).send({ error: 'Not Found', message: 'Exercício não encontrado.' });
    }

    if (elevated) return reply.send({ data: exercise });
    const { correctAnswer: _correct, explanation: _explanation, numericTolerance: _tolerance, ...safe } = exercise;
    return reply.send({ data: safe });
  });

  fastify.post(
    '/',
    { preHandler: [authenticate, requireRole(['ADMIN', 'PROFESSOR'])] },
    async (request, reply) => {
      const parsed = createAcademicExerciseSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Validation Error', details: parsed.error.errors });
      }

      const existing = await (prisma as any).academicExercise.findUnique({ where: { slug: parsed.data.slug.toLowerCase() } });
      if (existing) {
        return reply.status(409).send({ error: 'Conflict', message: 'Já existe um exercício com este slug.' });
      }

      const created = await (prisma as any).academicExercise.create({
        data: { ...parsed.data, slug: parsed.data.slug.toLowerCase() },
      });

      return reply.status(201).send({ message: 'Exercício criado com sucesso.', data: created });
    }
  );

  fastify.put(
    '/:id',
    { preHandler: [authenticate, requireRole(['ADMIN', 'PROFESSOR'])] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const parsed = updateAcademicExerciseSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Validation Error', details: parsed.error.errors });
      }

      const updated = await (prisma as any).academicExercise.update({
        where: { id },
        data: {
          ...parsed.data,
          ...(parsed.data.slug ? { slug: parsed.data.slug.toLowerCase() } : {}),
        },
      });

      return reply.send({ message: 'Exercício atualizado com sucesso.', data: updated });
    }
  );

  fastify.delete(
    '/:id',
    { preHandler: [authenticate, requireRole(['ADMIN', 'PROFESSOR'])] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      await (prisma as any).academicExercise.delete({ where: { id } });
      return reply.send({ message: 'Exercício removido com sucesso.' });
    }
  );

  fastify.post(
    '/seed-validation',
    { preHandler: [authenticate, requireRole(['ADMIN', 'PROFESSOR'])] },
    async (_request, reply) => {
      const result = await AcademicCatalogService.seedValidationCatalog();
      return reply.send({
        message: `${result.created} exercício(s) adicionados. Catálogo de validação: ${result.total}.`,
        data: result,
      });
    }
  );

  fastify.post('/:idOrSlug/submit', { preHandler: [authenticate] }, async (request, reply) => {
    const { idOrSlug } = request.params as { idOrSlug: string };
    const user = (request as any).user;
    const parsed = submitAcademicExerciseSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation Error', details: parsed.error.errors });
    }

    const exercise = await (prisma as any).academicExercise.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    });

    if (!exercise || (!exercise.isPublished && user.role === 'STUDENT')) {
      return reply.status(404).send({ error: 'Not Found', message: 'Exercício não encontrado.' });
    }

    let assignmentId = parsed.data.assignmentId || null;

    if (assignmentId) {
      const assignment = await (prisma as any).assignment.findFirst({
        where: {
          id: assignmentId,
          academicExerciseId: exercise.id,
          class: { members: { some: { userId: user.id } } },
        },
      });
      if (!assignment && user.role === 'STUDENT') {
        return reply.status(403).send({ error: 'Forbidden', message: 'Esta atividade não pertence a uma turma do aluno.' });
      }
    } else if (user.role === 'STUDENT') {
      const now = new Date();
      const candidates = await (prisma as any).assignment.findMany({
        where: {
          academicExerciseId: exercise.id,
          startDate: { lte: now },
          OR: [{ dueDate: null }, { dueDate: { gte: now } }],
          class: { members: { some: { userId: user.id } } },
        },
        select: { id: true },
        take: 2,
      });
      if (candidates.length === 1) assignmentId = candidates[0].id;
    }

    const evaluation = evaluateAnswer(exercise, parsed.data.answer);
    const previousCorrect = await (prisma as any).academicSubmission.findFirst({
      where: { userId: user.id, exerciseId: exercise.id, isCorrect: true },
    });

    let xpEarned = 0;
    if (evaluation.isCorrect && !previousCorrect) {
      xpEarned = exercise.xpReward;
      await (prisma as any).xPTransaction.create({
        data: {
          userId: user.id,
          amount: xpEarned,
          reason: `Conclusão do exercício "${exercise.title}"`,
          referenceId: exercise.id,
        },
      });
      await (prisma as any).profile.upsert({
        where: { userId: user.id },
        create: { userId: user.id, totalXP: xpEarned },
        update: { totalXP: { increment: xpEarned } },
      });
      await updateStreak(user.id);
    }

    const submission = await (prisma as any).academicSubmission.create({
      data: {
        userId: user.id,
        exerciseId: exercise.id,
        assignmentId,
        answer: parsed.data.answer,
        isCorrect: evaluation.isCorrect,
        score: evaluation.score,
        xpEarned,
      },
    });

    return reply.send({
      success: evaluation.isCorrect,
      isCorrect: evaluation.isCorrect,
      score: evaluation.score,
      xpEarned,
      submissionId: submission.id,
      explanation: exercise.explanation || null,
      correctAnswer: exercise.correctAnswer,
      message: evaluation.isCorrect
        ? previousCorrect
          ? 'Resposta correta! Este exercício já havia concedido XP anteriormente.'
          : `Resposta correta! +${xpEarned} XP`
        : 'Resposta incorreta. Revise o raciocínio e tente novamente.',
    });
  });

  fastify.get('/:idOrSlug/submissions', { preHandler: [authenticate] }, async (request, reply) => {
    const { idOrSlug } = request.params as { idOrSlug: string };
    const user = (request as any).user;
    const exercise = await (prisma as any).academicExercise.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      select: { id: true },
    });

    if (!exercise) {
      return reply.status(404).send({ error: 'Not Found', message: 'Exercício não encontrado.' });
    }

    const submissions = await (prisma as any).academicSubmission.findMany({
      where: { userId: user.id, exerciseId: exercise.id },
      orderBy: { submittedAt: 'desc' },
      take: 20,
    });

    return reply.send({ data: submissions });
  });
}
