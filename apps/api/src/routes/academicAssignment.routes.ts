import { FastifyInstance } from 'fastify';
import { prisma } from '../plugins/prisma.js';
import { authenticate } from '../middlewares/authenticate.js';
import { requireRole } from '../middlewares/requireRole.js';
import { createAcademicAssignmentSchema, updateAcademicAssignmentSchema } from '@fatecode/shared';
import { z } from 'zod';

async function canManageClass(user: any, classId: string) {
  if (user.role === 'ADMIN') return true;
  if (user.role !== 'PROFESSOR') return false;

  const membership = await (prisma as any).classMember.findFirst({
    where: {
      classId,
      userId: user.id,
      role: { in: ['PROFESSOR', 'ASSISTANT'] },
    },
    select: { id: true },
  });

  return Boolean(membership);
}

export async function academicAssignmentRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: [authenticate] }, async (request, reply) => {
    const parsed = z.object({ classId: z.string().uuid().optional() }).safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation Error', details: parsed.error.errors });
    }

    const user = (request as any).user;
    const where: any = {};

    if (parsed.data.classId) {
      where.classId = parsed.data.classId;
    }

    if (user.role === 'STUDENT') {
      where.class = { members: { some: { userId: user.id } } };
    } else if (user.role === 'PROFESSOR' && !parsed.data.classId) {
      where.class = {
        members: {
          some: {
            userId: user.id,
            role: { in: ['PROFESSOR', 'ASSISTANT'] },
          },
        },
      };
    } else if (user.role === 'PROFESSOR' && parsed.data.classId) {
      const allowed = await canManageClass(user, parsed.data.classId);
      if (!allowed) {
        return reply.status(403).send({ error: 'Forbidden', message: 'Professor não vinculado a esta turma.' });
      }
    }

    const assignments = await (prisma as any).academicAssignment.findMany({
      where,
      include: {
        class: {
          select: { id: true, name: true, code: true, semester: true, year: true },
        },
        exercise: {
          select: {
            id: true,
            title: true,
            slug: true,
            subject: true,
            exerciseType: true,
            difficulty: true,
            tags: true,
            xpReward: true,
            isPublished: true,
          },
        },
        _count: { select: { submissions: true } },
      },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
    });

    return reply.send({ data: assignments });
  });

  fastify.get('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = (request as any).user;

    const assignment = await (prisma as any).academicAssignment.findUnique({
      where: { id },
      include: {
        class: {
          include: { course: true },
        },
        exercise: {
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
            isPublished: true,
          },
        },
      },
    });

    if (!assignment) {
      return reply.status(404).send({ error: 'Not Found', message: 'Atividade não encontrada.' });
    }

    if (user.role === 'STUDENT') {
      const membership = await (prisma as any).classMember.findUnique({
        where: { classId_userId: { classId: assignment.classId, userId: user.id } },
      });
      if (!membership) {
        return reply.status(403).send({ error: 'Forbidden', message: 'Atividade não pertence a uma turma do aluno.' });
      }
    } else if (user.role === 'PROFESSOR' && !(await canManageClass(user, assignment.classId))) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Professor não vinculado a esta turma.' });
    }

    return reply.send({ data: assignment });
  });

  fastify.post(
    '/',
    { preHandler: [authenticate, requireRole(['ADMIN', 'PROFESSOR'])] },
    async (request, reply) => {
      const user = (request as any).user;
      const parsed = createAcademicAssignmentSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Validation Error', details: parsed.error.errors });
      }

      const classExists = await (prisma as any).class.findUnique({ where: { id: parsed.data.classId } });
      if (!classExists) {
        return reply.status(404).send({ error: 'Not Found', message: 'Turma não encontrada.' });
      }

      if (!(await canManageClass(user, parsed.data.classId))) {
        return reply.status(403).send({ error: 'Forbidden', message: 'Professor não vinculado a esta turma.' });
      }

      const exercise = await (prisma as any).academicExercise.findUnique({ where: { id: parsed.data.exerciseId } });
      if (!exercise) {
        return reply.status(404).send({ error: 'Not Found', message: 'Exercício de Matemática Discreta não encontrado.' });
      }

      const assignment = await (prisma as any).academicAssignment.create({
        data: {
          title: parsed.data.title,
          classId: parsed.data.classId,
          exerciseId: parsed.data.exerciseId,
          startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : new Date(),
          dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
          isOptional: parsed.data.isOptional,
        },
        include: { class: true, exercise: true },
      });

      return reply.status(201).send({ message: 'Atividade de Matemática Discreta criada.', data: assignment });
    }
  );

  fastify.put(
    '/:id',
    { preHandler: [authenticate, requireRole(['ADMIN', 'PROFESSOR'])] },
    async (request, reply) => {
      const user = (request as any).user;
      const { id } = request.params as { id: string };
      const parsed = updateAcademicAssignmentSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Validation Error', details: parsed.error.errors });
      }

      const current = await (prisma as any).academicAssignment.findUnique({ where: { id } });
      if (!current) {
        return reply.status(404).send({ error: 'Not Found', message: 'Atividade não encontrada.' });
      }
      if (!(await canManageClass(user, current.classId))) {
        return reply.status(403).send({ error: 'Forbidden', message: 'Professor não vinculado a esta turma.' });
      }

      const updated = await (prisma as any).academicAssignment.update({
        where: { id },
        data: {
          ...(parsed.data.title && { title: parsed.data.title }),
          ...(parsed.data.startDate && { startDate: new Date(parsed.data.startDate) }),
          ...(parsed.data.dueDate !== undefined && { dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null }),
          ...(parsed.data.isOptional !== undefined && { isOptional: parsed.data.isOptional }),
        },
      });

      return reply.send({ message: 'Atividade atualizada.', data: updated });
    }
  );

  fastify.delete(
    '/:id',
    { preHandler: [authenticate, requireRole(['ADMIN', 'PROFESSOR'])] },
    async (request, reply) => {
      const user = (request as any).user;
      const { id } = request.params as { id: string };
      const current = await (prisma as any).academicAssignment.findUnique({ where: { id } });
      if (!current) {
        return reply.status(404).send({ error: 'Not Found', message: 'Atividade não encontrada.' });
      }
      if (!(await canManageClass(user, current.classId))) {
        return reply.status(403).send({ error: 'Forbidden', message: 'Professor não vinculado a esta turma.' });
      }

      await (prisma as any).academicAssignment.delete({ where: { id } });
      return reply.send({ message: 'Atividade removida.' });
    }
  );
}
