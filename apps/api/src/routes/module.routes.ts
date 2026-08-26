import { FastifyInstance } from 'fastify';
import { prisma } from '../plugins/prisma.js';
import { authenticate } from '../middlewares/authenticate.js';
import { requireRole } from '../middlewares/requireRole.js';
import { createModuleSchema, updateModuleSchema } from '@fatecode/shared';

export async function moduleRoutes(fastify: FastifyInstance) {
  // Create Module in a Learning Path
  fastify.post(
    '/',
    { preHandler: [authenticate, requireRole(['ADMIN', 'PROFESSOR'])] },
    async (request, reply) => {
      const parsed = createModuleSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Validation Error', details: parsed.error.errors });
      }

      const pathExists = await (prisma as any).learningPath.findUnique({
        where: { id: parsed.data.learningPathId },
      });

      if (!pathExists) {
        return reply.status(404).send({ error: 'Not Found', message: 'Trilha de aprendizagem não encontrada.' });
      }

      const newModule = await (prisma as any).module.create({
        data: {
          title: parsed.data.title,
          description: parsed.data.description,
          order: parsed.data.order,
          learningPathId: parsed.data.learningPathId,
        },
      });

      return reply.status(201).send({ message: 'Módulo criado com sucesso.', data: newModule });
    }
  );

  // Update Module
  fastify.put(
    '/:id',
    { preHandler: [authenticate, requireRole(['ADMIN', 'PROFESSOR'])] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const parsed = updateModuleSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Validation Error', details: parsed.error.errors });
      }

      const updated = await (prisma as any).module.update({
        where: { id },
        data: {
          ...(parsed.data.title && { title: parsed.data.title }),
          ...(parsed.data.description !== undefined && { description: parsed.data.description }),
          ...(parsed.data.order !== undefined && { order: parsed.data.order }),
        },
      });

      return reply.send({ message: 'Módulo atualizado com sucesso.', data: updated });
    }
  );

  // Delete Module
  fastify.delete(
    '/:id',
    { preHandler: [authenticate, requireRole(['ADMIN', 'PROFESSOR'])] },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      await (prisma as any).module.delete({
        where: { id },
      });

      return reply.send({ message: 'Módulo removido com sucesso.' });
    }
  );
}
