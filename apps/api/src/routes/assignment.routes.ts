import { FastifyInstance } from 'fastify';
import { prisma } from '../plugins/prisma.js';
import { authenticate } from '../middlewares/authenticate.js';
import { requireRole } from '../middlewares/requireRole.js';
import { createAssignmentSchema, updateAssignmentSchema } from '@fatecode/shared';
import { z } from 'zod';

export async function assignmentRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: [authenticate] }, async (request, reply) => {
    const querySchema = z.object({
      classId: z.string().optional(),
      module: z.enum(['PROGRAMMING', 'SUBJECTS']).optional(),
    });

    const parsed = querySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation Error', details: parsed.error.errors });
    }

    const user = (request as any).user;
    const where: any = {};

    if (parsed.data.classId) {
      where.classId = parsed.data.classId;
    } else if (user.role === 'STUDENT') {
      where.class = { members: { some: { userId: user.id } } };
    }

    if (parsed.data.module === 'PROGRAMMING') where.challengeId = { not: null };
    if (parsed.data.module === 'SUBJECTS') where.academicExerciseId = { not: null };

    const assignments = await (prisma as any).assignment.findMany({
      where,
      include: {
        class: {
          select: { id: true, name: true, code: true, semester: true, year: true },
        },
        challenge: {
          select: {
            id: true,
            title: true,
            slug: true,
            difficulty: true,
            language: true,
            tags: true,
            xpReward: true,
          },
        },
        academicExercise: {
          select: {
            id: true,
            title: true,
            slug: true,
            subject: true,
            exerciseType: true,
            difficulty: true,
            tags: true,
            xpReward: true,
          },
        },
        _count: {
          select: { submissions: true, academicSubmissions: true },
        },
      },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
    });

    return reply.send({ data: assignments });
  });

  fastify.get('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const assignment = await (prisma as any).assignment.findUnique({
      where: { id },
      include: {
        class: { include: { course: true } },
        challenge: {
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            difficulty: true,
            language: true,
            initialCode: true,
            publicTests: true,
            tags: true,
            xpReward: true,
          },
        },
        academicExercise: {
          select: {
            id: true,
            title: true,
            slug: true,
            statement: true,
            subject: true,
            exerciseType: true,
            difficulty: true,
            options: true,
            tags: true,
            xpReward: true,
          },
        },
      },
    });

    if (!assignment) {
      return reply.status(404).send({ error: 'Not Found', message: 'Atividade não encontrada.' });
    }

    return reply.send({ data: assignment });
  });

  fastify.post(
    '/',
    { preHandler: [authenticate, requireRole(['ADMIN', 'PROFESSOR'])] },
    async (request, reply) => {
      const parsed = createAssignmentSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Validation Error', details: parsed.error.errors });
      }

      const classExists = await (prisma as any).class.findUnique({ where: { id: parsed.data.classId } });
      if (!classExists) {
        return reply.status(404).send({ error: 'Not Found', message: 'Turma não encontrada.' });
      }

      if (parsed.data.challengeId) {
        const challenge = await (prisma as any).challenge.findUnique({ where: { id: parsed.data.challengeId } });
        if (!challenge) {
          return reply.status(404).send({ error: 'Not Found', message: 'Desafio de programação não encontrado.' });
        }
      }

      if (parsed.data.academicExerciseId) {
        const exercise = await (prisma as any).academicExercise.findUnique({ where: { id: parsed.data.academicExerciseId } });
        if (!exercise) {
          return reply.status(404).send({ error: 'Not Found', message: 'Exercício de disciplina não encontrado.' });
        }
      }

      const assignment = await (prisma as any).assignment.create({
        data: {
          title: parsed.data.title,
          classId: parsed.data.classId,
          challengeId: parsed.data.challengeId || null,
          academicExerciseId: parsed.data.academicExerciseId || null,
          startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : new Date(),
          dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
          isOptional: parsed.data.isOptional,
        },
        include: {
          class: true,
          challenge: true,
          academicExercise: true,
        },
      });

      return reply.status(201).send({ message: 'Atividade vinculada à turma com sucesso.', data: assignment });
    }
  );

  fastify.put(
    '/:id',
    { preHandler: [authenticate, requireRole(['ADMIN', 'PROFESSOR'])] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const parsed = updateAssignmentSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Validation Error', details: parsed.error.errors });
      }

      const updated = await (prisma as any).assignment.update({
        where: { id },
        data: {
          ...(parsed.data.title && { title: parsed.data.title }),
          ...(parsed.data.startDate && { startDate: new Date(parsed.data.startDate) }),
          ...(parsed.data.dueDate !== undefined && {
            dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
          }),
          ...(parsed.data.isOptional !== undefined && { isOptional: parsed.data.isOptional }),
        },
      });

      return reply.send({ message: 'Atividade atualizada com sucesso.', data: updated });
    }
  );

  fastify.delete(
    '/:id',
    { preHandler: [authenticate, requireRole(['ADMIN', 'PROFESSOR'])] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      await (prisma as any).assignment.delete({ where: { id } });
      return reply.send({ message: 'Atividade removida com sucesso.' });
    }
  );
}
