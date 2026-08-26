import { FastifyInstance } from 'fastify';
import { prisma } from '../plugins/prisma.js';
import { authenticate } from '../middlewares/authenticate.js';
import { requireRole } from '../middlewares/requireRole.js';
import { createClassSchema, updateClassSchema, addClassMemberSchema, Role, ClassRole } from '@fatecode/shared';
import { z } from 'zod';

export async function classRoutes(fastify: FastifyInstance) {
  // List classes
  fastify.get('/', { preHandler: [authenticate] }, async (request, reply) => {
    const querySchema = z.object({
      courseId: z.string().optional(),
      year: z.coerce.number().optional(),
      semester: z.string().optional(),
    });

    const parsed = querySchema.safeParse(request.query);
    const where: any = {};

    if (parsed.success) {
      if (parsed.data.courseId) where.courseId = parsed.data.courseId;
      if (parsed.data.year) where.year = parsed.data.year;
      if (parsed.data.semester) where.semester = parsed.data.semester;
    }

    const classes = await (prisma as any).class.findMany({
      where,
      include: {
        course: {
          include: {
            faculty: {
              select: { id: true, name: true, code: true },
            },
          },
        },
        _count: {
          select: { members: true },
        },
      },
      orderBy: [{ year: 'desc' }, { semester: 'asc' }, { name: 'asc' }],
    });

    return reply.send({ data: classes });
  });

  // Get Class by ID with full member list
  fastify.get('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const classData = await (prisma as any).class.findUnique({
      where: { id },
      include: {
        course: {
          include: {
            faculty: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatarUrl: true,
                profile: {
                  select: {
                    totalXP: true,
                    githubUsername: true,
                  },
                },
                streak: {
                  select: {
                    currentStreak: true,
                    maxStreak: true,
                  },
                },
              },
            },
          },
          orderBy: { role: 'desc' },
        },
      },
    });

    if (!classData) {
      return reply.status(404).send({ error: 'Not Found', message: 'Turma não encontrada.' });
    }

    return reply.send({ data: classData });
  });

  // Create Class (Admin and Professor)
  fastify.post(
    '/',
    { preHandler: [authenticate, requireRole(['ADMIN', 'PROFESSOR'])] },
    async (request, reply) => {
      const userReq = (request as any).user;
      const parsed = createClassSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Validation Error', details: parsed.error.errors });
      }

      // Verify course exists
      const course = await (prisma as any).course.findUnique({
        where: { id: parsed.data.courseId },
      });

      if (!course) {
        return reply.status(404).send({ error: 'Not Found', message: 'Curso especificado não existe.' });
      }

      // Check unique constraint (courseId + code)
      const existing = await (prisma as any).class.findUnique({
        where: {
          courseId_code: {
            courseId: parsed.data.courseId,
            code: parsed.data.code.toUpperCase(),
          },
        },
      });

      if (existing) {
        return reply.status(409).send({ error: 'Conflict', message: 'Já existe uma turma com este código neste curso.' });
      }

      const newClass = await (prisma as any).class.create({
        data: {
          name: parsed.data.name,
          code: parsed.data.code.toUpperCase(),
          semester: parsed.data.semester,
          year: parsed.data.year,
          courseId: parsed.data.courseId,
          // If created by a professor, automatically add them as instructor
          ...(userReq.role === 'PROFESSOR' && {
            members: {
              create: {
                userId: userReq.id,
                role: 'PROFESSOR' as ClassRole,
              },
            },
          }),
        },
        include: {
          course: true,
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true, role: true },
              },
            },
          },
        },
      });

      return reply.status(201).send({ message: 'Turma criada com sucesso.', data: newClass });
    }
  );

  // Update Class (Admin and Professor)
  fastify.put(
    '/:id',
    { preHandler: [authenticate, requireRole(['ADMIN', 'PROFESSOR'])] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const parsed = updateClassSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Validation Error', details: parsed.error.errors });
      }

      const updated = await (prisma as any).class.update({
        where: { id },
        data: {
          ...(parsed.data.name && { name: parsed.data.name }),
          ...(parsed.data.code && { code: parsed.data.code.toUpperCase() }),
          ...(parsed.data.semester && { semester: parsed.data.semester }),
          ...(parsed.data.year && { year: parsed.data.year }),
        },
        include: {
          course: true,
        },
      });

      return reply.send({ message: 'Turma atualizada com sucesso.', data: updated });
    }
  );

  // Delete Class (Admin only)
  fastify.delete(
    '/:id',
    { preHandler: [authenticate, requireRole(['ADMIN'])] },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      await (prisma as any).class.delete({
        where: { id },
      });

      return reply.send({ message: 'Turma removida com sucesso.' });
    }
  );

  // Add Member to Class (Admin or Professor)
  fastify.post(
    '/:id/members',
    { preHandler: [authenticate, requireRole(['ADMIN', 'PROFESSOR'])] },
    async (request, reply) => {
      const { id: classId } = request.params as { id: string };
      const parsed = addClassMemberSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Validation Error', details: parsed.error.errors });
      }

      // Check if class exists
      const classExists = await (prisma as any).class.findUnique({ where: { id: classId } });
      if (!classExists) {
        return reply.status(404).send({ error: 'Not Found', message: 'Turma não encontrada.' });
      }

      // Check if user exists
      const userExists = await (prisma as any).user.findUnique({ where: { id: parsed.data.userId } });
      if (!userExists) {
        return reply.status(404).send({ error: 'Not Found', message: 'Usuário não encontrado.' });
      }

      // Check if membership already exists
      const existingMember = await (prisma as any).classMember.findUnique({
        where: {
          classId_userId: {
            classId,
            userId: parsed.data.userId,
          },
        },
      });

      if (existingMember) {
        return reply.status(409).send({ error: 'Conflict', message: 'Usuário já está matriculado nesta turma.' });
      }

      const membership = await (prisma as any).classMember.create({
        data: {
          classId,
          userId: parsed.data.userId,
          role: parsed.data.role as ClassRole,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              avatarUrl: true,
            },
          },
        },
      });

      return reply.status(201).send({ message: 'Membro adicionado à turma com sucesso.', data: membership });
    }
  );

  // Remove Member from Class (Admin or Professor)
  fastify.delete(
    '/:id/members/:userId',
    { preHandler: [authenticate, requireRole(['ADMIN', 'PROFESSOR'])] },
    async (request, reply) => {
      const { id: classId, userId } = request.params as { id: string; userId: string };

      await (prisma as any).classMember.delete({
        where: {
          classId_userId: {
            classId,
            userId,
          },
        },
      });

      return reply.send({ message: 'Membro removido da turma com sucesso.' });
    }
  );
}
