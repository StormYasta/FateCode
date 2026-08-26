import { FastifyInstance } from 'fastify';
import { prisma } from '../plugins/prisma.js';
import { authenticate } from '../middlewares/authenticate.js';
import { requireRole } from '../middlewares/requireRole.js';
import { createTopicSchema, updateTopicSchema } from '@fatecode/shared';

export async function topicRoutes(fastify: FastifyInstance) {
  // Create Topic in a Module
  fastify.post(
    '/',
    { preHandler: [authenticate, requireRole(['ADMIN', 'PROFESSOR'])] },
    async (request, reply) => {
      const parsed = createTopicSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Validation Error', details: parsed.error.errors });
      }

      const moduleExists = await (prisma as any).module.findUnique({
        where: { id: parsed.data.moduleId },
      });

      if (!moduleExists) {
        return reply.status(404).send({ error: 'Not Found', message: 'Módulo não encontrado.' });
      }

      const newTopic = await (prisma as any).topic.create({
        data: {
          title: parsed.data.title,
          description: parsed.data.description,
          order: parsed.data.order,
          moduleId: parsed.data.moduleId,
        },
      });

      return reply.status(201).send({ message: 'Tópico criado com sucesso.', data: newTopic });
    }
  );

  // Update Topic
  fastify.put(
    '/:id',
    { preHandler: [authenticate, requireRole(['ADMIN', 'PROFESSOR'])] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const parsed = updateTopicSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Validation Error', details: parsed.error.errors });
      }

      const updated = await (prisma as any).topic.update({
        where: { id },
        data: {
          ...(parsed.data.title && { title: parsed.data.title }),
          ...(parsed.data.description !== undefined && { description: parsed.data.description }),
          ...(parsed.data.order !== undefined && { order: parsed.data.order }),
        },
      });

      return reply.send({ message: 'Tópico atualizado com sucesso.', data: updated });
    }
  );

  // Delete Topic
  fastify.delete(
    '/:id',
    { preHandler: [authenticate, requireRole(['ADMIN', 'PROFESSOR'])] },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      await (prisma as any).topic.delete({
        where: { id },
      });

      return reply.send({ message: 'Tópico removido com sucesso.' });
    }
  );
}
