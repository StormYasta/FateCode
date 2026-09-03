import { FastifyInstance } from 'fastify';
import { prisma } from '../plugins/prisma.js';
import { authenticate } from '../middlewares/authenticate.js';
import { requireRole } from '../middlewares/requireRole.js';
import {
  createAssignmentSchema,
  updateAssignmentSchema,
  createAcademicAssignmentSchema,
  updateAcademicAssignmentSchema,
} from '@fatecode/shared';
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

export async function assignmentRoutes(fastify: FastifyInstance) {
  // Unified class activity feed. Programming and Discrete Math remain separate models.
  fastify.get('/', { preHandler: [authenticate] }, async (request, reply) => {
    const parsed = z.object({ classId: z.string().optional() }).safeParse(request.query);
    const user = (request as any).user;
    const programmingWhere: any = {};
    const academicWhere: any = {};

    if (parsed.success && parsed.data.classId) {
      programmingWhere.classId = parsed.data.classId;
      academicWhere.classId = parsed.data.classId;
    } else if (user.role === 'STUDENT') {
      const memberFilter = { members: { some: { userId: user.id } } };
      programmingWhere.class = memberFilter;
      academicWhere.class = memberFilter;
    }

    const [programmingAssignments, academicAssignments] = await Promise.all([
      (prisma as any).assignment.findMany({
        where: programmingWhere,
        include: {
          class: { select: { id: true, name: true, code: true, semester: true, year: true } },
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
          _count: { select: { submissions: true } },
        },
      }),
      (prisma as any).academicAssignment.findMany({
        where: academicWhere,
        include: {
          class: { select: { id: true, name: true, code: true, semester: true, year: true } },
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
      }),
    ]);

    const data = [
      ...programmingAssignments.map((item: any) => ({ ...item, module: 'PROGRAMMING' })),
      ...academicAssignments.map((item: any) => ({
        ...item,
        module: 'DISCRETE_MATH',
        challenge: null,
        academicExercise: item.exercise,
      })),
    ].sort((a: any, b: any) => {
      const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      if (aDue !== bDue) return aDue - bDue;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return reply.send({ data });
  });

  fastify.get('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const programming = await (prisma as any).assignment.findUnique({
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
      },
    });

    if (programming) return reply.send({ data: { ...programming, module: 'PROGRAMMING' } });

    const academic = await (prisma as any).academicAssignment.findUnique({
      where: { id },
      include: {
        class: { include: { course: true } },
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
          },
        },
      },
    });

    if (!academic) {
      return reply.status(404).send({ error: 'Not Found', message: 'Atividade não encontrada.' });
    }

    return reply.send({
      data: { ...academic, module: 'DISCRETE_MATH', challenge: null, academicExercise: academic.exercise },
    });
  });

  fastify.post(
    '/',
    { preHandler: [authenticate, requireRole(['ADMIN', 'PROFESSOR'])] },
    async (request, reply) => {
      const user = (request as any).user;
      const body = request.body as any;

      if (body?.academicExerciseId) {
        const parsed = createAcademicAssignmentSchema.safeParse({
          ...body,
          exerciseId: body.academicExerciseId,
        });
        if (!parsed.success) {
          return reply.status(400).send({ error: 'Validation Error', details: parsed.error.errors });
        }

        const classExists = await (prisma as any).class.findUnique({ where: { id: parsed.data.classId } });
        if (!classExists) return reply.status(404).send({ error: 'Not Found', message: 'Turma não encontrada.' });
        if (!(await canManageClass(user, parsed.data.classId))) {
          return reply.status(403).send({ error: 'Forbidden', message: 'Professor não vinculado a esta turma.' });
        }

        const exercise = await (prisma as any).academicExercise.findUnique({ where: { id: parsed.data.exerciseId } });
        if (!exercise) {
          return reply.status(404).send({ error: 'Not Found', message: 'Exercício de Matemática Discreta não encontrado.' });
        }

        const created = await (prisma as any).academicAssignment.create({
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

        return reply.status(201).send({
          message: 'Atividade de Matemática Discreta criada.',
          data: { ...created, module: 'DISCRETE_MATH', challenge: null, academicExercise: created.exercise },
        });
      }

      const parsed = createAssignmentSchema.safeParse(body);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Validation Error', details: parsed.error.errors });
      }

      const classExists = await (prisma as any).class.findUnique({ where: { id: parsed.data.classId } });
      if (!classExists) return reply.status(404).send({ error: 'Not Found', message: 'Turma não encontrada.' });

      const challengeExists = await (prisma as any).challenge.findUnique({ where: { id: parsed.data.challengeId } });
      if (!challengeExists) return reply.status(404).send({ error: 'Not Found', message: 'Desafio não encontrado.' });

      const assignment = await (prisma as any).assignment.create({
        data: {
          title: parsed.data.title,
          classId: parsed.data.classId,
          challengeId: parsed.data.challengeId,
          startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : new Date(),
          dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
          isOptional: parsed.data.isOptional,
        },
        include: { class: true, challenge: true },
      });

      return reply.status(201).send({ message: 'Atividade vinculada à turma com sucesso.', data: assignment });
    }
  );

  fastify.put(
    '/:id',
    { preHandler: [authenticate, requireRole(['ADMIN', 'PROFESSOR'])] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const programming = await (prisma as any).assignment.findUnique({ where: { id } });

      if (programming) {
        const parsed = updateAssignmentSchema.safeParse(request.body);
        if (!parsed.success) return reply.status(400).send({ error: 'Validation Error', details: parsed.error.errors });
        const updated = await (prisma as any).assignment.update({
          where: { id },
          data: {
            ...(parsed.data.title && { title: parsed.data.title }),
            ...(parsed.data.startDate && { startDate: new Date(parsed.data.startDate) }),
            ...(parsed.data.dueDate !== undefined && { dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null }),
            ...(parsed.data.isOptional !== undefined && { isOptional: parsed.data.isOptional }),
          },
        });
        return reply.send({ message: 'Atividade atualizada com sucesso.', data: updated });
      }

      const academic = await (prisma as any).academicAssignment.findUnique({ where: { id } });
      if (!academic) return reply.status(404).send({ error: 'Not Found', message: 'Atividade não encontrada.' });

      const parsed = updateAcademicAssignmentSchema.safeParse(request.body);
      if (!parsed.success) return reply.status(400).send({ error: 'Validation Error', details: parsed.error.errors });
      const updated = await (prisma as any).academicAssignment.update({
        where: { id },
        data: {
          ...(parsed.data.title && { title: parsed.data.title }),
          ...(parsed.data.startDate && { startDate: new Date(parsed.data.startDate) }),
          ...(parsed.data.dueDate !== undefined && { dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null }),
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
      const programming = await (prisma as any).assignment.findUnique({ where: { id } });
      if (programming) {
        await (prisma as any).assignment.delete({ where: { id } });
        return reply.send({ message: 'Atividade removida com sucesso.' });
      }

      const academic = await (prisma as any).academicAssignment.findUnique({ where: { id } });
      if (!academic) return reply.status(404).send({ error: 'Not Found', message: 'Atividade não encontrada.' });
      await (prisma as any).academicAssignment.delete({ where: { id } });
      return reply.send({ message: 'Atividade removida com sucesso.' });
    }
  );
}
