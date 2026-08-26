import { FastifyInstance } from 'fastify';
import { prisma } from '../plugins/prisma.js';
import { authenticate } from '../middlewares/authenticate.js';
import { requireRole } from '../middlewares/requireRole.js';
import { createCourseSchema, updateCourseSchema } from '@fatecode/shared';
import { z } from 'zod';

export async function courseRoutes(fastify: FastifyInstance) {
  // List courses
  fastify.get('/', { preHandler: [authenticate] }, async (request, reply) => {
    const querySchema = z.object({
      facultyId: z.string().optional(),
    });

    const parsed = querySchema.safeParse(request.query);
    const where: any = {};
    if (parsed.success && parsed.data.facultyId) {
      where.facultyId = parsed.data.facultyId;
    }

    const courses = await (prisma as any).course.findMany({
      where,
      include: {
        faculty: {
          select: { id: true, name: true, code: true },
        },
        _count: {
          select: { classes: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return reply.send({ data: courses });
  });

  // Get Course by ID with classes
  fastify.get('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const course = await (prisma as any).course.findUnique({
      where: { id },
      include: {
        faculty: true,
        classes: {
          include: {
            _count: {
              select: { members: true },
            },
          },
          orderBy: [{ year: 'desc' }, { semester: 'asc' }],
        },
      },
    });

    if (!course) {
      return reply.status(404).send({ error: 'Not Found', message: 'Curso não encontrado.' });
    }

    return reply.send({ data: course });
  });

  // Create Course (Admin only)
  fastify.post(
    '/',
    { preHandler: [authenticate, requireRole(['ADMIN'])] },
    async (request, reply) => {
      const parsed = createCourseSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Validation Error', details: parsed.error.errors });
      }

      // Check if faculty exists
      const faculty = await (prisma as any).faculty.findUnique({
        where: { id: parsed.data.facultyId },
      });

      if (!faculty) {
        return reply.status(404).send({ error: 'Not Found', message: 'Faculdade especificada não existe.' });
      }

      // Check unique constraint (facultyId + code)
      const existing = await (prisma as any).course.findUnique({
        where: {
          facultyId_code: {
            facultyId: parsed.data.facultyId,
            code: parsed.data.code.toUpperCase(),
          },
        },
      });

      if (existing) {
        return reply.status(409).send({ error: 'Conflict', message: 'Já existe um curso com este código nesta faculdade.' });
      }

      const course = await (prisma as any).course.create({
        data: {
          name: parsed.data.name,
          code: parsed.data.code.toUpperCase(),
          description: parsed.data.description,
          facultyId: parsed.data.facultyId,
        },
        include: {
          faculty: true,
        },
      });

      return reply.status(201).send({ message: 'Curso criado com sucesso.', data: course });
    }
  );

  // Update Course (Admin only)
  fastify.put(
    '/:id',
    { preHandler: [authenticate, requireRole(['ADMIN'])] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const parsed = updateCourseSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Validation Error', details: parsed.error.errors });
      }

      const updated = await (prisma as any).course.update({
        where: { id },
        data: {
          ...(parsed.data.name && { name: parsed.data.name }),
          ...(parsed.data.code && { code: parsed.data.code.toUpperCase() }),
          ...(parsed.data.description !== undefined && { description: parsed.data.description }),
        },
        include: {
          faculty: true,
        },
      });

      return reply.send({ message: 'Curso atualizado com sucesso.', data: updated });
    }
  );

  // Delete Course (Admin only)
  fastify.delete(
    '/:id',
    { preHandler: [authenticate, requireRole(['ADMIN'])] },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      await (prisma as any).course.delete({
        where: { id },
      });

      return reply.send({ message: 'Curso removido com sucesso.' });
    }
  );
}
