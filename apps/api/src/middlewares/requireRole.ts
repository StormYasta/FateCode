import { FastifyRequest, FastifyReply } from 'fastify';
import { Role } from '@fatecode/shared';

export function requireRole(allowedRoles: Role[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user;
    if (!user) {
      return reply.status(401).send({ error: 'Unauthorized', message: 'Não autenticado.' });
    }

    if (!allowedRoles.includes(user.role)) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Você não tem permissão para realizar esta ação.',
        requiredRoles: allowedRoles,
        userRole: user.role,
      });
    }
  };
}
