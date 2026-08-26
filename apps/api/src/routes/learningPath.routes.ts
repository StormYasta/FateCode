import { FastifyInstance } from 'fastify';
import { prisma } from '../plugins/prisma.js';
import { authenticate } from '../middlewares/authenticate.js';
import { requireRole } from '../middlewares/requireRole.js';
import { createLearningPathSchema, updateLearningPathSchema } from '@fatecode/shared';
import { z } from 'zod';

export async function learningPathRoutes(fastify: FastifyInstance) {
  // List Learning Paths
  fastify.get('/', { preHandler: [authenticate] }, async (request, reply) => {
    const querySchema = z.object({
      courseId: z.string().optional(),
    });

    const parsed = querySchema.safeParse(request.query);
    const where: any = {};
    if (parsed.success && parsed.data.courseId) {
      where.courseId = parsed.data.courseId;
    }

    const paths = await (prisma as any).learningPath.findMany({
      where,
      include: {
        course: {
          select: { id: true, name: true, code: true },
        },
        modules: {
          include: {
            topics: {
              include: {
                _count: { select: { challenges: true } },
              },
            },
          },
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { modules: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return reply.send({ data: paths });
  });

  // Get Learning Path by ID or Slug with full nested hierarchy
  fastify.get('/:idOrSlug', { preHandler: [authenticate] }, async (request, reply) => {
    const { idOrSlug } = request.params as { idOrSlug: string };

    const path = await (prisma as any).learningPath.findFirst({
      where: {
        OR: [
          { id: idOrSlug },
          { slug: idOrSlug },
        ],
      },
      include: {
        course: {
          include: {
            faculty: true,
          },
        },
        modules: {
          include: {
            topics: {
              include: {
                challenges: {
                  select: {
                    id: true,
                    title: true,
                    slug: true,
                    description: true,
                    difficulty: true,
                    source: true,
                    language: true,
                    tags: true,
                    xpReward: true,
                    isDaily: true,
                    createdAt: true,
                  },
                  orderBy: { xpReward: 'asc' },
                },
              },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!path) {
      return reply.status(404).send({ error: 'Not Found', message: 'Trilha de aprendizagem não encontrada.' });
    }

    return reply.send({ data: path });
  });

  // Create Learning Path (Admin or Professor)
  fastify.post(
    '/',
    { preHandler: [authenticate, requireRole(['ADMIN', 'PROFESSOR'])] },
    async (request, reply) => {
      const parsed = createLearningPathSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Validation Error', details: parsed.error.errors });
      }

      const existing = await (prisma as any).learningPath.findUnique({
        where: { slug: parsed.data.slug },
      });

      if (existing) {
        return reply.status(409).send({ error: 'Conflict', message: 'Já existe uma trilha com este identificador (slug).' });
      }

      const path = await (prisma as any).learningPath.create({
        data: {
          title: parsed.data.title,
          slug: parsed.data.slug.toLowerCase(),
          description: parsed.data.description,
          courseId: parsed.data.courseId,
        },
        include: {
          course: true,
        },
      });

      return reply.status(201).send({ message: 'Trilha criada com sucesso.', data: path });
    }
  );

  // Update Learning Path (Admin or Professor)
  fastify.put(
    '/:id',
    { preHandler: [authenticate, requireRole(['ADMIN', 'PROFESSOR'])] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const parsed = updateLearningPathSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Validation Error', details: parsed.error.errors });
      }

      const updated = await (prisma as any).learningPath.update({
        where: { id },
        data: {
          ...(parsed.data.title && { title: parsed.data.title }),
          ...(parsed.data.slug && { slug: parsed.data.slug.toLowerCase() }),
          ...(parsed.data.description !== undefined && { description: parsed.data.description }),
          ...(parsed.data.courseId !== undefined && { courseId: parsed.data.courseId }),
        },
      });

      return reply.send({ message: 'Trilha atualizada com sucesso.', data: updated });
    }
  );

  // Delete Learning Path (Admin or Professor)
  fastify.delete(
    '/:id',
    { preHandler: [authenticate, requireRole(['ADMIN', 'PROFESSOR'])] },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      await (prisma as any).learningPath.delete({
        where: { id },
      });

      return reply.send({ message: 'Trilha removida com sucesso.' });
    }
  );
}
