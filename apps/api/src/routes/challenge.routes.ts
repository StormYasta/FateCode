import { FastifyInstance } from 'fastify';
import { prisma } from '../plugins/prisma.js';
import { authenticate } from '../middlewares/authenticate.js';
import { requireRole } from '../middlewares/requireRole.js';
import { createChallengeSchema, updateChallengeSchema } from '@fatecode/shared';
import { z } from 'zod';

export async function challengeRoutes(fastify: FastifyInstance) {
  // List Challenges (catalog)
  fastify.get('/', { preHandler: [authenticate] }, async (request, reply) => {
    const querySchema = z.object({
      topicId: z.string().optional(),
      difficulty: z.enum(['KYU_8', 'KYU_7', 'KYU_6', 'KYU_5', 'KYU_4', 'KYU_3', 'KYU_2', 'KYU_1']).optional(),
      language: z.enum(['JAVASCRIPT', 'TYPESCRIPT', 'PYTHON', 'JAVA', 'C', 'CPP']).optional(),
      search: z.string().optional(),
      tag: z.string().optional(),
    });

    const parsed = querySchema.safeParse(request.query);
    const where: any = {};

    if (parsed.success) {
      const { topicId, difficulty, language, search, tag } = parsed.data;
      if (topicId) where.topicId = topicId;
      if (difficulty) where.difficulty = difficulty;
      if (language) where.language = language;
      if (tag) where.tags = { has: tag };
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }
    }

    const challenges = await (prisma as any).challenge.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        difficulty: true,
        source: true,
        externalId: true,
        language: true,
        tags: true,
        xpReward: true,
        isDaily: true,
        topicId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [{ xpReward: 'asc' }, { title: 'asc' }],
    });

    return reply.send({ data: challenges });
  });

  // Get Challenge by ID or Slug
  fastify.get('/:idOrSlug', { preHandler: [authenticate] }, async (request, reply) => {
    const { idOrSlug } = request.params as { idOrSlug: string };
    const user = (request as any).user;
    const isElevated = user.role === 'ADMIN' || user.role === 'PROFESSOR';

    const challenge = await (prisma as any).challenge.findFirst({
      where: {
        OR: [
          { id: idOrSlug },
          { slug: idOrSlug },
        ],
      },
      include: {
        topic: {
          include: {
            module: {
              include: {
                learningPath: true,
              },
            },
          },
        },
      },
    });

    if (!challenge) {
      return reply.status(404).send({ error: 'Not Found', message: 'Desafio não encontrado.' });
    }

    // Never return hiddenTests to students
    if (!isElevated) {
      const { hiddenTests: _, ...safeChallenge } = challenge;
      return reply.send({ data: safeChallenge });
    }

    return reply.send({ data: challenge });
  });

  // Create Challenge (Admin or Professor)
  fastify.post(
    '/',
    { preHandler: [authenticate, requireRole(['ADMIN', 'PROFESSOR'])] },
    async (request, reply) => {
      const parsed = createChallengeSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Validation Error', details: parsed.error.errors });
      }

      const existing = await (prisma as any).challenge.findUnique({
        where: { slug: parsed.data.slug },
      });

      if (existing) {
        return reply.status(409).send({ error: 'Conflict', message: 'Já existe um desafio com este slug.' });
      }

      const challenge = await (prisma as any).challenge.create({
        data: {
          title: parsed.data.title,
          slug: parsed.data.slug.toLowerCase(),
          description: parsed.data.description,
          difficulty: parsed.data.difficulty,
          source: parsed.data.source,
          externalId: parsed.data.externalId,
          language: parsed.data.language,
          initialCode: parsed.data.initialCode,
          testCode: parsed.data.testCode,
          publicTests: parsed.data.publicTests,
          hiddenTests: parsed.data.hiddenTests,
          tags: parsed.data.tags,
          xpReward: parsed.data.xpReward,
          isDaily: parsed.data.isDaily,
          topicId: parsed.data.topicId,
        },
      });

      return reply.status(201).send({ message: 'Desafio criado com sucesso.', data: challenge });
    }
  );

  // Update Challenge (Admin or Professor)
  fastify.put(
    '/:id',
    { preHandler: [authenticate, requireRole(['ADMIN', 'PROFESSOR'])] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const parsed = updateChallengeSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Validation Error', details: parsed.error.errors });
      }

      const updated = await (prisma as any).challenge.update({
        where: { id },
        data: {
          ...(parsed.data.title && { title: parsed.data.title }),
          ...(parsed.data.slug && { slug: parsed.data.slug.toLowerCase() }),
          ...(parsed.data.description && { description: parsed.data.description }),
          ...(parsed.data.difficulty && { difficulty: parsed.data.difficulty }),
          ...(parsed.data.language && { language: parsed.data.language }),
          ...(parsed.data.initialCode && { initialCode: parsed.data.initialCode }),
          ...(parsed.data.testCode !== undefined && { testCode: parsed.data.testCode }),
          ...(parsed.data.publicTests !== undefined && { publicTests: parsed.data.publicTests }),
          ...(parsed.data.hiddenTests !== undefined && { hiddenTests: parsed.data.hiddenTests }),
          ...(parsed.data.tags && { tags: parsed.data.tags }),
          ...(parsed.data.xpReward && { xpReward: parsed.data.xpReward }),
          ...(parsed.data.topicId !== undefined && { topicId: parsed.data.topicId }),
        },
      });

      return reply.send({ message: 'Desafio atualizado com sucesso.', data: updated });
    }
  );

  // Delete Challenge (Admin or Professor)
  fastify.delete(
    '/:id',
    { preHandler: [authenticate, requireRole(['ADMIN', 'PROFESSOR'])] },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      await (prisma as any).challenge.delete({
        where: { id },
      });

      return reply.send({ message: 'Desafio removido com sucesso.' });
    }
  );
}
