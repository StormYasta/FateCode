import { FastifyInstance } from 'fastify';
import { prisma } from '../plugins/prisma.js';
import { authenticate } from '../middlewares/authenticate.js';
import { requireRole } from '../middlewares/requireRole.js';
import { z } from 'zod';

export async function communityRoutes(fastify: FastifyInstance) {
  // Get Peer Community Solutions (Strictly locked until user completes the challenge)
  fastify.get('/challenges/:id/community-solutions', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = (request as any).user;

    const challenge = await (prisma as any).challenge.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });

    if (!challenge) {
      return reply.status(404).send({ error: 'Not Found', message: 'Desafio não encontrado.' });
    }

    // Check if user is Professor/Admin OR has accepted submission
    const isTeacherOrAdmin = user.role === 'ADMIN' || user.role === 'PROFESSOR';
    const userCompleted = await (prisma as any).submission.findFirst({
      where: {
        userId: user.id,
        challengeId: challenge.id,
        status: 'ACCEPTED',
      },
    });

    if (!isTeacherOrAdmin && !userCompleted) {
      return reply.status(403).send({
        error: 'Forbidden',
        locked: true,
        message: '🔒 Soluções da comunidade bloqueadas. Resolva o desafio para desbloquear as soluções de outros estudantes.',
      });
    }

    // Fetch accepted peer submissions
    const solutions = await (prisma as any).submission.findMany({
      where: {
        challengeId: challenge.id,
        status: 'ACCEPTED',
      },
      select: {
        id: true,
        code: true,
        language: true,
        executionTimeMs: true,
        submittedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            role: true,
            classMemberships: {
              select: {
                class: {
                  select: { name: true, code: true },
                },
              },
            },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
      take: 50,
    });

    return reply.send({
      unlocked: true,
      data: solutions,
    });
  });

  // Get Comments for Challenge
  fastify.get('/challenges/:id/comments', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const challenge = await (prisma as any).challenge.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });

    if (!challenge) {
      return reply.status(404).send({ error: 'Not Found', message: 'Desafio não encontrado.' });
    }

    const comments = await (prisma as any).comment.findMany({
      where: {
        challengeId: challenge.id,
        parentId: null, // top-level comments
        isHidden: false,
      },
      include: {
        user: {
          select: { id: true, name: true, role: true, avatarUrl: true },
        },
        replies: {
          where: { isHidden: false },
          include: {
            user: {
              select: { id: true, name: true, role: true, avatarUrl: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    });

    return reply.send({ data: comments });
  });

  // Post Comment or Reply
  fastify.post('/challenges/:id/comments', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = (request as any).user;

    const schema = z.object({
      content: z.string().min(2, 'O comentário deve ter pelo menos 2 caracteres'),
      parentId: z.string().uuid().optional().nullable(),
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

    const comment = await (prisma as any).comment.create({
      data: {
        userId: user.id,
        challengeId: challenge.id,
        content: parsed.data.content,
        parentId: parsed.data.parentId || null,
      },
      include: {
        user: {
          select: { id: true, name: true, role: true, avatarUrl: true },
        },
      },
    });

    return reply.status(201).send({ message: 'Comentário publicado.', data: comment });
  });

  // Pin Comment (Professor or Admin)
  fastify.patch(
    '/comments/:id/pin',
    { preHandler: [authenticate, requireRole(['ADMIN', 'PROFESSOR'])] },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      const existing = await (prisma as any).comment.findUnique({ where: { id } });
      if (!existing) {
        return reply.status(404).send({ error: 'Not Found', message: 'Comentário não encontrado.' });
      }

      const updated = await (prisma as any).comment.update({
        where: { id },
        data: { isPinned: !existing.isPinned },
      });

      return reply.send({ message: 'Status de fixação atualizado.', isPinned: updated.isPinned });
    }
  );

  // Delete Comment (Author, Professor, or Admin)
  fastify.delete('/comments/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = (request as any).user;

    const comment = await (prisma as any).comment.findUnique({ where: { id } });
    if (!comment) {
      return reply.status(404).send({ error: 'Not Found', message: 'Comentário não encontrado.' });
    }

    const canDelete = user.role === 'ADMIN' || user.role === 'PROFESSOR' || comment.userId === user.id;
    if (!canDelete) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Você não tem permissão para excluir este comentário.' });
    }

    await (prisma as any).comment.delete({ where: { id } });

    return reply.send({ message: 'Comentário excluído com sucesso.' });
  });
}
