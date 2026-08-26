import { FastifyInstance } from 'fastify';
import { prisma } from '../plugins/prisma.js';
import { authenticate } from '../middlewares/authenticate.js';
import { requireRole } from '../middlewares/requireRole.js';
import { buildValidationChallengeCatalog } from '../services/validationCatalog.service.js';

export async function adminRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/overview',
    { preHandler: [authenticate, requireRole(['ADMIN'])] },
    async (_request, reply) => {
      const [users, professors, students, classes, courses, challenges, assignments] = await Promise.all([
        (prisma as any).user.count(),
        (prisma as any).user.count({ where: { role: 'PROFESSOR', isActive: true } }),
        (prisma as any).user.count({ where: { role: 'STUDENT', isActive: true } }),
        (prisma as any).class.count(),
        (prisma as any).course.count(),
        (prisma as any).challenge.count(),
        (prisma as any).assignment.count(),
      ]);

      return reply.send({
        data: { users, professors, students, classes, courses, challenges, assignments },
      });
    }
  );

  fastify.post(
    '/bootstrap/challenges',
    { preHandler: [authenticate, requireRole(['ADMIN'])] },
    async (_request, reply) => {
      const catalog = buildValidationChallengeCatalog();
      const before = await (prisma as any).challenge.count({
        where: { tags: { has: 'validation-catalog' } },
      });

      const result = await (prisma as any).challenge.createMany({
        data: catalog,
        skipDuplicates: true,
      });

      const after = await (prisma as any).challenge.count({
        where: { tags: { has: 'validation-catalog' } },
      });

      return reply.status(201).send({
        message: 'Catálogo de validação processado com sucesso.',
        data: {
          requested: catalog.length,
          created: result.count,
          validationCatalogBefore: before,
          validationCatalogAfter: after,
        },
      });
    }
  );
}
