import { FastifyInstance } from 'fastify';
import { CodewarsService } from '../services/codewars.service.js';
import { authenticate } from '../middlewares/authenticate.js';
import { requireRole } from '../middlewares/requireRole.js';
import { importCodewarsChallengeSchema } from '@fatecode/shared';
import { z } from 'zod';

export async function codewarsRoutes(fastify: FastifyInstance) {
  // Get Challenge info from Codewars (Internal cached endpoint)
  fastify.get('/challenges/:idOrSlug', { preHandler: [authenticate] }, async (request, reply) => {
    const { idOrSlug } = request.params as { idOrSlug: string };

    try {
      const challenge = await CodewarsService.getChallenge(idOrSlug);
      return reply.send({ data: challenge });
    } catch (err: any) {
      if (err.response?.status === 404) {
        return reply.status(404).send({ error: 'Not Found', message: 'Desafio não encontrado no Codewars.' });
      }
      return reply.status(502).send({
        error: 'Bad Gateway',
        message: `Falha ao consultar API pública do Codewars: ${err.message}`,
      });
    }
  });

  // Get Codewars User Profile
  fastify.get('/users/:username', { preHandler: [authenticate] }, async (request, reply) => {
    const { username } = request.params as { username: string };

    try {
      const user = await CodewarsService.getUser(username);
      return reply.send({ data: user });
    } catch (err: any) {
      if (err.response?.status === 404) {
        return reply.status(404).send({ error: 'Not Found', message: 'Usuário não encontrado no Codewars.' });
      }
      return reply.status(502).send({
        error: 'Bad Gateway',
        message: `Falha ao consultar perfil do Codewars: ${err.message}`,
      });
    }
  });

  // Get Codewars User Completed Challenges
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

  // Import Codewars Challenge into Platform (Admin or Professor)
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
}
