import { FastifyInstance } from 'fastify';
import { CodewarsService } from '../services/codewars.service.js';
import { CodewarsBulkService } from '../services/codewarsBulk.service.js';
import { authenticate } from '../middlewares/authenticate.js';
import { requireRole } from '../middlewares/requireRole.js';
import { importCodewarsChallengeSchema } from '@fatecode/shared';
import { z } from 'zod';

export async function codewarsRoutes(fastify: FastifyInstance) {
  fastify.get('/challenges/:idOrSlug', { preHandler: [authenticate] }, async (request, reply) => {
    const { idOrSlug } = request.params as { idOrSlug: string };

    try {
      const challenge = await CodewarsService.getChallenge(idOrSlug);
      return reply.send({ data: challenge });
    } catch (err: any) {
      if (String(err.message).includes('404')) {
        return reply.status(404).send({ error: 'Not Found', message: 'Desafio não encontrado no Codewars.' });
      }
      return reply.status(502).send({
        error: 'Bad Gateway',
        message: `Falha ao consultar API pública do Codewars: ${err.message}`,
      });
    }
  });

  fastify.get('/users/:username', { preHandler: [authenticate] }, async (request, reply) => {
    const { username } = request.params as { username: string };

    try {
      const user = await CodewarsService.getUser(username);
      return reply.send({ data: user });
    } catch (err: any) {
      if (String(err.message).includes('404')) {
        return reply.status(404).send({ error: 'Not Found', message: 'Usuário não encontrado no Codewars.' });
      }
      return reply.status(502).send({
        error: 'Bad Gateway',
        message: `Falha ao consultar perfil do Codewars: ${err.message}`,
      });
    }
  });

  fastify.get('/users/:username/completed', { preHandler: [authenticate] }, async (request, reply) => {
    const { username } = request.params as { username: string };
    const querySchema = z.object({
      page: z.coerce.number().min(0).default(0),
    });

    const parsed = querySchema.safeParse(request.query);
    const page = parsed.success ? parsed.data.page : 0;

    try {
      const data = await CodewarsService.getUserCompletedChallenges(username, page);
      return reply.send({ data });
    } catch (err: any) {
      return reply.status(502).send({
        error: 'Bad Gateway',
        message: `Falha ao consultar desafios concluídos no Codewars: ${err.message}`,
      });
    }
  });

  // Import a reviewed challenge with teacher-provided starter code and tests.
  fastify.post(
    '/import',
    { preHandler: [authenticate, requireRole(['ADMIN', 'PROFESSOR'])] },
    async (request, reply) => {
      const parsed = importCodewarsChallengeSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Validation Error', details: parsed.error.errors });
      }

      try {
        const imported = await CodewarsService.importChallenge(parsed.data);
        return reply.status(201).send({
          message: 'Desafio do Codewars importado com sucesso para a plataforma.',
          data: imported,
        });
      } catch (err: any) {
        return reply.status(400).send({
          error: 'Import Error',
          message: err.message,
        });
      }
    }
  );

  // Bulk source: completed kata from one public Codewars profile.
  // Imported records are drafts because Codewars API v1 does not expose submission tests.
  fastify.post(
    '/import-bulk',
    { preHandler: [authenticate, requireRole(['ADMIN', 'PROFESSOR'])] },
    async (request, reply) => {
      const schema = z.object({
        username: z.string().min(1),
        limit: z.coerce.number().int().min(1).max(100).default(100),
        language: z.enum(['JAVASCRIPT', 'TYPESCRIPT', 'PYTHON', 'JAVA', 'C', 'CPP']).default('JAVASCRIPT'),
      });
      const parsed = schema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Validation Error', details: parsed.error.errors });
      }

      try {
        const summary = await CodewarsBulkService.importCompletedAsDrafts(
          parsed.data.username,
          parsed.data.limit,
          parsed.data.language
        );
        return reply.status(201).send({
          message: 'Importação em lote concluída. Os itens entraram como rascunhos e precisam de testes antes de serem liberados aos alunos.',
          data: summary,
        });
      } catch (err: any) {
        return reply.status(502).send({
          error: 'Bulk Import Error',
          message: err.message,
        });
      }
    }
  );
}
