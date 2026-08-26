import { FastifyInstance } from 'fastify';
import { prisma } from '../plugins/prisma.js';
import { authenticate } from '../middlewares/authenticate.js';
import { requireRole } from '../middlewares/requireRole.js';
import { createFacultySchema, updateFacultySchema } from '@fatecode/shared';

export async function facultyRoutes(fastify: FastifyInstance) {
  // List all faculties
  fastify.get('/', { preHandler: [authenticate] }, async (request, reply) => {
    const faculties = await (prisma as any).faculty.findMany({
      include: {
        _count: {
          select: { courses: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return reply.send({ data: faculties });
  });

  // Get Faculty by ID with courses
  fastify.get('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const faculty = await (prisma as any).faculty.findUnique({
      where: { id },
      include: {
        courses: {
          include: {
            _count: {
              select: { classes: true },
            },
          },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!faculty) {
      return reply.status(404).send({ error: 'Not Found', message: 'Faculdade não encontrada.' });
    }

    return reply.send({ data: faculty });
  });

  // Create Faculty (Admin only)
  fastify.post(
    '/',
    { preHandler: [authenticate, requireRole(['ADMIN'])] },
    async (request, reply) => {
      const parsed = createFacultySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Validation Error', details: parsed.error.errors });
      }

      const existing = await (prisma as any).faculty.findUnique({
        where: { code: parsed.data.code.toUpperCase() },
      });

      if (existing) {
        return reply.status(409).send({ error: 'Conflict', message: 'Já existe uma faculdade com este código.' });
      }

      const faculty = await (prisma as any).faculty.create({
        data: {
          name: parsed.data.name,
          code: parsed.data.code.toUpperCase(),
          city: parsed.data.city,
          state: parsed.data.state,
        },
      });

      return reply.status(201).send({ message: 'Faculdade criada com sucesso.', data: faculty });
    }
  );

  // Update Faculty (Admin only)
  fastify.put(
    '/:id',
    { preHandler: [authenticate, requireRole(['ADMIN'])] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const parsed = updateFacultySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Validation Error', details: parsed.error.errors });
      }

      const updated = await (prisma as any).faculty.update({
        where: { id },
        data: {
          ...(parsed.data.name && { name: parsed.data.name }),
          ...(parsed.data.code && { code: parsed.data.code.toUpperCase() }),
          ...(parsed.data.city !== undefined && { city: parsed.data.city }),
          ...(parsed.data.state !== undefined && { state: parsed.data.state }),
        },
      });

      return reply.send({ message: 'Faculdade atualizada com sucesso.', data: updated });
    }
  );

  // Delete Faculty (Admin only)
  fastify.delete(
    '/:id',
    { preHandler: [authenticate, requireRole(['ADMIN'])] },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      await (prisma as any).faculty.delete({
        where: { id },
      });

      return reply.send({ message: 'Faculdade removida com sucesso.' });
    }
  );
}
